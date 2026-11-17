import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import base from './vite.config';
import path from 'node:path';
const output = process.env.CI_REPORT_DIR || '../.runtime/ci';

// Full frontend scope. No include filter that could hide a failing file.
export default mergeConfig(base, defineConfig({
  test: {
    reporters: ['default', 'json', 'junit'],
    outputFile: {
      json: path.join(output, 'frontend.json'),
      junit: path.join(output, 'frontend.xml'),
    },
  },
}));
