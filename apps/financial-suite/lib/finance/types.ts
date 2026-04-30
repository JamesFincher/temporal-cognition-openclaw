export type LedgerSection =
  | "income"
  | "fixed"
  | "variable"
  | "credit"
  | "loan"
  | "envelope";

export interface LedgerItem {
  id: string;
  section: LedgerSection;
  category: string;
  name: string;
  budgetCents: number;
  actualCents: number;
  dueDay?: number;
  verified: boolean;
  sortOrder: number;
  metadata?: {
    limitCents?: number;
    balanceCents?: number;
    minimumPaymentCents?: number;
    goalCents?: number;
    recurring?: boolean;
    note?: string;
  };
}

export interface VariableEntry {
  id: string;
  category: string;
  amountCents: number;
  spentAt: string;
  note?: string;
}

export interface MonthLedger {
  monthKey: string;
  incomeCents: number;
  items: LedgerItem[];
  variableEntries: VariableEntry[];
}

export interface MonthSummary {
  incomeCents: number;
  fixedCents: number;
  variableBudgetCents: number;
  variableActualCents: number;
  debtMinimumCents: number;
  debtBalanceCents: number;
  envelopeBudgetCents: number;
  envelopeActualCents: number;
  totalBudgetedExpensesCents: number;
  totalActualExpensesCents: number;
  surplusCents: number;
  creditUtilization: number;
  envelopeProgress: number;
  budgetHealthScore: number;
}

export interface TrendDelta {
  monthKey: string;
  previousMonthKey?: string;
  incomeDeltaCents: number;
  expenseDeltaCents: number;
  surplusDeltaCents: number;
  healthDelta: number;
}
