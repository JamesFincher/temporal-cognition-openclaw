/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FinancialTable } from "../components/financial-table";

const mocks = vi.hoisted(() => ({
  deleteItem: vi.fn(),
  upsertItem: vi.fn(),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    financial: {
      deleteFinancialItem: "deleteFinancialItem",
      upsertFinancialItem: "upsertFinancialItem",
    },
  },
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn((mutationName: string) =>
    mutationName === "upsertFinancialItem" ? mocks.upsertItem : mocks.deleteItem,
  ),
}));

describe("FinancialTable", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.upsertItem.mockReset();
    mocks.upsertItem.mockResolvedValue({});
    mocks.deleteItem.mockReset();
    mocks.deleteItem.mockResolvedValue({});
  });

  it("autosaves edited amounts with the selected month", async () => {
    render(
      <FinancialTable
        category="fixed_bill"
        items={[
          {
            _id: "item_1" as never,
            category: "fixed_bill",
            label: "Rent",
            amountCents: 140000,
            monthKey: "2026-04",
          },
        ]}
        monthKey="2026-04"
      />,
    );

    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "1500" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(mocks.upsertItem).toHaveBeenCalledWith(
      expect.objectContaining({
        amountCents: 150000,
        itemId: "item_1",
        monthKey: "2026-04",
      }),
    );
  });

  it("debounces new rows so rapid edits create one item", async () => {
    mocks.upsertItem.mockResolvedValue({ _id: "item_new" });
    render(
      <FinancialTable category="fixed_bill" items={[]} monthKey="2026-04" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add row" }));
    fireEvent.change(screen.getByLabelText("Label"), {
      target: { value: "Internet" },
    });
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "89.50" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(mocks.upsertItem).toHaveBeenCalledTimes(1);
    expect(mocks.upsertItem).toHaveBeenCalledWith(
      expect.objectContaining({
        amountCents: 8950,
        itemId: undefined,
        label: "Internet",
        monthKey: "2026-04",
      }),
    );
  });

  it("shows an error when an autosave fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.upsertItem.mockRejectedValue(new Error("offline"));
    render(
      <FinancialTable
        category="fixed_bill"
        items={[
          {
            _id: "item_1" as never,
            category: "fixed_bill",
            label: "Rent",
            amountCents: 140000,
            monthKey: "2026-04",
          },
        ]}
        monthKey="2026-04"
      />,
    );

    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "1500" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(screen.getByRole("alert").textContent).toContain("Could not save");
    consoleError.mockRestore();
  });
});
