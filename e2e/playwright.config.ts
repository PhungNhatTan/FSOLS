import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
  },

  webServer: [
    {
      command: "npm run dev",
      cwd: "../server",
      port: 3000, // ← backend PORT
      reuseExistingServer: true,
      env: {
        NODE_ENV: "test",
      },
    },
    {
      command: "npm run dev",
      cwd: "../client",
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
