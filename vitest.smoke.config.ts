import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ["tests/smoke/**/*.test.ts"],
    testTimeout: 180_000,
    fileParallelism: false,
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    poolOptions: { forks: { singleFork: true } },
  },
  resolve: {
    alias: {
      "@shared": path.join(root, "src/shared"),
    },
  },
});
