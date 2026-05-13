import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { HmrcSandboxOAuthTokenResponse } from "./oauth";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export const HMRC_SANDBOX_OAUTH_SESSION_COOKIE =
  "quarterlink_hmrc_sandbox_oauth_session";
export const HMRC_SANDBOX_OAUTH_SESSION_MAX_AGE_SECONDS = 60 * 60;

interface StoredSandboxOAuthTokenSession {
  readonly accessToken: string;
  readonly expiresAtMs: number;
}

export type SandboxOAuthTokenSessionCreateResult =
  | {
      readonly ok: true;
      readonly cookieValue: string;
      readonly expiresAt: string;
      readonly maxAgeSeconds: number;
    }
  | {
      readonly ok: false;
      readonly reason: "disabled" | "missing-token" | "expired-token";
    };

export type SandboxOAuthTokenSessionResolveResult =
  | {
      readonly ok: true;
      readonly accessToken: string;
      readonly expiresAt: string;
    }
  | {
      readonly ok: false;
      readonly reason:
        | "disabled"
        | "missing-cookie"
        | "invalid-cookie"
        | "missing-session"
        | "expired-session";
    };

export interface SandboxOAuthTokenSessionSafeState {
  readonly enabled: boolean;
  readonly active: boolean;
  readonly expiresAt?: string;
  readonly reason?: SandboxOAuthTokenSessionResolveResult extends infer Result
    ? Result extends { readonly ok: false; readonly reason: infer Reason }
      ? Reason
      : never
    : never;
}

const sessionStore = new Map<string, StoredSandboxOAuthTokenSession>();
const runtimeCookieSigningSecret = randomBytes(32);

export function createSandboxOAuthTokenSession(input: {
  readonly token: HmrcSandboxOAuthTokenResponse;
  readonly env?: EnvironmentSource;
  readonly now?: () => number;
  readonly sessionId?: string;
}): SandboxOAuthTokenSessionCreateResult {
  const env = input.env ?? process.env;

  if (!sandboxTokenSessionEnabled(env)) {
    return { ok: false, reason: "disabled" };
  }

  const accessToken = input.token.accessToken.trim();

  if (accessToken.length === 0) {
    return { ok: false, reason: "missing-token" };
  }

  const nowMs = (input.now ?? (() => Date.now()))();
  const expiresAtMs = resolveSessionExpiryMs(input.token, nowMs);

  if (expiresAtMs <= nowMs) {
    return { ok: false, reason: "expired-token" };
  }

  const sessionId = input.sessionId ?? randomBase64Url(32);
  sessionStore.set(sessionId, {
    accessToken,
    expiresAtMs,
  });

  return {
    ok: true,
    cookieValue: signSessionId(sessionId),
    expiresAt: new Date(expiresAtMs).toISOString(),
    maxAgeSeconds: Math.max(1, Math.floor((expiresAtMs - nowMs) / 1000)),
  };
}

export function resolveSandboxOAuthTokenSession(input: {
  readonly cookieValue?: string;
  readonly env?: EnvironmentSource;
  readonly now?: () => number;
}): SandboxOAuthTokenSessionResolveResult {
  const env = input.env ?? process.env;

  if (!sandboxTokenSessionEnabled(env)) {
    return { ok: false, reason: "disabled" };
  }

  if (input.cookieValue === undefined || input.cookieValue.trim().length === 0) {
    return { ok: false, reason: "missing-cookie" };
  }

  const sessionId = verifySessionCookie(input.cookieValue);

  if (sessionId === undefined) {
    return { ok: false, reason: "invalid-cookie" };
  }

  const session = sessionStore.get(sessionId);

  if (session === undefined) {
    return { ok: false, reason: "missing-session" };
  }

  const nowMs = (input.now ?? (() => Date.now()))();

  if (session.expiresAtMs <= nowMs) {
    sessionStore.delete(sessionId);
    return { ok: false, reason: "expired-session" };
  }

  return {
    ok: true,
    accessToken: session.accessToken,
    expiresAt: new Date(session.expiresAtMs).toISOString(),
  };
}

export function getSandboxOAuthTokenSessionSafeState(input: {
  readonly cookieValue?: string;
  readonly env?: EnvironmentSource;
  readonly now?: () => number;
}): SandboxOAuthTokenSessionSafeState {
  const env = input.env ?? process.env;

  if (!sandboxTokenSessionEnabled(env)) {
    return { enabled: false, active: false, reason: "disabled" };
  }

  const resolved = resolveSandboxOAuthTokenSession(input);

  if (!resolved.ok) {
    return {
      enabled: true,
      active: false,
      reason: resolved.reason,
    };
  }

  return {
    enabled: true,
    active: true,
    expiresAt: resolved.expiresAt,
  };
}

export function sandboxTokenSessionEnabled(
  env: EnvironmentSource = process.env,
): boolean {
  return env.APP_ENV?.trim() === "local" && env.HMRC_ENV?.trim() === "sandbox";
}

export function clearSandboxOAuthTokenSessionsForTest(): void {
  sessionStore.clear();
}

function resolveSessionExpiryMs(
  token: HmrcSandboxOAuthTokenResponse,
  nowMs: number,
): number {
  const maxExpiryMs = nowMs + HMRC_SANDBOX_OAUTH_SESSION_MAX_AGE_SECONDS * 1000;
  const tokenExpiryMs =
    token.expiresAt === undefined ? maxExpiryMs : Date.parse(token.expiresAt);

  if (!Number.isFinite(tokenExpiryMs)) {
    return maxExpiryMs;
  }

  return Math.min(maxExpiryMs, tokenExpiryMs);
}

function signSessionId(sessionId: string): string {
  return `${sessionId}.${signValue(sessionId)}`;
}

function verifySessionCookie(cookieValue: string): string | undefined {
  const parts = cookieValue.trim().split(".");

  if (parts.length !== 2) {
    return undefined;
  }

  const [sessionId, signature] = parts;

  if (sessionId.length === 0 || signature.length === 0) {
    return undefined;
  }

  const expectedSignature = signValue(sessionId);

  if (!constantTimeEqual(signature, expectedSignature)) {
    return undefined;
  }

  return sessionId;
}

function signValue(value: string): string {
  return createHmac("sha256", runtimeCookieSigningSecret)
    .update(value)
    .digest("base64url");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function randomBase64Url(byteLength: number): string {
  return randomBytes(byteLength).toString("base64url");
}
