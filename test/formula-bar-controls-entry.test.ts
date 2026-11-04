// @vitest-environment node
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { expect, it } from 'vitest';

it('UIC-FORMULA-BAR-4.4 controls-only consumers omit the built-in editor', async () => {
  const result = await build({
    stdin: {
      contents: "export { FormulaBarControls } from './src/components/formula-bar/index.js';",
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    write: false,
    metafile: true,
    platform: 'browser',
    format: 'esm',
    external: ['react', 'react-dom'],
  });
  const emitted = Object.values(result.metafile.outputs).flatMap((output) =>
    Object.entries(output.inputs)
      .filter(([, input]) => input.bytesInOutput > 0)
      .map(([path]) => resolve(path)),
  );
  expect(emitted).toContain(resolve('src/components/formula-bar/formula-bar-controls.tsx'));
  expect(emitted).not.toContain(resolve('src/components/formula-bar/formula-bar.tsx'));
  expect(emitted.some((path) => path.includes('/code-editor/'))).toBe(false);
});
