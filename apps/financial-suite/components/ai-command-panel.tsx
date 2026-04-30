"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AiChangeSet, requiresApproval } from "@/lib/ai-tools";

export function AiCommandPanel({ monthKey }: { monthKey: string }) {
  const proposeChanges = useAction(api.aiActions.proposeChanges);
  const [prompt, setPrompt] = useState("");
  const [changeSet, setChangeSet] = useState<AiChangeSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submitPrompt() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await proposeChanges({ monthKey, prompt });
      setChangeSet(result as AiChangeSet);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI request failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        display: "grid",
        gap: 12,
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 18, margin: 0 }}>AI assistant</h2>
      <textarea
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Example: add rent for $1400 and mark the old grocery envelope for review"
        rows={4}
        value={prompt}
      />
      <button
        disabled={isLoading || prompt.trim().length === 0}
        onClick={submitPrompt}
        style={{ justifySelf: "start" }}
        type="button"
      >
        Propose changes
      </button>
      {error ? (
        <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>
      ) : null}
      {changeSet ? (
        <div style={{ display: "grid", gap: 8 }}>
          <strong>{changeSet.summary}</strong>
          {changeSet.changes.map((change, index) => (
            <div
              key={`${change.operation}-${index}`}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 6,
                padding: 10,
              }}
            >
              <span>{change.operation}</span>{" "}
              {change.label ? <strong>{change.label}</strong> : null}
              <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
                {change.rationale}
              </p>
              {requiresApproval(change) ? (
                <small>Approval required before applying.</small>
              ) : null}
            </div>
          ))}
          <button disabled type="button">
            Apply approved changes
          </button>
        </div>
      ) : null}
    </section>
  );
}
