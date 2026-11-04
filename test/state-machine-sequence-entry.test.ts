// @vitest-environment node
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { expect, it } from 'vitest';

it('UIC-STATE-MACHINE-VIEW-4.7 sequence-only consumers omit graph editing code', async () => {
  const result = await build({
    stdin: {
      contents:
        "export { StateMachineSequence } from './src/components/state-machine-view/index.js';",
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
  expect(emitted).toContain(
    resolve('src/components/state-machine-view/state-machine-sequence.tsx'),
  );
  expect(emitted).not.toContain(
    resolve('src/components/state-machine-view/state-machine-graph.tsx'),
  );
  expect(emitted.some((path) => path.includes('/diagram-canvas/'))).toBe(false);
});
