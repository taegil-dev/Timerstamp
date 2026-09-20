import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    outDir: "dist-electron",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "electron/main.ts"),
        preload: resolve(__dirname, "electron/preload.ts"),
      },
      external: ["electron", "electron-store", "node:path"],
      output: {
        format: "cjs",
        entryFileNames: "[name].cjs",
      },
    },
  },
});