"use client";

import { useEffect, useState } from "react";
import { formatCents } from "@/lib/finance/calculations";

interface EditableMoneyCellProps {
  valueCents: number;
  onCommit: (valueCents: number) => Promise<void> | void;
}

export function EditableMoneyCell({
  valueCents,
  onCommit,
}: EditableMoneyCellProps) {
  const [value, setValue] = useState(String(valueCents / 100));
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");

  useEffect(() => {
    setValue(String(valueCents / 100));
  }, [valueCents]);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      const cents = Math.round(Number(value || 0) * 100);
      if (Number.isNaN(cents) || cents === valueCents) return;
      setStatus("saving");
      try {
        await onCommit(cents);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 350);
    return () => window.clearTimeout(handle);
  }, [onCommit, value, valueCents]);

  return (
    <div style={{ display: "grid", gap: 2 }}>
      <input
        className="input"
        inputMode="decimal"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label={`Amount ${formatCents(valueCents)}`}
      />
      <span
        style={{
          color: status === "error" ? "var(--danger)" : "var(--muted)",
          fontSize: 11,
        }}
      >
        {status}
      </span>
    </div>
  );
}
