import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd ../server && node index.js',
      port: 3000,
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'cd ../client && npm run dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 120000,
    }
  ],
});
