import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import base from './vite.config';

// Explicit component scope. The legacy WebGL integration test is not in this suite.
export default mergeConfig(base, defineConfig({
  test: {
    include: ['src/components/ProductList.test.jsx', 'src/components/Toast.test.jsx'],
    reporters: ['default', 'junit'],
    outputFile: process.env.QA_FRONTEND_JUNIT || '../.runtime/frontend/components-junit.xml',
  },
}));
