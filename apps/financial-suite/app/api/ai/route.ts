import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { financialOperationBatchSchema } from "@/lib/finance/operations";

export async function POST(request: Request) {
  const body = (await request.json()) as { prompt?: string; ledger?: unknown };
  const prompt = body.prompt ?? "";

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({
      operations: [
        {
          type: "addItem",
          section: "fixed",
          item: {
            category: "Utilities",
            name: prompt.match(/PG&E/i) ? "PG&E" : "New bill",
            budgetCents: 7000,
            actualCents: 0,
            dueDay: 15,
            verified: false,
          },
        },
      ],
    });
  }

  const result = await generateObject({
    model: openai("gpt-4.1-mini"),
    schema: financialOperationBatchSchema,
    prompt: `Convert the user's finance request into safe operations. User request: ${prompt}`,
  });

  return Response.json(result.object);
}
