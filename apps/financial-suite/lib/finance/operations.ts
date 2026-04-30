import { z } from "zod";
import type { LedgerItem, MonthLedger } from "./types";

export const ledgerSectionSchema = z.enum([
  "income",
  "fixed",
  "variable",
  "credit",
  "loan",
  "envelope",
]);

const itemPatchSchema = z.object({
  category: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  budgetCents: z.number().int().optional(),
  actualCents: z.number().int().optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  verified: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const financialOperationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("addItem"),
    section: ledgerSectionSchema.exclude(["income"]),
    item: z.object({
      category: z.string().min(1),
      name: z.string().min(1),
      budgetCents: z.number().int().default(0),
      actualCents: z.number().int().default(0),
      dueDay: z.number().int().min(1).max(31).optional(),
      verified: z.boolean().default(false),
      metadata: z
        .record(z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
    }),
  }),
  z.object({
    type: z.literal("updateItem"),
    itemId: z.string().min(1),
    patch: itemPatchSchema,
  }),
  z.object({ type: z.literal("deleteItem"), itemId: z.string().min(1) }),
  z.object({
    type: z.literal("toggleVerified"),
    itemId: z.string().min(1),
    verified: z.boolean(),
  }),
  z.object({
    type: z.literal("addVariableEntry"),
    category: z.string().min(1),
    amountCents: z.number().int().nonnegative(),
    spentAt: z.string().min(1),
    note: z.string().optional(),
  }),
  z.object({
    type: z.literal("cloneMonth"),
    fromMonthKey: z.string().regex(/^\d{4}-\d{2}$/),
    toMonthKey: z.string().regex(/^\d{4}-\d{2}$/),
  }),
  z.object({
    type: z.literal("setIncome"),
    incomeCents: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("reorderItem"),
    itemId: z.string().min(1),
    sortOrder: z.number().int(),
  }),
]);

export const financialOperationBatchSchema = z.object({
  operations: z.array(financialOperationSchema).min(1),
  clarification: z.string().optional(),
});

export type FinancialOperation = z.infer<typeof financialOperationSchema>;
export type FinancialOperationBatch = z.infer<
  typeof financialOperationBatchSchema
>;

export interface PreviewResult {
  ledger: MonthLedger;
  messages: string[];
  errors: string[];
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function updateItem(
  items: LedgerItem[],
  itemId: string,
  patch: Partial<LedgerItem>,
): LedgerItem | null {
  const item = items.find((candidate) => candidate.id === itemId);
  if (!item) return null;
  Object.assign(item, patch);
  return item;
}

export function previewOperations(
  ledger: MonthLedger,
  operations: readonly FinancialOperation[],
): PreviewResult {
  const draft: MonthLedger = {
    ...ledger,
    items: ledger.items.map((item) => ({
      ...item,
      metadata: item.metadata ? { ...item.metadata } : undefined,
    })),
    variableEntries: ledger.variableEntries.map((entry) => ({ ...entry })),
  };
  const messages: string[] = [];
  const errors: string[] = [];

  for (const operation of operations) {
    if (operation.type === "setIncome") {
      draft.incomeCents = operation.incomeCents;
      messages.push("Updated monthly income.");
    } else if (operation.type === "addItem") {
      draft.items.push({
        id: createId("preview"),
        section: operation.section,
        sortOrder: draft.items.length,
        ...operation.item,
      });
      messages.push(`Added ${operation.item.name}.`);
    } else if (operation.type === "updateItem") {
      const updated = updateItem(
        draft.items,
        operation.itemId,
        operation.patch as Partial<LedgerItem>,
      );
      if (!updated) errors.push(`Could not find item ${operation.itemId}.`);
      else messages.push(`Updated ${updated.name}.`);
    } else if (operation.type === "deleteItem") {
      const before = draft.items.length;
      draft.items = draft.items.filter((item) => item.id !== operation.itemId);
      if (before === draft.items.length)
        errors.push(`Could not find item ${operation.itemId}.`);
      else messages.push("Deleted item.");
    } else if (operation.type === "toggleVerified") {
      const updated = updateItem(draft.items, operation.itemId, {
        verified: operation.verified,
      });
      if (!updated) errors.push(`Could not find item ${operation.itemId}.`);
      else messages.push(`${updated.name} verification changed.`);
    } else if (operation.type === "addVariableEntry") {
      draft.variableEntries.push({
        id: createId("preview_entry"),
        category: operation.category,
        amountCents: operation.amountCents,
        spentAt: operation.spentAt,
        note: operation.note,
      });
      messages.push(`Added ${operation.category} spend.`);
    } else if (operation.type === "reorderItem") {
      const updated = updateItem(draft.items, operation.itemId, {
        sortOrder: operation.sortOrder,
      });
      if (!updated) errors.push(`Could not find item ${operation.itemId}.`);
      else messages.push(`Moved ${updated.name}.`);
    } else if (operation.type === "cloneMonth") {
      messages.push(
        `Prepared clone from ${operation.fromMonthKey} to ${operation.toMonthKey}.`,
      );
    }
  }

  draft.items.sort((a, b) => a.sortOrder - b.sortOrder);
  return { ledger: draft, messages, errors };
}
