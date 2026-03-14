// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    starlight({
      title: "Kalshi Command Center",
      sidebar: [
        {
          label: "Getting Started",
          items: [{ label: "Overview", slug: "docs/overview" }],
        },
        {
          label: "Trading Bot",
          items: [
            { label: "Architecture", slug: "docs/bot/architecture" },
            { label: "Configuration", slug: "docs/bot/configuration" },
            { label: "Strategies", slug: "docs/bot/strategies" },
          ],
        },
        {
          label: "API Reference",
          items: [
            { label: "Authentication", slug: "docs/api/authentication" },
            { label: "Endpoints", slug: "docs/api/endpoints" },
          ],
        },
      ],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        external: ["better-sqlite3"],
      },
    },
    optimizeDeps: {
      exclude: ["better-sqlite3"],
    },
  },
});
