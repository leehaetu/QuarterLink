import { WorkspaceShell } from "./workspace-shell";
import { getSandboxOAuthUiState } from "@/server/hmrc";

export const dynamic = "force-dynamic";

export default function Home() {
  return <WorkspaceShell hmrcSandboxOAuth={getSandboxOAuthUiState()} />;
}
