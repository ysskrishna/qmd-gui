import { expect, test } from "@playwright/test";

test("main flows with fake-qmd", async ({ page }) => {
  await page.goto("/collections", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Collections" })).toBeVisible({
    timeout: 30_000,
  });

  await page.goto("/search", { waitUntil: "domcontentloaded" });
  const query = page.getByRole("textbox", { name: "Query" });
  await expect(query).toBeVisible({ timeout: 30_000 });

  await query.fill("readme");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("Hello fixture").first()).toBeVisible({
    timeout: 30_000,
  });

  await page.getByText("Hello fixture").first().click();
  const drawer = page.getByRole("complementary", { name: "Document" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button").first().click();

  await page.getByRole("link", { name: "Collections" }).click();
  await page.getByRole("switch", { name: /Include demo in default search/ }).click();

  await page.getByRole("link", { name: "demo" }).click();
  await page.getByRole("tab", { name: /Settings/ }).click();
  await expect(page.getByRole("heading", { name: "What gets indexed" })).toBeVisible();

  await page.getByRole("link", { name: /^Index/ }).click();
  await expect(page.getByRole("heading", { name: "Index", exact: true })).toBeVisible();
  await page
    .locator("div")
    .filter({ hasText: /^Generate embeddings/ })
    .getByRole("button", { name: "Run" })
    .click();

  await page.getByRole("link", { name: "AI agents" }).click();
  await expect(page.getByRole("heading", { name: "AI agents" })).toBeVisible();
  await page.getByRole("button", { name: "Start server" }).click();
  await expect(page.getByText(/Running · PID/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Stop server" }).click();
  await expect(page.getByText(/^Stopped$/)).toBeVisible({ timeout: 30_000 });

  await page.getByRole("link", { name: "Collections" }).click();
  await page.getByRole("button", { name: "Add collection" }).click();
  await page.getByLabel("Folder path").fill("/tmp/qmd-gui-e2e-notes");
  await page.getByRole("button", { name: "Add and index" }).click();
  await expect(page.getByText(/added/i)).toBeVisible({ timeout: 30_000 });
});
