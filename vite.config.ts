import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(root, "src/web"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.join(root, "src/web"),
      "@shared": path.join(root, "src/shared"),
    },
  },
  build: {
    outDir: path.join(root, "dist/web"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8765",
        changeOrigin: true,
      },
    },
  },
});
