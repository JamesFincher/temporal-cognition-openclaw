import { z } from "zod";

export const aiFinancialChangeSchema = z.object({
  operation: z.enum(["add", "update", "delete", "list", "analyze"]),
  category: z
    .enum([
      "income",
      "fixed_bill",
      "variable_expense",
      "credit_card",
      "loan",
      "envelope",
    ])
    .optional(),
  label: z.string().min(1).optional(),
  amountCents: z.number().int().optional(),
  targetId: z.string().optional(),
  destructive: z.boolean().default(false),
  rationale: z.string().min(1),
});

export const aiChangeSetSchema = z.object({
  summary: z.string().min(1),
  changes: z.array(aiFinancialChangeSchema).max(10),
});

export type AiFinancialChange = z.infer<typeof aiFinancialChangeSchema>;
export type AiChangeSet = z.infer<typeof aiChangeSetSchema>;

export function requiresApproval(change: AiFinancialChange): boolean {
  return change.destructive || change.operation === "delete";
}

export function validateAiChangeSet(input: unknown): AiChangeSet {
  return aiChangeSetSchema.parse(input);
}
