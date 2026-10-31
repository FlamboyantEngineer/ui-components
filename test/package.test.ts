// @vitest-environment node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectPackages } from './module-imports.js';

const manifest = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
  files: string[];
  scripts: Record<string, string>;
  exports: Record<string, unknown>;
  sideEffects: boolean;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  private: boolean;
  publishConfig?: unknown;
};

describe('package manifest', () => {
  it('UIC-LABS-1.2 distributes runnable labs separately from the installed library', () => {
    expect(manifest.files.filter((entry) => entry.startsWith('labs'))).toEqual([
      'labs/build/reference.css',
    ]);
    expect(manifest.files).toContain('dist');
    expect(manifest.scripts['pack:labs']).toBe('node scripts/pack-labs.mjs');
  });

  it('UIC-HOOKS-3.1 ships tree-shakeable ESM entry points and no styling dependency', () => {
    expect(manifest.sideEffects).toBe(false);
    expect(manifest.exports['./*']).toEqual({
      types: './dist/components/*/index.d.ts',
      import: './dist/components/*/index.js',
      default: './dist/components/*/index.js',
    });
    // Resolvers that do not assert `import` (require(esm), Jest) fall through to `default`.
    for (const entry of Object.values(manifest.exports)) {
      if (typeof entry === 'string') continue;
      const conditions = entry as Record<string, string>;
      expect(Object.keys(conditions)).toEqual(['types', 'import', 'default']);
      expect(conditions.default).toBe(conditions.import);
    }
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

  it('UIC-LABS-1.4 tags every exported build output with a manifest that builds nothing', () => {
    const release = readFileSync(join(process.cwd(), 'scripts/release.mjs'), 'utf8');
    expect(release).toContain("const BUILT = ['dist', REFERENCE_STYLESHEET];");
    expect(release).toContain('delete manifest.scripts.prepare;');
    expect(release).toMatch(/'origin\/main'/);
    for (const script of ['check-package.mjs', 'check-server-components.mjs', 'release.mjs']) {
      const source = readFileSync(join(process.cwd(), 'scripts', script), 'utf8');
      expect(source).toContain("'--ignore-scripts'");
    }
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
      default: './dist/testing/index.js',
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
      default: './dist/core/locales/index.js',
    });
    expect(manifest.exports['./locales/*.json']).toBe('./dist/core/locales/*.json');
    expect(manifest.dependencies['intl-messageformat']).toBeDefined();
  });
});

describe('source maps', () => {
  it('UIC-LABS-1.5 ships the sources the maps point at, without their tests', () => {
    expect(manifest.files).toEqual(expect.arrayContaining(['dist', 'src', '!src/**/*.test.*']));
    expect(manifest.scripts['check:package']).toBe('node scripts/check-package.mjs');
  });
});

describe('Git branch install', () => {
  it('UIC-LABS-1.4 UIC-LABS-1.6 prepares the entry points and the reference stylesheet, not the labs', () => {
    // The prepare script builds only when npm prepares or packs the package, not after npm ci.
    expect(manifest.scripts.prepare).toBe('node scripts/prepare.mjs');
    const prepare = readFileSync(join(process.cwd(), 'scripts/prepare.mjs'), 'utf8');
    expect(prepare).toContain("['run', 'build:package']");
    expect(prepare).toContain('npm_package_resolved');
    expect(manifest.scripts['build:package']).toBe(
      'npm run build && node scripts/build-labs.mjs --reference',
    );
    expect(manifest.exports['./reference.css']).toBe('./labs/build/reference.css');
  });
});

describe('hosted CI', () => {
  const workflow = readFileSync(join(process.cwd(), '.github/workflows/ci.yml'), 'utf8');
  const checks = readFileSync(join(process.cwd(), 'scripts/check.mjs'), 'utf8');

  it('UIC-PRIMITIVES-2.1 runs the shared gate list, which checks public types after the build', () => {
    expect(workflow).toMatch(/^\s+run: npm run check$/m);
    const build = checks.indexOf("'build',");
    const publicTypes = checks.indexOf("'check:public-types'");
    expect(build).toBeGreaterThan(-1);
    expect(publicTypes).toBeGreaterThan(checks.indexOf('],', build));
  });

  it('UIC-LABS-1.4 installs from Git when the manifest, lockfile, build setup or entry points change', () => {
    expect(workflow).toContain('npm run check:git-install');
    const start = workflow.indexOf('\n            install:');
    const filters = workflow.slice(start, workflow.indexOf('- uses:', start));
    for (const path of [
      'package.json',
      'package-lock.json',
      'tsconfig.build.json',
      'src/index.ts',
      'src/components/*/index.ts',
      'labs/reference/**',
    ]) {
      expect(filters).toContain(`- ${path}\n`);
    }
  });
});

describe('optional rich-text peers', () => {
  const RICH_TEXT_PEER = /^(prosemirror-|@handlewithcare\/react-prosemirror|react-reconciler)/;
  const componentsDir = join(process.cwd(), 'src/components');
  /** Every component entry point the `./*` export serves, as its subpath. */
  const entries = readdirSync(componentsDir).flatMap((name) =>
    [name, `${name}/rich`].filter((entry) => existsSync(join(componentsDir, entry, 'index.ts'))),
  );

  it('UIC-MESSAGE-COMPOSER-4.1 are reached only from the rich text, rich composer and chat entry points', () => {
    const needsPeers = entries.filter((entry) =>
      collectPackages(`src/components/${entry}/index.ts`).some((name) => RICH_TEXT_PEER.test(name)),
    );
    expect(needsPeers.sort()).toEqual(['chat', 'message-composer/rich', 'rich-text-editor']);
    for (const entry of ['src/index.ts', 'src/core/index.ts']) {
      expect(collectPackages(entry).filter((name) => RICH_TEXT_PEER.test(name))).toEqual([]);
    }
  });

  it('UIC-MESSAGE-COMPOSER-4.1 pins prosemirror-view exactly where the React view requires it', () => {
    const view = JSON.parse(
      readFileSync(
        join(process.cwd(), 'node_modules/@handlewithcare/react-prosemirror/package.json'),
        'utf8',
      ),
    ) as { peerDependencies: Record<string, string> };
    const required = view.peerDependencies['prosemirror-view'];
    expect(manifest.peerDependencies['prosemirror-view']).toBe(required);
    expect(manifest.devDependencies['prosemirror-view']).toBe(required);
  });
});
