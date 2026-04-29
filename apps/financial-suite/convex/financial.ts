import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { financialCategory } from "./schema";

type ConvexCtx = {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
  db: any;
};

async function requireOwnerId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity.subject;
}

function displayNameForMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export const getOrCreateMonth = mutation({
  args: {
    monthKey: v.string(),
    timezone: v.optional(v.string()),
  },
  handler: async (
    ctx: ConvexCtx,
    args: { monthKey: string; timezone?: string },
  ) => {
    const ownerId = await requireOwnerId(ctx);
    const existing = await ctx.db
      .query("months")
      .withIndex("by_owner_month", (q: any) =>
        q.eq("ownerId", ownerId).eq("monthKey", args.monthKey),
      )
      .unique();
    if (existing) return existing;

    const now = Date.now();
    const monthId = await ctx.db.insert("months", {
      ownerId,
      monthKey: args.monthKey,
      displayName: displayNameForMonth(args.monthKey),
      timezone: args.timezone ?? "America/Los_Angeles",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(monthId);
  },
});

export const listMonthItems = query({
  args: { monthKey: v.string() },
  handler: async (ctx: ConvexCtx, args: { monthKey: string }) => {
    const ownerId = await requireOwnerId(ctx);
    return await ctx.db
      .query("financialItems")
      .withIndex("by_owner_month", (q: any) =>
        q.eq("ownerId", ownerId).eq("monthKey", args.monthKey),
      )
      .collect();
  },
});

export const upsertFinancialItem = mutation({
  args: {
    itemId: v.optional(v.id("financialItems")),
    monthKey: v.string(),
    category: financialCategory,
    label: v.string(),
    amountCents: v.number(),
    paidCents: v.optional(v.number()),
    balanceCents: v.optional(v.number()),
    creditLimitCents: v.optional(v.number()),
    dueDay: v.optional(v.number()),
    verified: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (
    ctx: ConvexCtx,
    args: {
      itemId?: string;
      monthKey: string;
      category:
        | "income"
        | "fixed_bill"
        | "variable_expense"
        | "credit_card"
        | "loan"
        | "envelope";
      label: string;
      amountCents: number;
      paidCents?: number;
      balanceCents?: number;
      creditLimitCents?: number;
      dueDay?: number;
      verified?: boolean;
      notes?: string;
    },
  ) => {
    const ownerId = await requireOwnerId(ctx);
    const month = await ctx.db
      .query("months")
      .withIndex("by_owner_month", (q: any) =>
        q.eq("ownerId", ownerId).eq("monthKey", args.monthKey),
      )
      .unique();
    if (!month) throw new Error("Month must exist before adding items");

    const now = Date.now();
    const values = {
      ownerId,
      monthId: month._id,
      monthKey: args.monthKey,
      category: args.category,
      label: args.label,
      amountCents: args.amountCents,
      paidCents: args.paidCents,
      balanceCents: args.balanceCents,
      creditLimitCents: args.creditLimitCents,
      dueDay: args.dueDay,
      verified: args.verified ?? false,
      notes: args.notes,
      updatedAt: now,
    };

    if (args.itemId) {
      const existing = await ctx.db.get(args.itemId);
      if (!existing || existing.ownerId !== ownerId)
        throw new Error("Item not found");
      await ctx.db.patch(args.itemId, values);
      return await ctx.db.get(args.itemId);
    }

    const itemId = await ctx.db.insert("financialItems", {
      ...values,
      createdAt: now,
    });
    return await ctx.db.get(itemId);
  },
});

export const deleteFinancialItem = mutation({
  args: { itemId: v.id("financialItems") },
  handler: async (ctx: ConvexCtx, args: { itemId: string }) => {
    const ownerId = await requireOwnerId(ctx);
    const existing = await ctx.db.get(args.itemId);
    if (!existing || existing.ownerId !== ownerId)
      throw new Error("Item not found");
    await ctx.db.delete(args.itemId);
    await ctx.db.insert("auditEvents", {
      ownerId,
      monthKey: existing.monthKey,
      eventType: "delete",
      entityType: "financialItem",
      entityId: args.itemId,
      createdAt: Date.now(),
    });
    return { deleted: true };
  },
});

export const copyPreviousMonth = mutation({
  args: {
    fromMonthKey: v.string(),
    toMonthKey: v.string(),
    includeActuals: v.optional(v.boolean()),
  },
  handler: async (
    ctx: ConvexCtx,
    args: {
      fromMonthKey: string;
      toMonthKey: string;
      includeActuals?: boolean;
    },
  ) => {
    const ownerId = await requireOwnerId(ctx);
    const now = Date.now();
    const existingTarget = await ctx.db
      .query("months")
      .withIndex("by_owner_month", (q: any) =>
        q.eq("ownerId", ownerId).eq("monthKey", args.toMonthKey),
      )
      .unique();
    const targetMonthId =
      existingTarget?._id ??
      (await ctx.db.insert("months", {
        ownerId,
        monthKey: args.toMonthKey,
        displayName: displayNameForMonth(args.toMonthKey),
        timezone: existingTarget?.timezone ?? "America/Los_Angeles",
        status: "active",
        createdAt: now,
        updatedAt: now,
      }));

    const sourceItems = await ctx.db
      .query("financialItems")
      .withIndex("by_owner_month", (q: any) =>
        q.eq("ownerId", ownerId).eq("monthKey", args.fromMonthKey),
      )
      .collect();

    for (const item of sourceItems) {
      await ctx.db.insert("financialItems", {
        ownerId,
        monthId: targetMonthId,
        monthKey: args.toMonthKey,
        category: item.category,
        label: item.label,
        amountCents: item.amountCents,
        paidCents: args.includeActuals ? item.paidCents : undefined,
        balanceCents: item.balanceCents,
        creditLimitCents: item.creditLimitCents,
        dueDay: item.dueDay,
        verified: false,
        notes: item.notes,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { copied: sourceItems.length };
  },
});
