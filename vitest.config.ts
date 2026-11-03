import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}', 'labs/src/**/*.test.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
    // Native observers and queued overlay callbacks must not reach another file's document.
    // Inline React Aria so its module state is isolated along with the DOM realm.
    isolate: true,
    server: { deps: { inline: [/react-aria/, /react-stately/, /@internationalized/] } },
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
  },
});
