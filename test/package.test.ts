// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
  files: string[];
  scripts: Record<string, string>;
  exports: Record<string, unknown>;
  sideEffects: boolean;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  private: boolean;
  publishConfig?: unknown;
};

describe('package manifest', () => {
  it('UIC-LABS-1.2 distributes runnable labs separately from the installed library', () => {
    expect(manifest.files.some((entry) => entry.startsWith('labs'))).toBe(false);
    expect(manifest.files).toContain('dist');
    expect(manifest.scripts['pack:labs']).toBe('node scripts/pack-labs.mjs');
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

  it('releases through git tags, not a registry, with React as the only required peer', () => {
    expect(manifest.private).toBe(true);
    expect(manifest.publishConfig).toBeUndefined();
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

  it('UIC-PROVIDER-3.5 exports the shipped language files as modules and as JSON', () => {
    expect(manifest.exports['./locales']).toEqual({
      types: './dist/core/locales/index.d.ts',
      import: './dist/core/locales/index.js',
    });
    expect(manifest.exports['./locales/*.json']).toBe('./dist/core/locales/*.json');
    expect(manifest.dependencies['intl-messageformat']).toBeDefined();
  });
});

describe('Git branch install', () => {
  it('UIC-LABS-1.4 prepares the library entry points without building labs', () => {
    expect(manifest.scripts.prepare).toBe('npm run build');
  });
});
