import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../../src/web/App";

describe("App", () => {
  it('renders "Hello"', () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Hello" })).toBeInTheDocument();
  });
});
