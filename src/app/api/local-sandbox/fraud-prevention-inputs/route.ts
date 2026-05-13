import { NextRequest, NextResponse } from "next/server";
import {
  collectQl008FraudPreventionInputs,
  getQl008FraudCollectorUiState,
  QL_008_DEVICE_ID_COOKIE_MAX_AGE_SECONDS,
  QL_008_DEVICE_ID_COOKIE_NAME,
  resolveQl008DeviceIdCookie,
  type Ql008BrowserFraudInputPayload,
} from "@/server/hmrc";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const uiState = getQl008FraudCollectorUiState(process.env);

  if (!uiState.enabled) {
    return noStoreJson(
      {
        error:
          "QL-008 fraud-prevention input collection is available only when APP_ENV=local and HMRC_ENV=sandbox.",
      },
      403,
    );
  }

  const payload = await readBrowserPayload(request);
  const deviceIdCookie = resolveQl008DeviceIdCookie({
    cookieValue: request.cookies.get(QL_008_DEVICE_ID_COOKIE_NAME)?.value,
    env: process.env,
  });

  if (!deviceIdCookie.ok) {
    return noStoreJson(
      {
        error:
          deviceIdCookie.reason === "missing-cookie-secret"
            ? "QL-008 device ID cookie secret is not configured."
            : "QL-008 fraud-prevention input collection is available only when APP_ENV=local and HMRC_ENV=sandbox.",
      },
      deviceIdCookie.reason === "missing-cookie-secret" ? 500 : 403,
    );
  }

  const result = collectQl008FraudPreventionInputs({
    browser: payload,
    deviceId: deviceIdCookie.deviceId,
    headers: request.headers,
    env: process.env,
  });

  const response = noStoreJson(result, 200);

  if (deviceIdCookie.shouldSetCookie) {
    response.cookies.set({
      name: QL_008_DEVICE_ID_COOKIE_NAME,
      value: deviceIdCookie.signedCookieValue,
      httpOnly: true,
      maxAge: QL_008_DEVICE_ID_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

async function readBrowserPayload(
  request: NextRequest,
): Promise<Ql008BrowserFraudInputPayload> {
  try {
    const payload: unknown = await request.json();

    if (payload !== null && typeof payload === "object" && !Array.isArray(payload)) {
      return payload as Ql008BrowserFraudInputPayload;
    }
  } catch {
    return {};
  }

  return {};
}

function noStoreJson(payload: unknown, status: number): NextResponse {
  const response = NextResponse.json(payload, { status });
  response.headers.set("Cache-Control", "no-store");

  return response;
}
