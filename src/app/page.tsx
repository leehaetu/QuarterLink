import { WorkspaceShell } from "./workspace-shell";
import { cookies } from "next/headers";
import {
  getSandboxOAuthUiState,
  getQl008FraudCollectorUiState,
  HMRC_SANDBOX_DEMO_SESSION_COOKIE,
  isSandboxDemoSessionCookieActive,
} from "@/server/hmrc";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();

  return (
    <WorkspaceShell
      hmrcSandboxOAuth={getSandboxOAuthUiState(process.env, {
        sandboxDemoSessionActive: isSandboxDemoSessionCookieActive(
          cookieStore.get(HMRC_SANDBOX_DEMO_SESSION_COOKIE)?.value,
        ),
      })}
      ql008FraudCollector={getQl008FraudCollectorUiState(process.env)}
    />
  );
}
