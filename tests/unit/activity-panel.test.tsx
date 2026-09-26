import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityPanel } from "../../src/web/components/ActivityPanel";

describe("ActivityPanel", () => {
  it("renders job lines and exit code", () => {
    render(
      <ActivityPanel
        open
        onToggle={() => undefined}
        jobs={[
          {
            id: "1",
            kind: "doctor",
            argv: ["doctor"],
            lines: [{ line: "ok", stream: "stdout" }],
            running: false,
            exitCode: 0,
          },
        ]}
      />,
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
    expect(screen.getAllByText(/exit 0/).length).toBeGreaterThan(0);
  });
});
