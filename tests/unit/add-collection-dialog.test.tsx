import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AddCollectionDialog } from "../../src/web/components/collections/AddCollectionDialog";
import { ActivityProvider } from "../../src/web/context/activity";

function Harness() {
  const [open, setOpen] = useState(true);
  return (
    <ActivityProvider>
      <button type="button" onClick={() => setOpen(false)}>
        Close dialog
      </button>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <AddCollectionDialog
        open={open}
        onClose={() => setOpen(false)}
        onAdded={() => undefined}
      />
    </ActivityProvider>
  );
}

describe("AddCollectionDialog", () => {
  it("clears the folder path when opened again", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const path = screen.getByPlaceholderText("/Users/you/Documents/notes");
    await user.type(path, "/tmp/notes");
    expect(path).toHaveValue("/tmp/notes");

    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByPlaceholderText("/Users/you/Documents/notes")).toHaveValue("");
  });
});
