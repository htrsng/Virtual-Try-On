import { defineConfig, devices } from '@playwright/test';
import { randomUUID } from 'node:crypto';
const { configuration } = require('../qa/config.cjs');
process.env.QA_RUN_ID ||= `pw_${randomUUID().replaceAll('-', '')}`;
const qa = configuration();

export default defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./global-setup'),
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: process.env.QA_PW_JSON
    ? [['line'], ['json', { outputFile: process.env.QA_PW_JSON }]]
    : [['line'], ['html', { open: 'never' }]],
  use: {
    baseURL: qa.uiURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
