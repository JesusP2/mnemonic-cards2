import devServer from "@hono/vite-dev-server";
import build from "@hono/vite-cloudflare-pages";
import adapter from "@hono/vite-dev-server/cloudflare";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    platform: 'node'
  },
  esbuild: {
    target: "es2022",
    platform: 'node',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
      platform: 'node'
    },
  },
  plugins: [
    build({
      entry: "./src/server/server.tsx",
    }),
    TanStackRouterVite(),
    react(),
    devServer({
      adapter,
      entry: "./src/server/server.tsx",
    }),
  ],
});
