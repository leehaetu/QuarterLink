import { NextRequest, NextResponse } from "next/server";
import {
  exchangeSandboxOAuthCode,
  HmrcSandboxOAuthError,
  sandboxOAuthTokenDisplayEnabled,
  summariseSandboxOAuthToken,
} from "@/server/hmrc";

export const dynamic = "force-dynamic";

type CallbackPageRow = readonly [string, string];

interface CallbackPageInput {
  readonly ok: boolean;
  readonly title: string;
  readonly statusText: string;
  readonly detail?: string;
  readonly statusCode?: number;
  readonly hmrcError?: string;
  readonly accessToken?: string;
  readonly summary?: ReturnType<typeof summariseSandboxOAuthToken>;
  readonly tokenDisplayEnabled?: boolean;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const callbackUrl = new URL(request.url);
  const hmrcError = callbackUrl.searchParams.get("error");

  if (hmrcError !== null) {
    return htmlResponse(
      renderCallbackPage({
        ok: false,
        title: "HMRC Sandbox OAuth Failed",
        statusText: "HMRC authorisation did not complete.",
        detail: callbackUrl.searchParams.get("error_description") ?? hmrcError,
      }),
      400,
    );
  }

  try {
    const token = await exchangeSandboxOAuthCode({
      code: callbackUrl.searchParams.get("code") ?? "",
      state: callbackUrl.searchParams.get("state") ?? "",
    });

    if (sandboxOAuthTokenDisplayEnabled()) {
      return htmlResponse(
        renderCallbackPage({
          ok: true,
          title: "HMRC Sandbox OAuth Complete",
          statusText: "OAuth token exchange succeeded.",
          accessToken: token.accessToken,
          summary: summariseSandboxOAuthToken(token),
          tokenDisplayEnabled: true,
        }),
        200,
      );
    }

    return htmlResponse(
      renderCallbackPage({
        ok: true,
        title: "HMRC Sandbox OAuth Complete",
        statusText: "OAuth token exchange succeeded. Token display is hidden.",
        summary: summariseSandboxOAuthToken(token),
        tokenDisplayEnabled: false,
      }),
      200,
    );
  } catch (error) {
    return htmlResponse(
      renderCallbackPage({
        ok: false,
        title: "HMRC Sandbox OAuth Failed",
        statusText: "OAuth token exchange did not complete.",
        detail: safeErrorMessage(error),
        statusCode:
          error instanceof HmrcSandboxOAuthError ? error.statusCode : undefined,
        hmrcError:
          error instanceof HmrcSandboxOAuthError ? error.hmrcError : undefined,
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

function renderCallbackPage(input: CallbackPageInput): string {
  const badgeClass = input.ok ? "badge badge-success" : "badge badge-error";
  const detailRows: CallbackPageRow[] = [
    ["Environment", "HMRC sandbox only"],
    ["Production", "Not enabled"],
    ["Submission", "No submission made"],
    ["OAuth result", input.statusText],
    ["Next", "Run QL-008 preflight"],
  ];
  const optionalRows: (CallbackPageRow | undefined)[] = [
    input.summary?.tokenType === undefined
      ? undefined
      : ["Token type", input.summary.tokenType],
    input.summary?.expiresIn === undefined
      ? undefined
      : ["Expires in", `${input.summary.expiresIn} seconds`],
    input.summary?.scope === undefined ? undefined : ["Scope", input.summary.scope],
    input.statusCode === undefined
      ? undefined
      : ["Status code", String(input.statusCode)],
    input.hmrcError === undefined ? undefined : ["HMRC error", input.hmrcError],
  ];
  const rows = [
    ...detailRows,
    ...optionalRows.filter((row): row is CallbackPageRow => row !== undefined),
  ];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Arial, Helvetica, sans-serif;
        background: #f7f8f5;
        color: #0f172a;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background: #f7f8f5;
      }
      main {
        margin: 0 auto;
        max-width: 920px;
        padding: 40px 20px;
      }
      .panel {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #ffffff;
        padding: 28px;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
      }
      .badge {
        display: inline-flex;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .badge-success {
        background: #ccfbf1;
        color: #134e4a;
      }
      .badge-error {
        background: #ffe4e6;
        color: #881337;
      }
      h1 {
        margin: 16px 0 10px;
        font-size: 32px;
        line-height: 1.15;
      }
      p {
        color: #475569;
        line-height: 1.65;
      }
      dl {
        display: grid;
        gap: 10px;
        margin: 24px 0;
      }
      .row {
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: #fafbf8;
        padding: 12px;
      }
      dt {
        color: #64748b;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }
      dd {
        margin: 4px 0 0;
        color: #0f172a;
      }
      code,
      textarea {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      }
      code {
        display: block;
        overflow-wrap: anywhere;
        border-radius: 6px;
        background: #f1f5f9;
        padding: 12px;
        color: #0f172a;
        font-size: 13px;
      }
      textarea {
        box-sizing: border-box;
        min-height: 120px;
        width: 100%;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 12px;
        color: #0f172a;
        font-size: 13px;
      }
      .warning {
        border: 1px solid #fcd34d;
        border-radius: 6px;
        background: #fffbeb;
        padding: 12px;
        color: #713f12;
      }
      .error {
        border: 1px solid #fecdd3;
        border-radius: 6px;
        background: #fff1f2;
        padding: 12px;
        color: #881337;
      }
      ul {
        color: #475569;
        line-height: 1.65;
      }
      a {
        color: #0f766e;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="panel" aria-labelledby="callback-title">
        <span class="${badgeClass}">${input.ok ? "Sandbox OAuth" : "Action needed"}</span>
        <h1 id="callback-title">${escapeHtml(input.title)}</h1>
        <p>
          This is a local HMRC sandbox OAuth result. It is not production,
          it has not made an HMRC submission, and it has not called Business Details,
          Obligations, Self Employment Business, or Test Fraud Prevention Headers.
        </p>
        ${input.detail === undefined ? "" : `<p class="error">${escapeHtml(input.detail)}</p>`}
        <dl>
          ${rows
            .map(
              ([label, value]) => `<div class="row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
            )
            .join("")}
        </dl>
        <h2>Next: run QL-008 preflight</h2>
        <code>set -a; source .env.local; set +a; npm run hmrc:sandbox-evidence:preflight</code>
        ${renderTokenSection(input)}
        <h2>Remaining blockers before HMRC API calls</h2>
        <ul>
          <li>Access token must be kept local only.</li>
          <li>Self-employment business ID still needed.</li>
          <li>Tax year still needed.</li>
          <li>Period start and end dates still needed.</li>
          <li>WEB_APP_VIA_SERVER fraud-prevention inputs still needed.</li>
          <li>Test Fraud Prevention Headers validation still needed.</li>
        </ul>
        <p><a href="/">Return to QuarterLink</a></p>
      </section>
    </main>
  </body>
</html>`;
}

function renderTokenSection(
  input: CallbackPageInput,
): string {
  if (!input.ok) {
    return "";
  }

  if (input.tokenDisplayEnabled && input.accessToken !== undefined) {
    return `<div class="warning">
      <h2>Local-only access token</h2>
      <p>
        Copy this value only into your local .env.local or local shell as
        HMRC_SANDBOX_ACCESS_TOKEN. Do not paste it into chat, commit it, write it
        to docs, or include it in run reports.
      </p>
      <textarea readonly aria-label="HMRC sandbox access token">${escapeHtml(input.accessToken)}</textarea>
    </div>`;
  }

  return `<div class="warning">
    <h2>Token display hidden</h2>
    <p>
      Token exchange succeeded, but access token display is hidden. Set
      HMRC_SANDBOX_OAUTH_SHOW_TOKENS=true locally and repeat the OAuth journey if
      you need the access token displayed in this local browser response.
    </p>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
