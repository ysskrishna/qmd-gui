import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CommandPreview } from "../../src/web/components/CommandPreview";

describe("CommandPreview", () => {
  it("renders shell preview and copies", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText: write } });

    render(<CommandPreview argv={["search", "--", "-docker"]} />);
    expect(screen.getByText(/qmd search/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /copy/i }));
    expect(write).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
