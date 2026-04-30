import { describe, expect, it } from "vitest";
import { requiresApproval, validateAiChangeSet } from "../lib/ai-tools";

describe("AI tool validation", () => {
  it("accepts bounded financial change sets", () => {
    const changeSet = validateAiChangeSet({
      summary: "Add rent",
      changes: [
        {
          operation: "add",
          category: "fixed_bill",
          label: "Rent",
          amountCents: 140000,
          rationale: "User requested it",
        },
      ],
    });

    expect(changeSet.changes[0].operation).toBe("add");
  });

  it("requires approval for destructive changes", () => {
    expect(
      requiresApproval({
        operation: "delete",
        targetId: "item",
        destructive: false,
        rationale: "duplicate",
      }),
    ).toBe(true);
  });
});
