import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommandPreview } from "../../src/web/components/CommandPreview";

describe("web shell", () => {
  it("renders command preview", () => {
    render(<CommandPreview argv={["status"]} />);
    expect(screen.getByText("qmd status")).toBeInTheDocument();
  });
});
