import type {
  FraudPreventionForwardedHop,
  FraudPreventionMultiFactor,
  FraudPreventionScreen,
  FraudPreventionWindowSize,
} from "./types";

export function encodeHmrcComponent(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function encodeHmrcKeyValue(
  values: Readonly<Record<string, string>>,
): string | undefined {
  const entries = Object.entries(values);

  if (entries.length === 0) {
    return undefined;
  }

  const encodedEntries = entries.map(([key, value]) => {
    if (!isPresent(key) || !isPresent(value)) {
      return undefined;
    }

    return `${encodeHmrcComponent(key)}=${encodeHmrcComponent(value)}`;
  });

  if (encodedEntries.some((entry) => entry === undefined)) {
    return undefined;
  }

  return encodedEntries.join("&");
}

export function encodeHmrcKeyValueList(
  items: readonly Readonly<Record<string, string>>[],
): string | undefined {
  if (items.length === 0) {
    return undefined;
  }

  const encodedItems = items.map((item) => encodeHmrcKeyValue(item));

  if (encodedItems.some((item) => item === undefined)) {
    return undefined;
  }

  return encodedItems.join(",");
}

export function encodeHmrcScreens(
  screens: readonly FraudPreventionScreen[] | undefined,
): string | undefined {
  if (screens === undefined || screens.length === 0) {
    return undefined;
  }

  const screenItems: Array<Readonly<Record<string, string>> | undefined> =
    screens.map((screen) => {
    if (
      !isPositiveWholeNumber(screen.width) ||
      !isPositiveWholeNumber(screen.height) ||
      !Number.isFinite(screen.scalingFactor) ||
      screen.scalingFactor <= 0 ||
      !isPositiveWholeNumber(screen.colourDepth)
    ) {
      return undefined;
    }

    return {
      width: String(screen.width),
      height: String(screen.height),
      "scaling-factor": String(screen.scalingFactor),
      "colour-depth": String(screen.colourDepth),
    };
    });

  if (screenItems.some((screen) => screen === undefined)) {
    return undefined;
  }

  return encodeHmrcKeyValueList(screenItems.filter(isDefinedRecord));
}

export function encodeHmrcWindowSize(
  windowSize: FraudPreventionWindowSize | undefined,
): string | undefined {
  if (
    windowSize === undefined ||
    !isPositiveWholeNumber(windowSize.width) ||
    !isPositiveWholeNumber(windowSize.height)
  ) {
    return undefined;
  }

  return encodeHmrcKeyValue({
    width: String(windowSize.width),
    height: String(windowSize.height),
  });
}

export function encodeHmrcMultiFactor(
  factors: readonly FraudPreventionMultiFactor[] | undefined,
): string | undefined {
  if (factors === undefined || factors.length === 0) {
    return undefined;
  }

  const factorItems: Array<Readonly<Record<string, string>> | undefined> =
    factors.map((factor) => {
    const timestampIsValid =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?Z$/.test(
        factor.timestamp,
      );

    if (
      !isPresent(factor.type) ||
      !timestampIsValid ||
      !isPresent(factor.uniqueReference)
    ) {
      return undefined;
    }

    return {
      type: factor.type,
      timestamp: factor.timestamp,
      "unique-reference": factor.uniqueReference,
    };
    });

  if (factorItems.some((factor) => factor === undefined)) {
    return undefined;
  }

  return encodeHmrcKeyValueList(factorItems.filter(isDefinedRecord));
}

export function encodeHmrcForwarded(
  forwarded: readonly FraudPreventionForwardedHop[] | undefined,
): string | undefined {
  if (forwarded === undefined || forwarded.length === 0) {
    return undefined;
  }

  const forwardedItems: Array<Readonly<Record<string, string>> | undefined> =
    forwarded.map((hop) => {
    if (!isPresent(hop.by) || !isPresent(hop.for)) {
      return undefined;
    }

    return {
      by: hop.by,
      for: hop.for,
    };
    });

  if (forwardedItems.some((hop) => hop === undefined)) {
    return undefined;
  }

  return encodeHmrcKeyValueList(forwardedItems.filter(isDefinedRecord));
}

export function timezoneFromOffsetMinutes(offsetMinutes: number): string | undefined {
  if (!Number.isFinite(offsetMinutes)) {
    return undefined;
  }

  const total = -offsetMinutes;
  const sign = total >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(total);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const minutes = String(absoluteMinutes % 60).padStart(2, "0");

  return `UTC${sign}${hours}:${minutes}`;
}

function isPositiveWholeNumber(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isDefinedRecord(
  value: Readonly<Record<string, string>> | undefined,
): value is Readonly<Record<string, string>> {
  return value !== undefined;
}

function isPresent(value: string): boolean {
  const trimmedValue = value.trim();

  return (
    trimmedValue.length > 0 &&
    trimmedValue.toLowerCase() !== "null" &&
    trimmedValue.toLowerCase() !== "undefined"
  );
}
