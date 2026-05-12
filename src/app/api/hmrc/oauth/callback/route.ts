import { NextRequest, NextResponse } from "next/server";
import {
  exchangeSandboxOAuthCode,
  HmrcSandboxOAuthError,
  sandboxOAuthTokenDisplayEnabled,
  summariseSandboxOAuthToken,
} from "@/server/hmrc";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const callbackUrl = new URL(request.url);
  const hmrcError = callbackUrl.searchParams.get("error");

  if (hmrcError !== null) {
    return noStoreJson(
      {
        ok: false,
        error: "hmrc_authorisation_denied",
        hmrcError,
        errorDescription: callbackUrl.searchParams.get("error_description"),
      },
      400,
    );
  }

  try {
    const token = await exchangeSandboxOAuthCode({
      code: callbackUrl.searchParams.get("code") ?? "",
      state: callbackUrl.searchParams.get("state") ?? "",
    });

    if (sandboxOAuthTokenDisplayEnabled()) {
      return noStoreJson(
        {
          ok: true,
          mode: "local-sandbox-oauth",
          warning:
            "Do not commit this token. Set it only in your local shell as HMRC_SANDBOX_ACCESS_TOKEN.",
          accessToken: token.accessToken,
          tokenType: token.tokenType,
          expiresIn: token.expiresIn,
          scope: token.scope,
          hasRefreshToken:
            token.refreshToken !== undefined && token.refreshToken.length > 0,
        },
        200,
      );
    }

    return noStoreJson(
      {
        ok: true,
        mode: "local-sandbox-oauth",
        token: summariseSandboxOAuthToken(token),
        next:
          "Set HMRC_SANDBOX_OAUTH_SHOW_TOKENS=true temporarily and repeat the OAuth journey if you need the access token displayed locally.",
      },
      200,
    );
  } catch (error) {
    return noStoreJson(
      {
        ok: false,
        error: "hmrc_sandbox_oauth_callback_failed",
        detail: safeErrorMessage(error),
        statusCode:
          error instanceof HmrcSandboxOAuthError ? error.statusCode : undefined,
        hmrcError:
          error instanceof HmrcSandboxOAuthError ? error.hmrcError : undefined,
      },
      400,
    );
  }
}

function noStoreJson(
  body: Readonly<Record<string, unknown>>,
  status: number,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
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
