/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: { host: "0.0.0.0", port: 3000, allowedHosts: true },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: { output: { manualChunks: { charts: ["recharts"], graph: ["cytoscape"], vendor: ["react", "react-dom", "react-router-dom"] } } },
  },
  test: { environment: "jsdom", globals: true, setupFiles: ["./tests/setup.ts"], css: false },
});
