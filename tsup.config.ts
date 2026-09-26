import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "server/cli": "src/server/cli.ts",
    "server/app": "src/server/app.ts",
  },
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  clean: false,
  sourcemap: true,
  dts: false,
  tsconfig: "tsconfig.server.json",
  splitting: false,
});
