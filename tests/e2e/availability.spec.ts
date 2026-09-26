import { expect, test } from "@playwright/test";

const systemBase = {
  configPath: "/tmp/index.yml",
  dbPath: null,
  guiPort: 9876,
};

test.describe("availability", () => {
  test("shows connection error inside the app shell", async ({ page }) => {
    await page.route("**/api/system", (route) => route.abort("failed"));
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: "Search" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { name: "Cannot connect to qmd-gui" }),
    ).toBeVisible();
  });

  test("shows missing qmd with POSIX recovery commands", async ({ page }) => {
    await page.route("**/api/system", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...systemBase,
          qmdFound: false,
          version: null,
          supported: false,
          platform: "darwin",
        }),
      });
    });
    await page.goto("/collections", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "qmd is unavailable" })).toBeVisible();
    await expect(page.getByText("command -v qmd")).toBeVisible();
  });

  test("shows unsupported version inside the app shell", async ({ page }) => {
    await page.route("**/api/system", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...systemBase,
          qmdFound: true,
          version: "2.0.0",
          supported: false,
          platform: "linux",
        }),
      });
    });
    await page.goto("/index", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: "Search" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", { name: "Unsupported qmd version" }),
    ).toBeVisible();
  });

  test("shows Windows recovery commands when platform is win32", async ({ page }) => {
    await page.route("**/api/system", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...systemBase,
          qmdFound: false,
          version: null,
          supported: false,
          platform: "win32",
        }),
      });
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("where.exe qmd")).toBeVisible();
  });
});
