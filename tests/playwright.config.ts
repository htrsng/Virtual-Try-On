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
  timeout: 90000,
  snapshotPathTemplate: '{testDir}/../visual-baselines/{projectName}/{platform}/{arg}{ext}',
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
      testIgnore: '**/tryon-3d.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: '3d-chromium', testMatch: '**/tryon-3d.spec.ts', grepInvert: /@visual/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1,
        locale: 'vi-VN', timezoneId: 'UTC', colorScheme: 'light', contextOptions: { reducedMotion: 'reduce' },
        launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
    },
    ...(process.env.QA_3D_VISUAL === '1' ? [{
      name: '3d-visual', testMatch: '**/tryon-3d.spec.ts', grep: /@visual/,
      grepInvert: process.env.QA_3D_DIAGNOSTIC === '1' ? undefined : /@diagnostic/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1,
        locale: 'vi-VN', timezoneId: 'UTC', colorScheme: 'light' as const, contextOptions: { reducedMotion: 'reduce' as const },
        launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
    }] : []),
  ],
});
