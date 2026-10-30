// @vitest-environment node
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

async function retainedIcons(contents: string) {
  const result = await build({
    stdin: { contents, resolveDir: process.cwd(), loader: 'ts' },
    bundle: true,
    write: false,
    minify: true,
    format: 'esm',
    platform: 'browser',
    external: ['react', 'react-dom', 'react/*', 'react-dom/*'],
    define: { 'process.env.NODE_ENV': '"production"' },
    metafile: true,
  });
  return Object.values(result.metafile.outputs).flatMap((output) =>
    Object.entries(output.inputs)
      .filter(([path, input]) => path.includes('@heroicons/') && input.bytesInOutput > 0)
      .map(([path]) => path.split('/').at(-1)),
  );
}

describe('icon tree shaking', () => {
  it('UIC-ICON-1.1 retains no default icons for a Button-only entry point', async () => {
    expect(
      await retainedIcons("export { Button } from './src/components/button/index.ts'"),
    ).toEqual([]);
  });

  it('UIC-ICON-1.1 retains only the requested icon through the package root', async () => {
    expect(await retainedIcons("export { Button, PlusGlyph } from './src/index.ts'")).toEqual([
      'PlusIcon.js',
    ]);
  });
});
