import type { IncomeSourceType, TaxRegimeId } from "@/tax-regimes/common";

export const UK_MTD_INCOME_TAX_REGIME_ID =
  "uk/making-tax-digital-income-tax" satisfies TaxRegimeId;

export const UK_MTD_INCOME_TAX_SUPPORTED_INCOME_SOURCE_TYPES = [
  "self-employment",
  "uk-property",
  "foreign-property",
] as const satisfies readonly IncomeSourceType[];
