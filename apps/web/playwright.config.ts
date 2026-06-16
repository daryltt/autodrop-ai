import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright",
  use: {
    baseURL: "http://127.0.0.1:3000"
  },
  webServer: {
    command: "node .next/standalone/apps/web/server.js",
    cwd: __dirname,
    port: 3000,
    timeout: 120_000,
    reuseExistingServer: false
  }
});
