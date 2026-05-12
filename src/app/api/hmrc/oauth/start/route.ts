import { NextResponse } from "next/server";
import {
  buildSandboxOAuthAuthorisationUrl,
  HmrcSandboxOAuthError,
} from "@/server/hmrc";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
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
