import { WorkspaceShell } from "./workspace-shell";
import { cookies } from "next/headers";
import {
  getSandboxOAuthUiState,
  getQl008FraudCollectorUiState,
  HMRC_SANDBOX_DEMO_SESSION_COOKIE,
  HMRC_SANDBOX_OAUTH_SESSION_COOKIE,
  getSandboxOAuthTokenSessionSafeState,
  isSandboxDemoSessionCookieActive,
} from "@/server/hmrc";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const sandboxTokenSession = getSandboxOAuthTokenSessionSafeState({
    cookieValue: cookieStore.get(HMRC_SANDBOX_OAUTH_SESSION_COOKIE)?.value,
    env: process.env,
  });

  return (
    <WorkspaceShell
      hmrcSandboxOAuth={getSandboxOAuthUiState(process.env, {
        sandboxDemoSessionActive: isSandboxDemoSessionCookieActive(
          cookieStore.get(HMRC_SANDBOX_DEMO_SESSION_COOKIE)?.value,
        ),
        sandboxTokenSessionActive: sandboxTokenSession.active,
      })}
      ql008FraudCollector={getQl008FraudCollectorUiState(process.env)}
    />
  );
}
