export type TaxRegimeId = string;

export type IncomeSourceType = string;

export type ObligationStatus = string;

export interface QuarterlyUpdatePeriod {
  startsOn: string;
  endsOn: string;
  dueOn?: string;
}

export interface IncomeSource {
  id: string;
  taxRegimeId: TaxRegimeId;
  type: IncomeSourceType;
}

export interface Obligation {
  id: string;
  taxRegimeId: TaxRegimeId;
  incomeSourceId?: string;
  period: QuarterlyUpdatePeriod;
  status: ObligationStatus;
}

export interface TaxAuthorityAdapter {
  readonly taxRegimeId: TaxRegimeId;
  readonly supportedIncomeSourceTypes: readonly IncomeSourceType[];
}
