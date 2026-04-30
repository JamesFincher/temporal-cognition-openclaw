import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { aiChangeSetSchema } from "../lib/ai-tools";

type ConvexCtx = {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
};

async function requireOwnerId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity.subject;
}

export const proposeChanges = action({
  args: {
    monthKey: v.string(),
    prompt: v.string(),
  },
  handler: async (
    ctx: ConvexCtx,
    args: { monthKey: string; prompt: string },
  ) => {
    await requireOwnerId(ctx);

    if (!process.env.OPENAI_API_KEY) {
      return {
        summary: "AI provider is not configured. No changes were generated.",
        changes: [],
      };
    }

    const result = await generateObject({
      model: openai("gpt-4.1-mini"),
      schema: aiChangeSetSchema,
      prompt: [
        "Convert the user request into a bounded financial change set.",
        "Never include credentials, account numbers, or arbitrary owner IDs.",
        "Mark delete operations and balance resets as destructive.",
        `Month: ${args.monthKey}`,
        `Request: ${args.prompt}`,
      ].join("\n"),
    });

    return result.object;
  },
});
