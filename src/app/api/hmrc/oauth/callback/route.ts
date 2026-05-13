import { NextRequest, NextResponse } from "next/server";
import {
  canDisplaySandboxOAuthTokenInCallback,
  createSandboxOAuthTokenSession,
  exchangeSandboxOAuthCode,
  getSandboxOAuthSuccessStatusText,
  HMRC_SANDBOX_OAUTH_SESSION_COOKIE,
  HmrcSandboxOAuthError,
  renderSandboxOAuthCallbackPage,
  summariseTokenForCallback,
} from "@/server/hmrc";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const callbackUrl = new URL(request.url);
  const hmrcError = callbackUrl.searchParams.get("error");
  const localhostCallback = isLocalhostCallback(callbackUrl);

  if (hmrcError !== null) {
    return htmlResponse(
      renderSandboxOAuthCallbackPage({
        ok: false,
        title: "HMRC Sandbox OAuth Failed",
        statusText: "HMRC authorisation did not complete.",
        detail: callbackUrl.searchParams.get("error_description") ?? hmrcError,
        localhostCallback,
      }),
      400,
    );
  }

  try {
    const token = await exchangeSandboxOAuthCode({
      code: callbackUrl.searchParams.get("code") ?? "",
      state: callbackUrl.searchParams.get("state") ?? "",
    });
    const tokenSession = createSandboxOAuthTokenSession({
      token,
      env: process.env,
    });
    const tokenDisplayEnabled = canDisplaySandboxOAuthTokenInCallback({
      requestUrl: callbackUrl,
      source: process.env,
    });
    const response = htmlResponse(
      renderSandboxOAuthCallbackPage({
        ok: true,
        title: "HMRC Sandbox OAuth Complete",
        statusText: getSandboxOAuthSuccessStatusText({
          requestUrl: callbackUrl,
          tokenSessionStored: tokenSession.ok,
        }),
        accessToken: tokenDisplayEnabled ? token.accessToken : undefined,
        summary: summariseTokenForCallback(token),
        tokenDisplayEnabled,
        tokenSessionStored: tokenSession.ok,
        localhostCallback,
      }),
      200,
    );

    if (tokenSession.ok) {
      response.cookies.set({
        name: HMRC_SANDBOX_OAUTH_SESSION_COOKIE,
        value: tokenSession.cookieValue,
        httpOnly: true,
        secure: callbackUrl.protocol === "https:",
        sameSite: "strict",
        path: "/",
        maxAge: tokenSession.maxAgeSeconds,
      });
    }

    return response;
  } catch (error) {
    return htmlResponse(
      renderSandboxOAuthCallbackPage({
        ok: false,
        title: "HMRC Sandbox OAuth Failed",
        statusText: "OAuth token exchange did not complete.",
        detail: safeErrorMessage(error),
        statusCode:
          error instanceof HmrcSandboxOAuthError ? error.statusCode : undefined,
        hmrcError:
          error instanceof HmrcSandboxOAuthError ? error.hmrcError : undefined,
        localhostCallback,
      }),
      400,
    );
  }
}

function htmlResponse(body: string, status: number): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof HmrcSandboxOAuthError || error instanceof Error) {
    return error.message;
  }

  return "HMRC sandbox OAuth callback failed.";
}

function isLocalhostCallback(url: URL): boolean {
  return (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1"
  );
}
