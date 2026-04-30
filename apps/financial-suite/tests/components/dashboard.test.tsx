import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { EditableMoneyCell } from "../../components/finance/editable-money-cell";

describe("EditableMoneyCell", () => {
  it("debounces rapid typing and commits the final cents value", async () => {
    const commit = vi.fn();
    render(<EditableMoneyCell valueCents={1000} onCommit={commit} />);

    const input = screen.getByLabelText("Amount $10.00");
    fireEvent.change(input, { target: { value: "12" } });
    fireEvent.change(input, { target: { value: "12.34" } });

    await waitFor(() => expect(commit).toHaveBeenCalledWith(1234), {
      timeout: 1000,
    });
  });
});
