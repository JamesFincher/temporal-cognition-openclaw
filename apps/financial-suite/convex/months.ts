import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCurrentUserOrThrow, getOrCreateCurrentUser } from "./users";

type AnyCtx = any;

function assertMonthKey(monthKey: string): void {
  if (!/^\d{4}-\d{2}$/.test(monthKey))
    throw new Error("Month key must use YYYY-MM");
}

async function getOwnedMonth(
  ctx: AnyCtx,
  ownerId: Id<"users">,
  monthKey: string,
) {
  return ctx.db
    .query("months")
    .withIndex("by_owner_month", (q: any) =>
      q.eq("ownerId", ownerId).eq("monthKey", monthKey),
    )
    .unique();
}

export const getCurrentMonth = query({
  args: { monthKey: v.string() },
  handler: async (ctx, { monthKey }) => {
    assertMonthKey(monthKey);
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    return getOwnedMonth(ctx, user._id, monthKey);
  },
});

export const listMonths = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    return ctx.db
      .query("months")
      .withIndex("by_owner_created", (q: any) => q.eq("ownerId", user._id))
      .order("desc")
      .collect();
  },
});

export const createMonth = mutation({
  args: { monthKey: v.string(), incomeCents: v.optional(v.number()) },
  handler: async (ctx, { monthKey, incomeCents }) => {
    assertMonthKey(monthKey);
    const user = await getOrCreateCurrentUser(ctx as AnyCtx);
    const existing = await getOwnedMonth(ctx, user._id, monthKey);
    if (existing) return existing._id;
    const now = Date.now();
    return ctx.db.insert("months", {
      ownerId: user._id,
      monthKey,
      incomeCents: incomeCents ?? 0,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const clonePreviousMonthTemplate = mutation({
  args: { fromMonthKey: v.string(), toMonthKey: v.string() },
  handler: async (ctx, { fromMonthKey, toMonthKey }) => {
    assertMonthKey(fromMonthKey);
    assertMonthKey(toMonthKey);
    const user = await getOrCreateCurrentUser(ctx as AnyCtx);
    const source = await getOwnedMonth(ctx, user._id, fromMonthKey);
    if (!source) throw new Error("Source month not found");
    let target = await getOwnedMonth(ctx, user._id, toMonthKey);
    const now = Date.now();
    if (!target) {
      const targetId = await ctx.db.insert("months", {
        ownerId: user._id,
        monthKey: toMonthKey,
        incomeCents: source.incomeCents,
        status: "open",
        createdAt: now,
        updatedAt: now,
      });
      target = { _id: targetId };
    }
    const items = await ctx.db
      .query("ledgerItems")
      .withIndex("by_owner_month", (q: any) =>
        q.eq("ownerId", user._id).eq("monthId", source._id),
      )
      .collect();
    for (const item of items.filter(
      (entry: any) => entry.section !== "variable" || entry.metadata?.recurring,
    )) {
      await ctx.db.insert("ledgerItems", {
        ...item,
        _id: undefined,
        _creationTime: undefined,
        monthId: target._id,
        actualCents: 0,
        verified: false,
        createdAt: now,
        updatedAt: now,
      });
    }
    await ctx.db.insert("auditEvents", {
      ownerId: user._id,
      monthId: target._id,
      entityType: "month",
      entityId: String(target._id),
      operation: "clone",
      source: "clone",
      before: source,
      after: target,
      createdAt: now,
    });
    return target._id;
  },
});
