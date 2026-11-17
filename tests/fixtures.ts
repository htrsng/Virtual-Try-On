import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
const { configuration } = require('../qa/config.cjs');
const { control } = require('../qa/environment.cjs');

type QaData = { accounts: Record<string, { email: string; password: string }>; fixture: {
  ids: Record<string, string>; productIds: number[]; assets: string[]; itemId: string;
}; apiURL: string; uiURL: string };
export const test = base.extend<{ qaData: QaData }>({
  context: async ({ context }, use) => {
    const config = configuration();
    const origins = new Set([config.apiURL, config.uiURL]);
    await context.addInitScript(() => localStorage.setItem('language', 'vi'));
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      return ['http:', 'https:'].includes(url.protocol) && !origins.has(url.origin)
        ? route.abort('blockedbyclient') : route.continue();
    });
    await use(context);
  },
  qaData: [async ({}, use) => {
    const config = configuration();
    await control('reset', config);
    const data = JSON.parse(fs.readFileSync(config.manifest, 'utf8'));
    try { await use(data); } finally { await control('clear', config); }
  }, { auto: true }],
});
export { expect };
