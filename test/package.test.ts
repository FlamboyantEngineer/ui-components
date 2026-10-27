// @vitest-environment node
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
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
  it('UIC-LABS-1.2 ships the lab pages, reference sheet and built bundles but not lab sources', () => {
    expect(manifest.files).toEqual(
      expect.arrayContaining(['labs/*.html', 'labs/*.css', 'labs/reference', 'labs/build']),
    );
    expect(manifest.files.some((entry) => entry.startsWith('labs/src'))).toBe(false);
    expect(manifest.files).not.toContain('!labs/build/vendor');
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
  it('UIC-LABS-1.4 prepares the entry points and the reference stylesheet, not the lab bundles', () => {
    expect(manifest.scripts.prepare).toBe('npm run build:package');
    expect(manifest.scripts['build:package']).toBe(
      'npm run build && node scripts/build-labs.mjs --reference',
    );
  });

  it('UIC-LABS-1.4 builds only labs/build/reference.css and keeps the rest of labs/build', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'ui-reference-build-'));
    try {
      for (const path of [
        'scripts/build-labs.mjs',
        'scripts/lib/labs.mjs',
        'labs/reference.css',
        'labs/reference',
      ]) {
        cpSync(join(process.cwd(), path), join(fixture, path), { recursive: true });
      }
      symlinkSync(join(process.cwd(), 'node_modules'), join(fixture, 'node_modules'), 'dir');
      mkdirSync(join(fixture, 'labs', 'build'));
      writeFileSync(join(fixture, 'labs', 'build', 'button.js'), 'kept');

      execFileSync('node', ['scripts/build-labs.mjs', '--reference'], {
        cwd: fixture,
        stdio: 'pipe',
      });

      expect(readdirSync(join(fixture, 'labs', 'build')).sort()).toEqual([
        'button.js',
        'reference.css',
      ]);
      expect(readFileSync(join(fixture, 'labs', 'build', 'button.js'), 'utf8')).toBe('kept');
      const css = readFileSync(join(fixture, 'labs', 'build', 'reference.css'), 'utf8');
      expect(css).toContain('.ui-button');
      expect(css).not.toContain('@import');
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
});
