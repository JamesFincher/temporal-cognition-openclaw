import { describe, expect, it } from "vitest";
import {
  calculateBudgetHealth,
  calculateMonthSummary,
  calculateTrendDelta,
} from "../../lib/finance/calculations";
import type { MonthLedger } from "../../lib/finance/types";

const ledger: MonthLedger = {
  monthKey: "2026-04",
  incomeCents: 500000,
  items: [
    {
      id: "rent",
      section: "fixed",
      category: "Housing",
      name: "Rent",
      budgetCents: 160000,
      actualCents: 160000,
      verified: true,
      sortOrder: 1,
    },
    {
      id: "food",
      section: "variable",
      category: "Food",
      name: "Groceries",
      budgetCents: 60000,
      actualCents: 0,
      verified: false,
      sortOrder: 2,
    },
    {
      id: "card",
      section: "credit",
      category: "Debt",
      name: "Card",
      budgetCents: 10000,
      actualCents: 10000,
      verified: false,
      sortOrder: 3,
      metadata: {
        limitCents: 100000,
        balanceCents: 30000,
        minimumPaymentCents: 10000,
      },
    },
    {
      id: "fund",
      section: "envelope",
      category: "Savings",
      name: "Emergency",
      budgetCents: 25000,
      actualCents: 50000,
      verified: true,
      sortOrder: 4,
      metadata: { goalCents: 100000 },
    },
  ],
  variableEntries: [
    {
      id: "entry",
      category: "Food",
      amountCents: 45000,
      spentAt: "2026-04-12",
    },
  ],
};

describe("finance calculations", () => {
  it("calculates monthly totals and health", () => {
    const summary = calculateMonthSummary(ledger);
    expect(summary.totalActualExpensesCents).toBe(265000);
    expect(summary.surplusCents).toBe(235000);
    expect(summary.creditUtilization).toBe(0.3);
    expect(summary.envelopeProgress).toBe(0.5);
    expect(summary.budgetHealthScore).toBeGreaterThan(50);
  });

  it("handles zero income and high expenses without leaving score bounds", () => {
    const score = calculateBudgetHealth({
      ...calculateMonthSummary(ledger),
      incomeCents: 0,
      surplusCents: -10000,
      totalActualExpensesCents: 10000,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns month-over-month deltas", () => {
    const delta = calculateTrendDelta(
      { ...ledger, monthKey: "2026-05", incomeCents: 550000 },
      ledger,
    );
    expect(delta.incomeDeltaCents).toBe(50000);
    expect(delta.previousMonthKey).toBe("2026-04");
  });
});
