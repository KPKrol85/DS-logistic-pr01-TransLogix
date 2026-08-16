const { defineConfig } = require("@playwright/test");

const isCI = !!process.env.CI;

module.exports = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:8080",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],
  webServer: {
    command: "npm run build && npx http-server dist -p 8080 -c-1",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
});
