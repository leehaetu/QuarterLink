"use client";

import { useMemo, useState } from "react";
import type {
  Ql008BrowserFraudInputPayload,
  Ql008FraudCollectorUiState,
  Ql008FraudInputCollectionResult,
  Ql008FraudVariableName,
} from "@/server/hmrc";

interface Ql008FraudPreventionCollectorProps {
  readonly collector: Ql008FraudCollectorUiState;
}

export function Ql008FraudPreventionCollector({
  collector,
}: Ql008FraudPreventionCollectorProps) {
  const [result, setResult] = useState<Ql008FraudInputCollectionResult>();
  const [error, setError] = useState<string>();
  const [isCollecting, setIsCollecting] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const requiredManualVariables = useMemo(
    () => result?.manualOverrideRequired.filter(isRequiredQl008Variable) ?? [],
    [result],
  );

  if (!collector.enabled) {
    return null;
  }

  const collectInputs = async () => {
    setIsCollecting(true);
    setError(undefined);
    setCopyState("idle");

    try {
      const response = await fetch(collector.endpointPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(collectBrowserFraudInputs()),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        setResult(undefined);
        setError(readErrorMessage(payload));
        return;
      }

      setResult(payload as Ql008FraudInputCollectionResult);
    } catch {
      setResult(undefined);
      setError("Local fraud-prevention input collection failed.");
    } finally {
      setIsCollecting(false);
    }
  };

  const copySnippet = async () => {
    if (result === undefined) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.envSnippet);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <section
      aria-labelledby="ql008-fraud-collector-heading"
      className="rounded-lg border border-teal-700 bg-white p-5 shadow-sm shadow-slate-200/50"
    >
      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-normal text-teal-800">
          QL-008 sandbox only
        </p>
        <h2
          id="ql008-fraud-collector-heading"
          className="mt-1 text-base font-semibold text-slate-950"
        >
          Step 2: Fraud-prevention input collector
        </h2>
      </div>

      <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-950">
        <p className="font-semibold">Sandbox warning</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Not production.</li>
          <li>Do not paste collected values into chat.</li>
          <li>Do not commit `.env.local`.</li>
          <li>No HMRC API call or HMRC submission call is made here.</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={collectInputs}
        disabled={isCollecting}
        className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-wait disabled:bg-slate-300"
      >
        {isCollecting
          ? "Collecting local inputs"
          : "Collect local fraud-prevention inputs"}
      </button>

      {error !== undefined ? (
        <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-900">
          {error}
        </p>
      ) : null}

      {result !== undefined ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-2 text-sm">
            <div className="rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                Automatically collected
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {
                  result.automaticallyCollected.filter(isRequiredQl008Variable)
                    .length
                }{" "}
                required values
              </p>
            </div>
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-normal text-amber-800">
                Manual override still needed
              </p>
              <p className="mt-1 text-sm font-semibold text-amber-950">
                {requiredManualVariables.length} required values
              </p>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-3">
            <h3 className="text-sm font-semibold text-slate-950">
              Required variables not collected automatically
            </h3>
            {requiredManualVariables.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-700">
                {requiredManualVariables.map((variable) => (
                  <li key={variable} className="font-mono">
                    {variable}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-700">
                All required QL-008 fraud-prevention variables were collected.
              </p>
            )}
          </div>

          <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-slate-950">
                `.env.local` snippet
              </h3>
              <button
                type="button"
                onClick={copySnippet}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
              >
                Copy snippet
              </button>
            </div>
            <textarea
              readOnly
              value={result.envSnippet}
              spellCheck={false}
              aria-label="QL-008 local env snippet"
              className="mt-3 min-h-72 w-full resize-y rounded-md border border-slate-300 bg-[#fafbf8] p-3 font-mono text-xs leading-5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
            {copyState === "copied" ? (
              <p className="mt-2 text-xs font-semibold text-teal-800">
                Snippet copied locally.
              </p>
            ) : null}
            {copyState === "failed" ? (
              <p className="mt-2 text-xs font-semibold text-amber-900">
                Browser clipboard access failed. Select the snippet locally.
              </p>
            ) : null}
          </div>

          <div className="rounded-md border border-slate-200 bg-[#fafbf8] px-3 py-3">
            <h3 className="text-sm font-semibold text-slate-950">
              Collection notes
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-700">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function collectBrowserFraudInputs(): Ql008BrowserFraudInputPayload {
  return {
    browserJsUserAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenScalingFactor: window.devicePixelRatio,
    screenColourDepth: window.screen.colorDepth,
    timezone: formatTimezoneOffset(new Date()),
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
  };
}

function formatTimezoneOffset(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (absoluteMinutes % 60).toString().padStart(2, "0");

  return `UTC${sign}${hours}:${minutes}`;
}

function readErrorMessage(payload: unknown): string {
  if (
    payload !== null &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    typeof (payload as { readonly error?: unknown }).error === "string"
  ) {
    return (payload as { readonly error: string }).error;
  }

  return "Local fraud-prevention input collection was not available.";
}

function isRequiredQl008Variable(variable: Ql008FraudVariableName): boolean {
  return variable !== "QL_008_FRAUD_VENDOR_VERSION";
}
