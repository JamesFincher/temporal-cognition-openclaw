"use client";

import {
  previewOperations,
  type FinancialOperation,
} from "@/lib/finance/operations";
import type { MonthLedger } from "@/lib/finance/types";

export function OperationReview({
  ledger,
  operations,
}: {
  ledger: MonthLedger;
  operations: FinancialOperation[];
}) {
  const preview = previewOperations(ledger, operations);

  return (
    <div
      style={{
        borderTop: "1px solid var(--line)",
        display: "grid",
        gap: 8,
        paddingTop: 10,
      }}
    >
      <strong>Review changes</strong>
      {preview.messages.map((message) => (
        <div key={message} style={{ color: "var(--accent)" }}>
          {message}
        </div>
      ))}
      {preview.errors.map((error) => (
        <div key={error} style={{ color: "var(--danger)" }}>
          {error}
        </div>
      ))}
      <button
        className="button"
        type="button"
        disabled={preview.errors.length > 0}
      >
        Approve
      </button>
    </div>
  );
}
