import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

// Separate opt-in compatibility matrix: does not change the 3D visual platform.
export default defineConfig({
  ...base,
  testIgnore: [],
  use: { ...base.use, actionTimeout: 10000 },
  testMatch: ['**/home.spec.ts', '**/checkout-journey.spec.ts', '**/compatibility.spec.ts'],
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 1000 } } },
    { name: 'tablet-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'mobile-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
