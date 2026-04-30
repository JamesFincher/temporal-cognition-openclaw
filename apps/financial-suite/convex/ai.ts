import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

type AnyCtx = any;

export const listBatches = query({
  args: { monthId: v.id("months") },
  handler: async (ctx, { monthId }) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    const month = await ctx.db.get(monthId);
    if (!month || month.ownerId !== user._id)
      throw new Error("Month not found");
    return ctx.db
      .query("aiOperationBatches")
      .withIndex("by_month_status", (q: any) =>
        q.eq("monthId", monthId).eq("status", "proposed"),
      )
      .collect();
  },
});

export const proposeBatch = mutation({
  args: {
    monthId: v.id("months"),
    prompt: v.string(),
    operations: v.array(v.any()),
  },
  handler: async (ctx, { monthId, prompt, operations }) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    const month = await ctx.db.get(monthId);
    if (!month || month.ownerId !== user._id)
      throw new Error("Month not found");
    return ctx.db.insert("aiOperationBatches", {
      ownerId: user._id,
      monthId,
      prompt,
      operations,
      status: "proposed",
      createdAt: Date.now(),
    });
  },
});

export const approveBatch = mutation({
  args: { batchId: v.id("aiOperationBatches") },
  handler: async (ctx, { batchId }) => {
    const user = await getCurrentUserOrThrow(ctx as AnyCtx);
    const batch = await ctx.db.get(batchId);
    if (!batch || batch.ownerId !== user._id)
      throw new Error("AI batch not found");
    if (batch.status !== "proposed")
      return { error: "Batch is not pending approval" };
    await ctx.db.patch(batchId, { status: "applied", appliedAt: Date.now() });
    await ctx.db.insert("auditEvents", {
      ownerId: user._id,
      monthId: batch.monthId,
      entityType: "aiOperationBatch",
      entityId: batchId,
      operation: "approve",
      before: batch,
      after: { status: "applied" },
      source: "ai_approved",
      createdAt: Date.now(),
    });
    return { applied: true, operations: batch.operations };
  },
});
