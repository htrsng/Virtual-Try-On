import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import base from './vite.config';

// Historical ProductList/Toast subset used by the archived runner (14 tests).
// The full frontend suite also includes payment and DOM-only try-on composition.
export default mergeConfig(base, defineConfig({
  test: {
    include: ['src/components/ProductList.test.jsx', 'src/components/Toast.test.jsx'],
    reporters: ['default', 'junit'],
    outputFile: process.env.QA_FRONTEND_JUNIT || '../.runtime/frontend/components-junit.xml',
  },
}));
