import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

type AnyCtx = any;

const sectionValidator = v.union(
  v.literal("fixed"),
  v.literal("variable"),
  v.literal("credit"),
  v.literal("loan"),
  v.literal("envelope"),
);
const metadataValidator = v.optional(
  v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
);

async function getOwnedMonthById(
  ctx: AnyCtx,
  monthId: string,
  ownerId: string,
) {
  const month = await ctx.db.get(monthId);
  if (!month || month.ownerId !== ownerId) throw new Error("Month not found");
  return month;
}

async function getOwnedItem(ctx: AnyCtx, itemId: string, ownerId: string) {
  const item = await ctx.db.get(itemId);
  if (!item || item.ownerId !== ownerId) return null;
  return item;
}

async function writeAudit(
  ctx: AnyCtx,
  args: {
    ownerId: string;
    monthId: string;
    entityType: string;
    entityId?: string;
    operation: string;
    before?: unknown;
    after?: unknown;
    source?: "manual" | "ai_approved" | "clone";
  },
) {
  await ctx.db.insert("auditEvents", {
    ...args,
    source: args.source ?? "manual",
    createdAt: Date.now(),
  });
}

export const listMonthLedger = query({
  args: { monthId: v.id("months") },
  handler: async (ctx, { monthId }) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    await getOwnedMonthById(ctx, monthId, user._id);
    const items = await ctx.db
      .query("ledgerItems")
      .withIndex("by_owner_month", (q: any) =>
        q.eq("ownerId", user._id).eq("monthId", monthId),
      )
      .collect();
    const variableEntries = await ctx.db
      .query("variableEntries")
      .withIndex("by_owner_spent_at", (q: any) => q.eq("ownerId", user._id))
      .collect();
    return {
      items: items.sort((a: any, b: any) => a.sortOrder - b.sortOrder),
      variableEntries: variableEntries.filter(
        (entry: any) => entry.monthId === monthId,
      ),
    };
  },
});

export const upsertLedgerItem = mutation({
  args: {
    monthId: v.id("months"),
    itemId: v.optional(v.id("ledgerItems")),
    section: sectionValidator,
    category: v.string(),
    name: v.string(),
    budgetCents: v.number(),
    actualCents: v.number(),
    dueDay: v.optional(v.number()),
    verified: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
    metadata: metadataValidator,
    source: v.optional(v.union(v.literal("manual"), v.literal("ai_approved"))),
  },
  handler: async (ctx, args) => {
    if (!args.name.trim()) throw new Error("Name is required");
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    await getOwnedMonthById(ctx, args.monthId, user._id);
    const now = Date.now();
    if (args.itemId) {
      const before = await getOwnedItem(ctx, args.itemId, user._id);
      if (!before) throw new Error("Ledger item not found");
      const patch = {
        section: args.section,
        category: args.category,
        name: args.name,
        budgetCents: args.budgetCents,
        actualCents: args.actualCents,
        dueDay: args.dueDay,
        verified: args.verified ?? before.verified,
        sortOrder: args.sortOrder ?? before.sortOrder,
        metadata: args.metadata,
        updatedAt: now,
      };
      await ctx.db.patch(args.itemId, patch);
      await writeAudit(ctx, {
        ownerId: user._id,
        monthId: args.monthId,
        entityType: "ledgerItem",
        entityId: args.itemId,
        operation: "update",
        before,
        after: patch,
        source: args.source,
      });
      return args.itemId;
    }
    const itemId = await ctx.db.insert("ledgerItems", {
      ownerId: user._id,
      monthId: args.monthId,
      section: args.section,
      category: args.category,
      name: args.name,
      budgetCents: args.budgetCents,
      actualCents: args.actualCents,
      dueDay: args.dueDay,
      verified: args.verified ?? false,
      sortOrder: args.sortOrder ?? now,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
    await writeAudit(ctx, {
      ownerId: user._id,
      monthId: args.monthId,
      entityType: "ledgerItem",
      entityId: itemId,
      operation: "create",
      after: args,
      source: args.source,
    });
    return itemId;
  },
});

export const deleteLedgerItem = mutation({
  args: {
    itemId: v.id("ledgerItems"),
    source: v.optional(v.union(v.literal("manual"), v.literal("ai_approved"))),
  },
  handler: async (ctx, { itemId, source }) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    const before = await getOwnedItem(ctx, itemId, user._id);
    if (!before) throw new Error("Ledger item not found");
    await ctx.db.delete(itemId);
    await writeAudit(ctx, {
      ownerId: user._id,
      monthId: before.monthId,
      entityType: "ledgerItem",
      entityId: itemId,
      operation: "delete",
      before,
      source,
    });
    return { deleted: true };
  },
});

export const reorderLedgerItem = mutation({
  args: {
    itemId: v.id("ledgerItems"),
    sortOrder: v.number(),
    source: v.optional(v.union(v.literal("manual"), v.literal("ai_approved"))),
  },
  handler: async (ctx, { itemId, sortOrder, source }) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    const before = await getOwnedItem(ctx, itemId, user._id);
    if (!before) throw new Error("Ledger item not found");
    await ctx.db.patch(itemId, { sortOrder, updatedAt: Date.now() });
    await writeAudit(ctx, {
      ownerId: user._id,
      monthId: before.monthId,
      entityType: "ledgerItem",
      entityId: itemId,
      operation: "reorder",
      before,
      after: { sortOrder },
      source,
    });
    return itemId;
  },
});

export const toggleVerified = mutation({
  args: {
    itemId: v.id("ledgerItems"),
    verified: v.boolean(),
    source: v.optional(v.union(v.literal("manual"), v.literal("ai_approved"))),
  },
  handler: async (ctx, { itemId, verified, source }) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    const before = await getOwnedItem(ctx, itemId, user._id);
    if (!before) throw new Error("Ledger item not found");
    await ctx.db.patch(itemId, { verified, updatedAt: Date.now() });
    await writeAudit(ctx, {
      ownerId: user._id,
      monthId: before.monthId,
      entityType: "ledgerItem",
      entityId: itemId,
      operation: "verify",
      before,
      after: { verified },
      source,
    });
    return itemId;
  },
});

export const addVariableEntry = mutation({
  args: {
    monthId: v.id("months"),
    category: v.string(),
    amountCents: v.number(),
    spentAt: v.string(),
    note: v.optional(v.string()),
    source: v.optional(v.union(v.literal("manual"), v.literal("ai_approved"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    await getOwnedMonthById(ctx, args.monthId, user._id);
    const entryId = await ctx.db.insert("variableEntries", {
      ownerId: user._id,
      monthId: args.monthId,
      category: args.category,
      amountCents: args.amountCents,
      spentAt: args.spentAt,
      note: args.note,
      createdAt: Date.now(),
    });
    await writeAudit(ctx, {
      ownerId: user._id,
      monthId: args.monthId,
      entityType: "variableEntry",
      entityId: entryId,
      operation: "create",
      after: args,
      source: args.source,
    });
    return entryId;
  },
});

export const deleteVariableEntry = mutation({
  args: {
    entryId: v.id("variableEntries"),
    source: v.optional(v.union(v.literal("manual"), v.literal("ai_approved"))),
  },
  handler: async (ctx, { entryId, source }) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    const before = await ctx.db.get(entryId);
    if (!before || before.ownerId !== user._id)
      throw new Error("Variable entry not found");
    await ctx.db.delete(entryId);
    await writeAudit(ctx, {
      ownerId: user._id,
      monthId: before.monthId,
      entityType: "variableEntry",
      entityId: entryId,
      operation: "delete",
      before,
      source,
    });
    return { deleted: true };
  },
});
