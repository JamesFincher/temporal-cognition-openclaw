import { describe, expect, it } from "vitest";
import {
  financialOperationBatchSchema,
  previewOperations,
} from "../../lib/finance/operations";
import type { MonthLedger } from "../../lib/finance/types";

describe("AI guarded operation flow", () => {
  it("accepts a PG&E proposal and previews before commit", () => {
    const batch = financialOperationBatchSchema.parse({
      operations: [
        {
          type: "addItem",
          section: "fixed",
          item: {
            category: "Utilities",
            name: "PG&E",
            budgetCents: 7000,
            actualCents: 0,
            dueDay: 15,
          },
        },
      ],
    });
    const ledger: MonthLedger = {
      monthKey: "2026-04",
      incomeCents: 0,
      items: [],
      variableEntries: [],
    };
    const preview = previewOperations(ledger, batch.operations);

    expect(preview.messages).toContain("Added PG&E.");
    expect(ledger.items).toHaveLength(0);
    expect(preview.ledger.items).toHaveLength(1);
  });
});
