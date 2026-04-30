import type {
  LedgerItem,
  LedgerSection,
  MonthLedger,
  MonthSummary,
  TrendDelta,
} from "./types";

function sumCents(
  items: readonly LedgerItem[],
  selector: (item: LedgerItem) => number,
): number {
  return items.reduce((total, item) => total + selector(item), 0);
}

function bySection(
  items: readonly LedgerItem[],
  section: LedgerSection,
): LedgerItem[] {
  return items.filter((item) => item.section === section);
}

export function clampScore(score: number): number {
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function calculateCreditUtilization(
  items: readonly LedgerItem[],
): number {
  const cards = bySection(items, "credit");
  const totalLimit = sumCents(cards, (item) => item.metadata?.limitCents ?? 0);
  const totalBalance = sumCents(
    cards,
    (item) => item.metadata?.balanceCents ?? item.actualCents,
  );
  if (totalLimit <= 0) return 0;
  return Math.min(1, totalBalance / totalLimit);
}

export function calculateEnvelopeProgress(
  items: readonly LedgerItem[],
): number {
  const envelopes = bySection(items, "envelope");
  const totalGoal = sumCents(
    envelopes,
    (item) => item.metadata?.goalCents ?? item.budgetCents,
  );
  const totalSaved = sumCents(envelopes, (item) => item.actualCents);
  if (totalGoal <= 0) return 0;
  return Math.min(1, totalSaved / totalGoal);
}

export function calculateBudgetHealth(
  summary: Omit<MonthSummary, "budgetHealthScore">,
): number {
  const expenseRatio =
    summary.incomeCents > 0
      ? summary.totalActualExpensesCents / summary.incomeCents
      : 1;
  const surplusRatio =
    summary.incomeCents > 0 ? summary.surplusCents / summary.incomeCents : -1;
  const utilizationPenalty = summary.creditUtilization;
  const envelopeReward = summary.envelopeProgress;
  const verificationWeight = summary.totalActualExpensesCents > 0 ? 1 : 0.7;

  const score =
    (1 - Math.min(1, expenseRatio)) * 42 +
    Math.max(-0.5, Math.min(0.5, surplusRatio)) * 36 +
    (1 - utilizationPenalty) * 16 +
    envelopeReward * 12 +
    verificationWeight * 10;

  return clampScore(score);
}

export function calculateMonthSummary(ledger: MonthLedger): MonthSummary {
  const fixed = bySection(ledger.items, "fixed");
  const variable = bySection(ledger.items, "variable");
  const credit = bySection(ledger.items, "credit");
  const loans = bySection(ledger.items, "loan");
  const envelopes = bySection(ledger.items, "envelope");
  const variableEntryTotal = ledger.variableEntries.reduce(
    (sum, entry) => sum + entry.amountCents,
    0,
  );

  const fixedCents = sumCents(
    fixed,
    (item) => item.actualCents || item.budgetCents,
  );
  const variableBudgetCents = sumCents(variable, (item) => item.budgetCents);
  const variableActualCents =
    variableEntryTotal || sumCents(variable, (item) => item.actualCents);
  const creditMinimumCents = sumCents(
    credit,
    (item) => item.metadata?.minimumPaymentCents ?? item.actualCents,
  );
  const loanMinimumCents = sumCents(
    loans,
    (item) => item.metadata?.minimumPaymentCents ?? item.actualCents,
  );
  const debtBalanceCents = sumCents(
    [...credit, ...loans],
    (item) => item.metadata?.balanceCents ?? 0,
  );
  const envelopeBudgetCents = sumCents(envelopes, (item) => item.budgetCents);
  const envelopeActualCents = sumCents(envelopes, (item) => item.actualCents);
  const debtMinimumCents = creditMinimumCents + loanMinimumCents;
  const totalBudgetedExpensesCents =
    fixedCents + variableBudgetCents + debtMinimumCents + envelopeBudgetCents;
  const totalActualExpensesCents =
    fixedCents + variableActualCents + debtMinimumCents + envelopeActualCents;
  const baseSummary = {
    incomeCents: ledger.incomeCents,
    fixedCents,
    variableBudgetCents,
    variableActualCents,
    debtMinimumCents,
    debtBalanceCents,
    envelopeBudgetCents,
    envelopeActualCents,
    totalBudgetedExpensesCents,
    totalActualExpensesCents,
    surplusCents: ledger.incomeCents - totalActualExpensesCents,
    creditUtilization: calculateCreditUtilization(ledger.items),
    envelopeProgress: calculateEnvelopeProgress(ledger.items),
  };

  return {
    ...baseSummary,
    budgetHealthScore: calculateBudgetHealth(baseSummary),
  };
}

export function calculateTrendDelta(
  current: MonthLedger,
  previous?: MonthLedger,
): TrendDelta {
  const currentSummary = calculateMonthSummary(current);
  const previousSummary = previous
    ? calculateMonthSummary(previous)
    : undefined;

  return {
    monthKey: current.monthKey,
    previousMonthKey: previous?.monthKey,
    incomeDeltaCents:
      currentSummary.incomeCents - (previousSummary?.incomeCents ?? 0),
    expenseDeltaCents:
      currentSummary.totalActualExpensesCents -
      (previousSummary?.totalActualExpensesCents ?? 0),
    surplusDeltaCents:
      currentSummary.surplusCents - (previousSummary?.surplusCents ?? 0),
    healthDelta:
      currentSummary.budgetHealthScore -
      (previousSummary?.budgetHealthScore ?? 0),
  };
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
