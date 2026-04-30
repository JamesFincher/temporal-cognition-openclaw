"use client";

import { useState } from "react";
import { OperationReview } from "./operation-review";
import {
  financialOperationBatchSchema,
  type FinancialOperation,
} from "@/lib/finance/operations";
import type { MonthLedger } from "@/lib/finance/types";

export function AssistantPanel({ ledger }: { ledger: MonthLedger }) {
  const [prompt, setPrompt] = useState("");
  const [operations, setOperations] = useState<FinancialOperation[]>([]);
  const [status, setStatus] = useState("Idle");

  async function propose() {
    setStatus("Thinking");
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, ledger }),
    });
    const json: unknown = await response.json();
    const parsed = financialOperationBatchSchema.safeParse(json);
    if (!parsed.success) {
      setStatus("Could not produce a safe operation");
      return;
    }
    setOperations(parsed.data.operations);
    setStatus("Preview ready");
  }

  return (
    <aside
      className="panel"
      style={{
        alignSelf: "start",
        display: "grid",
        gap: 10,
        padding: 12,
        position: "sticky",
        top: 12,
      }}
    >
      <div>
        <h2 style={{ fontSize: 16, margin: 0 }}>AI Assistant</h2>
        <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 0" }}>
          Operations require review before commit.
        </p>
      </div>
      <textarea
        className="input"
        rows={5}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Add a $70 PG&E bill due on the 15th"
      />
      <button className="button" type="button" onClick={propose}>
        Propose changes
      </button>
      <span style={{ color: "var(--muted)", fontSize: 12 }}>{status}</span>
      {operations.length > 0 ? (
        <OperationReview ledger={ledger} operations={operations} />
      ) : null}
    </aside>
  );
}
