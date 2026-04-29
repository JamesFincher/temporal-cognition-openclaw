export type FinancialCategory =
  | "income"
  | "fixed_bill"
  | "variable_expense"
  | "credit_card"
  | "loan"
  | "envelope";

export interface FinancialItem {
  category: FinancialCategory;
  label: string;
  amountCents: number;
  paidCents?: number;
  balanceCents?: number;
  creditLimitCents?: number;
  verified?: boolean;
}

export interface MonthSummary {
  incomeCents: number;
  fixedBillsCents: number;
  variableExpensesCents: number;
  envelopeCents: number;
  debtBalanceCents: number;
  minimumDebtPaymentsCents: number;
  cashflowCents: number;
  budgetVarianceCents: number;
  verifiedCount: number;
  totalItems: number;
}

export function parseCurrency(
  value: string | number | null | undefined,
): number {
  if (typeof value === "number") return Math.round(value * 100);
  if (!value) return 0;
  const normalized = value.replace(/[$,\s]/g, "");
  if (normalized === "" || normalized === "-") return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(cents / 100);
}

export function calculateMonthSummary(items: FinancialItem[]): MonthSummary {
  const summary: MonthSummary = {
    incomeCents: 0,
    fixedBillsCents: 0,
    variableExpensesCents: 0,
    envelopeCents: 0,
    debtBalanceCents: 0,
    minimumDebtPaymentsCents: 0,
    cashflowCents: 0,
    budgetVarianceCents: 0,
    verifiedCount: 0,
    totalItems: items.length,
  };

  for (const item of items) {
    if (item.verified) summary.verifiedCount += 1;
    if (item.category === "income") summary.incomeCents += item.amountCents;
    if (item.category === "fixed_bill")
      summary.fixedBillsCents += item.amountCents;
    if (item.category === "variable_expense")
      summary.variableExpensesCents += item.amountCents;
    if (item.category === "envelope") summary.envelopeCents += item.amountCents;
    if (item.category === "credit_card" || item.category === "loan") {
      summary.debtBalanceCents += item.balanceCents ?? 0;
      summary.minimumDebtPaymentsCents += item.amountCents;
    }
  }

  const plannedOutflow =
    summary.fixedBillsCents +
    summary.variableExpensesCents +
    summary.envelopeCents +
    summary.minimumDebtPaymentsCents;
  summary.cashflowCents = summary.incomeCents - plannedOutflow;
  summary.budgetVarianceCents =
    summary.incomeCents -
    summary.fixedBillsCents -
    summary.variableExpensesCents;
  return summary;
}

export function calculateDebtUtilization(items: FinancialItem[]): number {
  const cards = items.filter((item) => item.category === "credit_card");
  const balance = cards.reduce(
    (sum, item) => sum + Math.max(item.balanceCents ?? 0, 0),
    0,
  );
  const limit = cards.reduce(
    (sum, item) => sum + Math.max(item.creditLimitCents ?? 0, 0),
    0,
  );
  return limit > 0 ? Math.round((balance / limit) * 100) : 0;
}

export function calculateBudgetHealth(
  summary: MonthSummary,
): "surplus" | "balanced" | "deficit" {
  if (summary.cashflowCents > 5000) return "surplus";
  if (summary.cashflowCents < -5000) return "deficit";
  return "balanced";
}
