import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}', 'labs/src/**/*.test.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
    // A fresh jsdom and module graph for every file cost more than the tests themselves, so files
    // share a worker's jsdom and React. React Aria is inlined so that test/setup.ts, which resets
    // the modules and the document for each file, also resets React Aria's module state.
    isolate: false,
    server: { deps: { inline: [/react-aria/, /react-stately/, /@internationalized/] } },
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
  },
});
