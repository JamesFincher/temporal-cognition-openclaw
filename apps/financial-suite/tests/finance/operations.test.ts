import { describe, expect, it } from "vitest";
import {
  financialOperationSchema,
  previewOperations,
} from "../../lib/finance/operations";
import type { MonthLedger } from "../../lib/finance/types";

const ledger: MonthLedger = {
  monthKey: "2026-04",
  incomeCents: 400000,
  items: [
    {
      id: "power",
      section: "fixed",
      category: "Utilities",
      name: "PG&E",
      budgetCents: 12000,
      actualCents: 11000,
      verified: false,
      sortOrder: 1,
    },
  ],
  variableEntries: [],
};

describe("financial operations", () => {
  it("validates a structured add operation", () => {
    const parsed = financialOperationSchema.safeParse({
      type: "addItem",
      section: "fixed",
      item: {
        category: "Utilities",
        name: "Water",
        budgetCents: 8000,
        actualCents: 0,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid payloads", () => {
    const parsed = financialOperationSchema.safeParse({
      type: "setIncome",
      incomeCents: 12.5,
    });
    expect(parsed.success).toBe(false);
  });

  it("previews updates and reports missing targets", () => {
    const preview = previewOperations(ledger, [
      { type: "toggleVerified", itemId: "power", verified: true },
      { type: "deleteItem", itemId: "missing" },
    ]);
    expect(preview.ledger.items[0]?.verified).toBe(true);
    expect(preview.errors).toContain("Could not find item missing.");
  });
});
