import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.join(root, "src/web"),
    },
  },
  test: {
    setupFiles: ["tests/setup.ts"],
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environmentMatchGlobs: [["tests/**/*.test.tsx", "jsdom"]],
    testTimeout: 15_000,
    fileParallelism: false,
  },
});
