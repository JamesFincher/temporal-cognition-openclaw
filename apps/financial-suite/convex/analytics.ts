import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";
import {
  calculateMonthSummary,
  calculateTrendDelta,
} from "../lib/finance/calculations";
import type { MonthLedger } from "../lib/finance/types";

type AnyCtx = any;

async function readLedger(
  ctx: AnyCtx,
  ownerId: string,
  month: any,
): Promise<MonthLedger> {
  const items = await ctx.db
    .query("ledgerItems")
    .withIndex("by_owner_month", (q: any) =>
      q.eq("ownerId", ownerId).eq("monthId", month._id),
    )
    .collect();
  const entries = await ctx.db
    .query("variableEntries")
    .withIndex("by_owner_spent_at", (q: any) => q.eq("ownerId", ownerId))
    .collect();
  return {
    monthKey: month.monthKey,
    incomeCents: month.incomeCents,
    items,
    variableEntries: entries.filter(
      (entry: any) => entry.monthId === month._id,
    ),
  };
}

async function getOwnedMonth(ctx: AnyCtx, ownerId: string, monthKey: string) {
  return ctx.db
    .query("months")
    .withIndex("by_owner_month", (q: any) =>
      q.eq("ownerId", ownerId).eq("monthKey", monthKey),
    )
    .unique();
}

export const getMonthSummary = query({
  args: { monthKey: v.string() },
  handler: async (ctx, { monthKey }) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    const month = await getOwnedMonth(ctx, user._id, monthKey);
    if (!month) return null;
    return calculateMonthSummary(await readLedger(ctx, user._id, month));
  },
});

export const getTrendSummary = query({
  args: { monthKey: v.string(), previousMonthKey: v.optional(v.string()) },
  handler: async (ctx, { monthKey, previousMonthKey }) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    const current = await getOwnedMonth(ctx, user._id, monthKey);
    if (!current) return null;
    const previous = previousMonthKey
      ? await getOwnedMonth(ctx, user._id, previousMonthKey)
      : null;
    return calculateTrendDelta(
      await readLedger(ctx, user._id, current),
      previous ? await readLedger(ctx, user._id, previous) : undefined,
    );
  },
});

export const getDebtSnapshot = query({
  args: { monthKey: v.string() },
  handler: async (ctx, { monthKey }) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    const month = await getOwnedMonth(ctx, user._id, monthKey);
    if (!month) return null;
    const ledger = await readLedger(ctx, user._id, month);
    const summary = calculateMonthSummary(ledger);
    return {
      debtBalanceCents: summary.debtBalanceCents,
      debtMinimumCents: summary.debtMinimumCents,
      creditUtilization: summary.creditUtilization,
    };
  },
});

export const getEnvelopeProgress = query({
  args: { monthKey: v.string() },
  handler: async (ctx, { monthKey }) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    const month = await getOwnedMonth(ctx, user._id, monthKey);
    if (!month) return null;
    const ledger = await readLedger(ctx, user._id, month);
    const summary = calculateMonthSummary(ledger);
    return {
      envelopeBudgetCents: summary.envelopeBudgetCents,
      envelopeActualCents: summary.envelopeActualCents,
      envelopeProgress: summary.envelopeProgress,
    };
  },
});
