import { NextRequest, NextResponse } from "next/server";
import {
  HMRC_SANDBOX_DEMO_SESSION_COOKIE,
  HMRC_SANDBOX_OAUTH_SESSION_COOKIE,
  isSandboxDemoSessionCookieActive,
  redactEvidenceValue,
  resolveSandboxOAuthTokenSession,
  runQl008SandboxDiscovery,
} from "@/server/hmrc";

export const dynamic = "force-dynamic";

type MutableEnvironment = Record<string, string | undefined>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(process.env.APP_ENV === "local" && process.env.HMRC_ENV === "sandbox")) {
    return noStoreJson(
      {
        ok: false,
        error: "ql008_sandbox_discovery_disabled",
        detail:
          "QL-008 sandbox discovery is available only when APP_ENV=local and HMRC_ENV=sandbox.",
      },
      403,
    );
  }

  if (
    !isSandboxDemoSessionCookieActive(
      request.cookies.get(HMRC_SANDBOX_DEMO_SESSION_COOKIE)?.value,
    )
  ) {
    return noStoreJson(
      {
        ok: false,
        error: "ql008_sandbox_demo_required",
        detail:
          "Continue as the temporary QL-008 sandbox demo user before running guarded sandbox discovery.",
      },
      403,
    );
  }

  const tokenSession = resolveSandboxOAuthTokenSession({
    cookieValue: request.cookies.get(HMRC_SANDBOX_OAUTH_SESSION_COOKIE)?.value,
    env: process.env,
  });
  const env = buildDiscoveryEnvironment({
    source: process.env,
    requestUrl: request.url,
    sessionAccessToken: tokenSession.ok ? tokenSession.accessToken : undefined,
  });
  const result = await runQl008SandboxDiscovery({
    env,
    allowHmrcNetworkCalls:
      process.env.QL_008_DISCOVERY_ALLOW_HMRC_CALLS?.trim() === "true",
  });

  return noStoreJson(
    redactEvidenceValue({
      ticket: "QL-008",
      mode: "sandbox-discovery",
      tokenSource: tokenSession.ok
        ? "sandbox oauth session"
        : isLocalhostUrl(request.url)
          ? "local environment if configured"
          : "not available",
      ok: result.ok,
      generatedAt: result.generatedAt,
      hmrcNetworkCallsAttempted: result.hmrcNetworkCallsAttempted,
      hmrcSubmissionCallsAttempted: result.hmrcSubmissionCallsAttempted,
      blockers: result.blockers,
      missingFraudPreventionInputs: result.missingFraudPreventionInputs,
      fraudPreventionHeaderBuild: result.fraudPreventionHeaderBuild,
      items: result.items,
      fphApplicationAuth: result.fphApplicationToken,
      testFraudPreventionHeaders: result.testFraudPreventionHeaders,
      businessDetails: result.businessDetails,
      obligations: result.obligations,
    }),
    200,
  );
}

function buildDiscoveryEnvironment(input: {
  readonly source: NodeJS.ProcessEnv;
  readonly requestUrl: string;
  readonly sessionAccessToken?: string;
}): MutableEnvironment {
  const env: MutableEnvironment = { ...input.source };

  if (input.sessionAccessToken !== undefined) {
    env.HMRC_SANDBOX_ACCESS_TOKEN = input.sessionAccessToken;
    return env;
  }

  if (!isLocalhostUrl(input.requestUrl)) {
    delete env.HMRC_SANDBOX_ACCESS_TOKEN;
  }

  return env;
}

function isLocalhostUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1"
    );
  } catch {
    return false;
  }
}

function noStoreJson(payload: unknown, status: number): NextResponse {
  const response = NextResponse.json(payload, { status });
  response.headers.set("Cache-Control", "no-store");

  return response;
}
