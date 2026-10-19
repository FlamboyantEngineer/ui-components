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
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
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

  it('publishes to GitHub Packages with React as the only required peer', () => {
    expect(manifest.publishConfig.registry).toBe('https://npm.pkg.github.com');
    const isOptional = (name: string) => manifest.peerDependenciesMeta?.[name]?.optional === true;
    expect(
      Object.keys(manifest.peerDependencies)
        .filter((name) => !isOptional(name))
        .sort(),
    ).toEqual(['react', 'react-dom']);
  });

  it('UIC-TESTING-1.1 exports the testing helpers with optional Testing Library peers', () => {
    expect(manifest.exports['./testing']).toEqual({
      types: './dist/testing/index.d.ts',
      import: './dist/testing/index.js',
    });
    for (const name of ['@testing-library/dom', '@testing-library/user-event']) {
      expect(manifest.peerDependencies[name]).toBeDefined();
      expect(manifest.peerDependenciesMeta?.[name]?.optional).toBe(true);
    }
  });
});
