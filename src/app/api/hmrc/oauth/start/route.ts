import { NextRequest, NextResponse } from "next/server";
import {
  buildSandboxOAuthAuthorisationUrl,
  HMRC_SANDBOX_DEMO_SESSION_COOKIE,
  HmrcSandboxOAuthError,
  isSandboxDemoSessionCookieActive,
} from "@/server/hmrc";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest): NextResponse {
  if (!(process.env.APP_ENV === "local" && process.env.HMRC_ENV === "sandbox")) {
    return NextResponse.json(
      {
        ok: false,
        error: "quarterlink_sign_in_required",
        detail:
          "A real QuarterLink user must be signed in before connecting HMRC outside the local sandbox demo flow.",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (
    !isSandboxDemoSessionCookieActive(
      request.cookies.get(HMRC_SANDBOX_DEMO_SESSION_COOKIE)?.value,
    )
  ) {
    const url = new URL("/", request.url);
    url.searchParams.set("hmrcSandboxDemo", "required");
    const response = NextResponse.redirect(url, 302);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  try {
    const url = buildSandboxOAuthAuthorisationUrl();
    const response = NextResponse.redirect(url, 302);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "hmrc_sandbox_oauth_not_ready",
        detail: safeErrorMessage(error),
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof HmrcSandboxOAuthError || error instanceof Error) {
    return error.message;
  }

  return "HMRC sandbox OAuth start failed.";
}
