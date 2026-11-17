import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import base from './vite.config';

// Full frontend scope. No include filter that could hide a failing file.
export default mergeConfig(base, defineConfig({
  test: {
    reporters: ['default', 'json', 'junit'],
    outputFile: {
      json: '../.runtime/ci/frontend.json',
      junit: '../.runtime/ci/frontend.xml',
    },
  },
}));
