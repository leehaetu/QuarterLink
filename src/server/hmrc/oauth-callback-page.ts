import {
  sandboxOAuthTokenDisplayEnabled,
  summariseSandboxOAuthToken,
  type HmrcSandboxOAuthTokenResponse,
} from "./oauth";

type EnvironmentSource = Readonly<Record<string, string | undefined>>;
type CallbackPageRow = readonly [string, string];

export interface SandboxOAuthCallbackPageInput {
  readonly ok: boolean;
  readonly title: string;
  readonly statusText: string;
  readonly detail?: string;
  readonly statusCode?: number;
  readonly hmrcError?: string;
  readonly accessToken?: string;
  readonly summary?: ReturnType<typeof summariseSandboxOAuthToken>;
  readonly tokenDisplayEnabled?: boolean;
  readonly tokenSessionStored?: boolean;
  readonly localhostCallback?: boolean;
}

export function canDisplaySandboxOAuthTokenInCallback(input: {
  readonly requestUrl: string | URL;
  readonly source?: EnvironmentSource;
}): boolean {
  return (
    sandboxOAuthTokenDisplayEnabled(input.source) &&
    isLocalhostCallbackUrl(input.requestUrl)
  );
}

export function getSandboxOAuthSuccessStatusText(input: {
  readonly requestUrl: string | URL;
  readonly tokenSessionStored: boolean;
}): string {
  if (!isLocalhostCallbackUrl(input.requestUrl) && input.tokenSessionStored) {
    return "OAuth token exchange succeeded. Token is held only for this sandbox session. No HMRC submission has been made.";
  }

  if (input.tokenSessionStored) {
    return "OAuth token exchange succeeded. Token is held only for this sandbox session.";
  }

  return "OAuth token exchange succeeded. Token display is hidden.";
}

export function renderSandboxOAuthCallbackPage(
  input: SandboxOAuthCallbackPageInput,
): string {
  const badgeClass = input.ok ? "badge badge-success" : "badge badge-error";
  const detailRows: CallbackPageRow[] = [
    ["Environment", "HMRC sandbox only"],
    ["Production", "Not enabled"],
    ["Submission", "No submission made"],
    ["OAuth result", input.statusText],
    [
      "Next",
      input.tokenSessionStored
        ? "Return to QuarterLink and run guarded sandbox discovery."
        : "Return to QuarterLink and review remaining QL-008 blockers.",
    ],
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
      .success {
        border: 1px solid #99f6e4;
        border-radius: 6px;
        background: #f0fdfa;
        padding: 12px;
        color: #134e4a;
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
          This is a QL-008 HMRC sandbox OAuth result. It is not production,
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
        ${renderTokenSection(input)}
        <h2>Remaining blockers before HMRC API calls</h2>
        <ul>
          <li>WEB_APP_VIA_SERVER fraud-prevention inputs still need to be complete.</li>
          <li>Test Fraud Prevention Headers validation still needs to pass.</li>
          <li>Business Details and Obligations remain blocked until the guarded discovery path is allowed to run.</li>
          <li>Self Employment Business cumulative submission was not attempted.</li>
        </ul>
        <p><a href="/">Return to QuarterLink</a></p>
      </section>
    </main>
  </body>
</html>`;
}

export function summariseTokenForCallback(
  token: HmrcSandboxOAuthTokenResponse,
): ReturnType<typeof summariseSandboxOAuthToken> {
  return summariseSandboxOAuthToken(token);
}

function renderTokenSection(input: SandboxOAuthCallbackPageInput): string {
  if (!input.ok) {
    return "";
  }

  if (
    input.localhostCallback === true &&
    input.tokenDisplayEnabled === true &&
    input.accessToken !== undefined
  ) {
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

  if (input.tokenSessionStored === true) {
    return `<div class="success">
      <h2>Sandbox token session</h2>
      <p>
        OAuth token exchange succeeded. Token is held only for this sandbox session.
        No HMRC submission has been made. Return to QuarterLink to run guarded
        sandbox discovery without copying tokens into browser-visible text.
      </p>
    </div>`;
  }

  return `<div class="warning">
    <h2>Token display hidden</h2>
    <p>
      Token exchange succeeded, but access token display is hidden. On localhost
      only, set HMRC_SANDBOX_OAUTH_SHOW_TOKENS=true and repeat the OAuth journey
      if you need the access token displayed in this local browser response.
    </p>
  </div>`;
}

function isLocalhostCallbackUrl(value: string | URL): boolean {
  try {
    const url = value instanceof URL ? value : new URL(value);
    return (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1"
    );
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
