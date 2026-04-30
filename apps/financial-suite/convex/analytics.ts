import { v } from "convex/values";
import { query } from "./_generated/server";

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

function summarize(
  items: Array<{
    category: string;
    amountCents: number;
    balanceCents?: number;
    creditLimitCents?: number;
    verified: boolean;
  }>,
) {
  const incomeCents = items
    .filter((item) => item.category === "income")
    .reduce((sum, item) => sum + item.amountCents, 0);
  const fixedBillsCents = items
    .filter((item) => item.category === "fixed_bill")
    .reduce((sum, item) => sum + item.amountCents, 0);
  const variableExpensesCents = items
    .filter((item) => item.category === "variable_expense")
    .reduce((sum, item) => sum + item.amountCents, 0);
  const debtItems = items.filter(
    (item) => item.category === "credit_card" || item.category === "loan",
  );
  const debtBalanceCents = debtItems.reduce(
    (sum, item) => sum + (item.balanceCents ?? 0),
    0,
  );
  const creditLimitCents = debtItems.reduce(
    (sum, item) => sum + (item.creditLimitCents ?? 0),
    0,
  );
  const minimumDebtPaymentsCents = debtItems.reduce(
    (sum, item) => sum + item.amountCents,
    0,
  );
  const cashflowCents =
    incomeCents -
    fixedBillsCents -
    variableExpensesCents -
    minimumDebtPaymentsCents;

  return {
    incomeCents,
    fixedBillsCents,
    variableExpensesCents,
    debtBalanceCents,
    minimumDebtPaymentsCents,
    cashflowCents,
    debtUtilization:
      creditLimitCents > 0
        ? Math.round((debtBalanceCents / creditLimitCents) * 100)
        : 0,
    verificationCompletion:
      items.length > 0
        ? Math.round(
            (items.filter((item) => item.verified).length / items.length) * 100,
          )
        : 0,
  };
}

export const monthlySummary = query({
  args: { monthKey: v.string() },
  handler: async (ctx: ConvexCtx, args: { monthKey: string }) => {
    const ownerId = await requireOwnerId(ctx);
    const items = await ctx.db
      .query("financialItems")
      .withIndex("by_owner_month", (q: any) =>
        q.eq("ownerId", ownerId).eq("monthKey", args.monthKey),
      )
      .collect();
    return summarize(items);
  },
});

export const trend = query({
  args: { startMonthKey: v.string(), endMonthKey: v.string() },
  handler: async (
    ctx: ConvexCtx,
    args: { startMonthKey: string; endMonthKey: string },
  ) => {
    const ownerId = await requireOwnerId(ctx);
    const months = await ctx.db
      .query("months")
      .withIndex("by_owner", (q: any) => q.eq("ownerId", ownerId))
      .collect();
    const selectedMonths = months
      .filter(
        (month: { monthKey: string }) =>
          month.monthKey >= args.startMonthKey &&
          month.monthKey <= args.endMonthKey,
      )
      .sort((a: { monthKey: string }, b: { monthKey: string }) =>
        a.monthKey.localeCompare(b.monthKey),
      );

    const points = [];
    for (const month of selectedMonths) {
      const items = await ctx.db
        .query("financialItems")
        .withIndex("by_owner_month", (q: any) =>
          q.eq("ownerId", ownerId).eq("monthKey", month.monthKey),
        )
        .collect();
      points.push({ monthKey: month.monthKey, ...summarize(items) });
    }
    return points;
  },
});
