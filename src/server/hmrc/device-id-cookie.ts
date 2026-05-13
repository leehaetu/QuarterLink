import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export const QL_008_DEVICE_ID_COOKIE_NAME = "quarterlink_ql008_device_id";
export const QL_008_DEVICE_ID_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type Ql008DeviceIdCookieResult =
  | {
      readonly ok: true;
      readonly deviceId: string;
      readonly signedCookieValue: string;
      readonly shouldSetCookie: boolean;
    }
  | {
      readonly ok: false;
      readonly reason: "collector-disabled" | "missing-cookie-secret";
    };

const cookieVersion = "v1";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function resolveQl008DeviceIdCookie(input: {
  readonly cookieValue?: string;
  readonly env?: EnvironmentSource;
  readonly randomUuid?: () => string;
}): Ql008DeviceIdCookieResult {
  const env = input.env ?? process.env;

  if (!isQl008LocalSandboxEnvironment(env)) {
    return { ok: false, reason: "collector-disabled" };
  }

  const secret = readCookieSecret(env);

  if (secret === undefined) {
    return { ok: false, reason: "missing-cookie-secret" };
  }

  const cookieValue = input.cookieValue;
  const existingDeviceId =
    cookieValue === undefined
      ? undefined
      : verifySignedDeviceIdCookie(cookieValue, secret);

  if (existingDeviceId !== undefined && cookieValue !== undefined) {
    return {
      ok: true,
      deviceId: existingDeviceId,
      signedCookieValue: cookieValue,
      shouldSetCookie: false,
    };
  }

  const deviceId = createDeviceId(input.randomUuid);

  return {
    ok: true,
    deviceId,
    signedCookieValue: signDeviceIdCookie(deviceId, secret),
    shouldSetCookie: true,
  };
}

export function signQl008DeviceIdCookieForTest(input: {
  readonly deviceId: string;
  readonly secret: string;
}): string {
  return signDeviceIdCookie(input.deviceId, input.secret);
}

function isQl008LocalSandboxEnvironment(env: EnvironmentSource): boolean {
  return env.APP_ENV?.trim() === "local" && env.HMRC_ENV?.trim() === "sandbox";
}

function readCookieSecret(env: EnvironmentSource): string | undefined {
  const secret = env.QL_008_DEVICE_COOKIE_SECRET?.trim();

  return secret === undefined || secret.length === 0 ? undefined : secret;
}

function createDeviceId(randomUuid: (() => string) | undefined): string {
  const deviceId = (randomUuid ?? randomUUID)();

  if (!uuidPattern.test(deviceId)) {
    throw new Error("QL-008 device ID generator returned an invalid UUID.");
  }

  return deviceId.toLowerCase();
}

function signDeviceIdCookie(deviceId: string, secret: string): string {
  const normalisedDeviceId = deviceId.trim().toLowerCase();

  if (!uuidPattern.test(normalisedDeviceId)) {
    throw new Error("QL-008 device ID cookie requires a UUID device ID.");
  }

  const payload = `${cookieVersion}.${normalisedDeviceId}`;
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

function verifySignedDeviceIdCookie(
  cookieValue: string,
  secret: string,
): string | undefined {
  const parts = cookieValue.trim().split(".");

  if (parts.length !== 3) {
    return undefined;
  }

  const [version, deviceId, signature] = parts;

  if (version !== cookieVersion || !uuidPattern.test(deviceId)) {
    return undefined;
  }

  const payload = `${version}.${deviceId.toLowerCase()}`;
  const expectedSignature = signPayload(payload, secret);

  if (!constantTimeEqual(signature, expectedSignature)) {
    return undefined;
  }

  return deviceId.toLowerCase();
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
