export type QuarterLinkRuntimeEnvironment = "local" | "sandbox" | "production";

export type HmrcEnvironment = "sandbox" | "production";

export type HmrcHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HmrcHeaders = Record<string, string>;

export const HMRC_SANDBOX_API_BASE_URL = "https://test-api.service.hmrc.gov.uk";

export const HMRC_SANDBOX_AUTH_BASE_URL = "https://test-www.tax.service.gov.uk";

export interface HmrcSandboxConfig {
  readonly appEnvironment: QuarterLinkRuntimeEnvironment;
  readonly hmrcEnvironment: "sandbox";
  readonly apiBaseUrl: string;
  readonly authBaseUrl: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
  readonly scopes: readonly string[];
}

export interface HmrcValidationIssue {
  readonly code:
    | "missing"
    | "invalid"
    | "unsupported"
    | "mixed-production-config";
  readonly variable: string;
  readonly message: string;
}

export type HmrcConfigValidationResult =
  | {
      readonly ok: true;
      readonly config: HmrcSandboxConfig;
    }
  | {
      readonly ok: false;
      readonly issues: readonly HmrcValidationIssue[];
    };

export interface HmrcOAuthAuthorisationInput {
  readonly state: string;
  readonly codeChallenge?: string;
}

export interface HmrcRequestInput {
  readonly method: HmrcHttpMethod;
  readonly path: string;
  readonly accessToken: string;
  readonly fraudPreventionHeaders: HmrcHeaders;
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly body?: unknown;
  readonly accept?: string;
  readonly contentType?: string;
  readonly govTestScenario?: string;
}

export interface HmrcPreparedRequest {
  readonly request: {
    readonly method: HmrcHttpMethod;
    readonly url: string;
    readonly headers: HmrcHeaders;
    readonly body?: string;
  };
  readonly safeMetadata: {
    readonly environment: "sandbox";
    readonly method: HmrcHttpMethod;
    readonly url: string;
    readonly headerNames: readonly string[];
    readonly redactedHeaders: HmrcHeaders;
    readonly hasBody: boolean;
  };
}

export interface FraudPreventionScreen {
  readonly width: number;
  readonly height: number;
  readonly scalingFactor: number;
  readonly colourDepth: number;
}

export interface FraudPreventionWindowSize {
  readonly width: number;
  readonly height: number;
}

export interface FraudPreventionMultiFactor {
  readonly type: "TOTP" | "AUTH_CODE" | "OTHER";
  readonly timestamp: string;
  readonly uniqueReference: string;
}

export interface FraudPreventionForwardedHop {
  readonly by: string;
  readonly for: string;
}

export interface ClientCollectedFraudPreventionValues {
  readonly browserJsUserAgent: string;
  readonly deviceId: string;
  readonly multiFactor?: readonly FraudPreventionMultiFactor[];
  readonly screens: readonly FraudPreventionScreen[];
  readonly timezone: string;
  readonly windowSize: FraudPreventionWindowSize;
}

export interface ServerDerivedFraudPreventionValues {
  readonly clientPublicIp: string;
  readonly clientPublicIpTimestamp: string;
  readonly clientPublicPort: number;
  readonly clientUserIds: Readonly<Record<string, string>>;
  readonly vendorForwarded: readonly FraudPreventionForwardedHop[];
  readonly vendorLicenseIds?: Readonly<Record<string, string>>;
  readonly vendorProductName: string;
  readonly vendorPublicIp: string;
  readonly vendorVersion: Readonly<Record<string, string>>;
}

export interface FraudPreventionAssemblyInput {
  readonly client: ClientCollectedFraudPreventionValues;
  readonly server: ServerDerivedFraudPreventionValues;
}

export interface PartialClientCollectedFraudPreventionValues {
  readonly browserJsUserAgent?: string;
  readonly deviceId?: string;
  readonly multiFactor?: readonly FraudPreventionMultiFactor[];
  readonly screens?: readonly FraudPreventionScreen[];
  readonly timezone?: string;
  readonly windowSize?: FraudPreventionWindowSize;
}

export interface PartialServerDerivedFraudPreventionValues {
  readonly clientPublicIp?: string;
  readonly clientPublicIpTimestamp?: string;
  readonly clientPublicPort?: number;
  readonly clientUserIds?: Readonly<Record<string, string>>;
  readonly vendorForwarded?: readonly FraudPreventionForwardedHop[];
  readonly vendorLicenseIds?: Readonly<Record<string, string>>;
  readonly vendorProductName?: string;
  readonly vendorPublicIp?: string;
  readonly vendorVersion?: Readonly<Record<string, string>>;
}

export interface WebAppViaServerFraudPreventionInput {
  readonly client: PartialClientCollectedFraudPreventionValues;
  readonly server: PartialServerDerivedFraudPreventionValues;
  readonly localSandbox?: boolean;
}

export type FraudPreventionHeaderStatus =
  | "present"
  | "missing"
  | "unavailable-on-localhost"
  | "manual-override-required";

export interface FraudPreventionHeaderBuildStatus {
  readonly headerName: string;
  readonly status: FraudPreventionHeaderStatus;
  readonly reason: string;
  readonly variables: readonly string[];
}

export interface FraudPreventionMissingValue {
  readonly headerName: string;
  readonly reason: string;
  readonly status?: FraudPreventionHeaderStatus;
  readonly variables?: readonly string[];
}

export type FraudPreventionAssemblyResult =
  | {
      readonly ok: true;
      readonly headers: HmrcHeaders;
      readonly redactedHeaders: HmrcHeaders;
    }
  | {
      readonly ok: false;
      readonly missing: readonly FraudPreventionMissingValue[];
      readonly redactedHeaders: HmrcHeaders;
    };

export type WebAppViaServerFraudPreventionBuildResult =
  | {
      readonly ok: true;
      readonly headers: HmrcHeaders;
      readonly redactedHeaders: HmrcHeaders;
      readonly statuses: readonly FraudPreventionHeaderBuildStatus[];
    }
  | {
      readonly ok: false;
      readonly headers: HmrcHeaders;
      readonly redactedHeaders: HmrcHeaders;
      readonly statuses: readonly FraudPreventionHeaderBuildStatus[];
      readonly missing: readonly FraudPreventionMissingValue[];
    };
