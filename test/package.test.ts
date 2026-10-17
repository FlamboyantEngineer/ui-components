// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
  files: string[];
  exports: Record<string, unknown>;
  sideEffects: boolean;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  publishConfig: { registry: string };
};

describe('package manifest', () => {
  it('UIC-LABS-1.2 ships the lab pages, reference sheet and built bundles but not lab sources', () => {
    expect(manifest.files).toEqual(
      expect.arrayContaining(['labs/*.html', 'labs/*.css', 'labs/reference', 'labs/build']),
    );
    expect(manifest.files.some((entry) => entry.startsWith('labs/src'))).toBe(false);
  });

  it('UIC-HOOKS-3.1 ships tree-shakeable ESM entry points and no styling dependency', () => {
    expect(manifest.sideEffects).toBe(false);
    expect(manifest.exports['./*']).toEqual({
      types: './dist/components/*/index.d.ts',
      import: './dist/components/*/index.js',
    });
    const dependencies = [
      ...Object.keys(manifest.dependencies),
      ...Object.keys(manifest.peerDependencies),
    ];
    expect(
      dependencies.filter((name) =>
        /^(@heroui\/|tailwind|styled-components|@emotion\/|@stitches\/|@vanilla-extract\/)/.test(
          name,
        ),
      ),
    ).toEqual([]);
  });

  it('publishes to GitHub Packages with React as a peer', () => {
    expect(manifest.publishConfig.registry).toBe('https://npm.pkg.github.com');
    expect(Object.keys(manifest.peerDependencies).sort()).toEqual(['react', 'react-dom']);
  });
});
