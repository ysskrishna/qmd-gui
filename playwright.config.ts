import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const root = path.dirname(fileURLToPath(import.meta.url));
const fakeQmd = path.join(root, "tests/fixtures/fake-qmd.mjs");
const e2eConfig = path.join(root, "tests/fixtures/e2e-config");
const e2ePort = 9876;

export default defineConfig({
  testDir: path.join(root, "tests/e2e"),
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://127.0.0.1:${e2ePort}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: `node bin/qmd-gui.js start --port ${e2ePort} --no-open --qmd ${fakeQmd}`,
    url: `http://127.0.0.1:${e2ePort}/health`,
    cwd: root,
    timeout: 120_000,
    env: {
      ...process.env,
      QMD_CONFIG_DIR: e2eConfig,
      FAKE_QMD_STATE: path.join(root, "tests/fixtures/e2e-config/.fake-state.json"),
    },
  },
});
