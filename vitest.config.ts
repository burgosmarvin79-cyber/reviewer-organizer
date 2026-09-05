/** Test runner configuration for browser-like unit tests executed in Node.js. */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // jsdom supplies document/window; setup.ts supplies the IndexedDB test double.
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Keep unrelated tools in Marvin's workspace out of the application suite.
    include: ['src/**/*.test.ts'],
  },
})
