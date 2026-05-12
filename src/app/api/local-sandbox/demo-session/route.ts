import { NextRequest, NextResponse } from "next/server";
import {
  HMRC_SANDBOX_DEMO_SESSION_COOKIE,
  HMRC_SANDBOX_DEMO_SESSION_VALUE,
} from "@/server/hmrc";

export const dynamic = "force-dynamic";

export function POST(request: NextRequest): NextResponse {
  const appEnvironment = process.env.APP_ENV?.trim();
  const hmrcEnvironment = process.env.HMRC_ENV?.trim();
  const redirectUrl = new URL("/", request.url);

  if (appEnvironment !== "local" || hmrcEnvironment !== "sandbox") {
    redirectUrl.searchParams.set("hmrcSandboxDemo", "disabled");
    return NextResponse.redirect(redirectUrl, 303);
  }

  redirectUrl.searchParams.set("hmrcSandboxDemo", "active");

  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.set({
    name: HMRC_SANDBOX_DEMO_SESSION_COOKIE,
    value: HMRC_SANDBOX_DEMO_SESSION_VALUE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}
