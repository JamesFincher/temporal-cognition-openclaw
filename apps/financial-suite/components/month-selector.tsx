"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function shiftMonth(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function MonthSelector({
  monthKey,
  onMonthChange,
}: {
  monthKey: string;
  onMonthChange: (monthKey: string) => void;
}) {
  const getOrCreateMonth = useMutation(api.financial.getOrCreateMonth);
  const copyPreviousMonth = useMutation(api.financial.copyPreviousMonth);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = useMemo(() => {
    const [year, month] = monthKey.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }, [monthKey]);

  async function createMonth(nextMonthKey: string) {
    setIsWorking(true);
    setError(null);
    try {
      await getOrCreateMonth({
        monthKey: nextMonthKey,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      onMonthChange(nextMonthKey);
    } catch (caught) {
      console.error("Failed to create or load month", {
        nextMonthKey,
        error: caught,
      });
      setError("Could not load that month. Try again.");
    } finally {
      setIsWorking(false);
    }
  }

  async function copyTemplate() {
    setIsWorking(true);
    setError(null);
    try {
      await copyPreviousMonth({
        fromMonthKey: shiftMonth(monthKey, -1),
        toMonthKey: monthKey,
        includeActuals: false,
      });
    } catch (caught) {
      console.error("Failed to copy previous month template", {
        fromMonthKey: shiftMonth(monthKey, -1),
        toMonthKey: monthKey,
        error: caught,
      });
      setError("Could not copy the previous month. Try again.");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <button
        onClick={() => createMonth(shiftMonth(monthKey, -1))}
        type="button"
      >
        Previous
      </button>
      <strong>{label}</strong>
      <button
        onClick={() => createMonth(shiftMonth(monthKey, 1))}
        type="button"
      >
        Next
      </button>
      <button
        disabled={isWorking}
        onClick={() => createMonth(monthKey)}
        type="button"
      >
        Create month
      </button>
      <button disabled={isWorking} onClick={copyTemplate} type="button">
        Copy previous template
      </button>
      {error ? (
        <small role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </small>
      ) : null}
    </div>
  );
}
