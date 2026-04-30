"use client";

import { useRouter } from "next/navigation";

export function MonthPicker({ monthKey }: { monthKey: string }) {
  const router = useRouter();

  return (
    <label style={{ display: "grid", gap: 4, minWidth: 160 }}>
      <span style={{ color: "var(--muted)", fontSize: 12 }}>Month</span>
      <input
        className="input"
        type="month"
        value={monthKey}
        onChange={(event) => router.push(`/dashboard/${event.target.value}`)}
      />
    </label>
  );
}
