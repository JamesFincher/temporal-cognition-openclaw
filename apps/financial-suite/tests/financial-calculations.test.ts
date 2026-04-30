import { describe, expect, it } from "vitest";
import {
  calculateBudgetHealth,
  calculateDebtUtilization,
  calculateMonthSummary,
  formatCurrency,
  parseCurrency,
} from "../lib/financial-calculations";

describe("financial calculations", () => {
  it("parses and formats currency with cents", () => {
    expect(parseCurrency("$1,402.35")).toBe(140235);
    expect(parseCurrency("")).toBe(0);
    expect(formatCurrency(140235)).toBe("$1,402.35");
  });

  it("summarizes monthly cashflow with integer cents", () => {
    const summary = calculateMonthSummary([
      {
        category: "income",
        label: "Salary",
        amountCents: 500000,
        verified: true,
      },
      { category: "fixed_bill", label: "Rent", amountCents: 140000 },
      { category: "variable_expense", label: "Groceries", amountCents: 65000 },
      {
        category: "credit_card",
        label: "Card",
        amountCents: 12000,
        balanceCents: 90000,
        creditLimitCents: 300000,
      },
    ]);

    expect(summary.cashflowCents).toBe(283000);
    expect(summary.debtBalanceCents).toBe(90000);
    expect(summary.verifiedCount).toBe(1);
    expect(calculateBudgetHealth(summary)).toBe("surplus");
  });

  it("calculates credit card utilization", () => {
    expect(
      calculateDebtUtilization([
        {
          category: "credit_card",
          label: "A",
          amountCents: 0,
          balanceCents: 50000,
          creditLimitCents: 100000,
        },
        {
          category: "loan",
          label: "Loan",
          amountCents: 0,
          balanceCents: 200000,
        },
      ]),
    ).toBe(50);
  });
});
