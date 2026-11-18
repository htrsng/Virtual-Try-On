import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: ['**/home.spec.ts', '**/checkout-journey.spec.ts', '**/production.spec.ts'],
  projects: [{ name: 'production-chromium', use: { ...devices['Desktop Chrome'] } }],
});
