import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: '**/visual-candidates.spec.ts', testIgnore: [],
  projects: [{ name: '3d-candidates', use: {
    ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1,
    locale: 'vi-VN', timezoneId: 'UTC', colorScheme: 'light', contextOptions: { reducedMotion: 'reduce' },
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  } }],
});
