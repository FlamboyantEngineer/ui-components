// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import { extractTarGz } from '../scripts/lib/tar.mjs';

const fixtures: string[] = [];

afterEach(() => {
  for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true });
});

function createReleaseFixture() {
  const fixture = mkdtempSync(join(tmpdir(), 'ui-release-test-'));
  fixtures.push(fixture);
  const git = (args: string[]) =>
    execFileSync('git', args, { cwd: fixture, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const scripts = [
    'release.mjs',
    'lib/npm.mjs',
    'lib/script.mjs',
    'lib/reference-stylesheet.mjs',
    'lib/tar.mjs',
  ];
  for (const script of scripts) {
    const target = join(fixture, 'scripts', script);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(process.cwd(), 'scripts', script), target);
  }
  const manifest = {
    name: 'release-fixture',
    version: '0.1.0',
    files: ['dist', 'labs/build/reference.css'],
    scripts: {
      prepare: 'node missing-prepare.mjs',
      ...Object.fromEntries(
        ['build:package', 'build:labs', 'check:package', 'pack:labs'].map((name) => [
          name,
          'node -e "0"',
        ]),
      ),
    },
  };
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  writeFileSync(join(fixture, 'package.json'), manifestText);
  writeFileSync(join(fixture, '.gitignore'), 'dist/\nlabs/build/\n');
  git(['init', '--initial-branch=main']);
  git(['config', 'user.name', 'Library tests']);
  git(['config', 'user.email', 'library@example.test']);
  git(['config', 'commit.gpgsign', 'false']);
  git(['config', 'tag.gpgsign', 'false']);
  git(['add', '.']);
  git(['commit', '-m', 'Create release fixture']);
  git(['remote', 'add', 'origin', fixture]);
  git(['fetch', 'origin', 'main']);
  mkdirSync(join(fixture, 'dist'));
  mkdirSync(join(fixture, 'labs/build'), { recursive: true });
  writeFileSync(join(fixture, 'dist/index.js'), 'export const answer = 42;\n');
  writeFileSync(join(fixture, 'labs/build/reference.css'), '.ui-button {}\n');
  return { fixture, git, manifestText };
}

it('UIC-LABS-1.4 packs the tagged manifest and build output while preserving the checkout', () => {
  const { fixture, git, manifestText } = createReleaseFixture();
  execFileSync(process.execPath, [join(fixture, 'scripts/release.mjs')], {
    cwd: fixture,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const extracted = join(fixture, 'extracted');
  extractTarGz(join(fixture, 'release-fixture-0.1.0.tgz'), extracted);
  const packedManifest = readFileSync(join(extracted, 'package/package.json'), 'utf8');
  expect(packedManifest).toBe(git(['show', 'v0.1.0:package.json']));
  expect(JSON.parse(packedManifest) as { scripts: Record<string, string> }).not.toHaveProperty(
    'scripts.prepare',
  );
  expect(readFileSync(join(extracted, 'package/dist/index.js'), 'utf8')).toBe(
    git(['show', 'v0.1.0:dist/index.js']),
  );
  expect(readFileSync(join(fixture, 'package.json'), 'utf8')).toBe(manifestText);
  expect(git(['branch', '--show-current']).trim()).toBe('main');
});

it('UIC-LABS-1.4 leaves the version untagged when packing fails', () => {
  const { fixture, git } = createReleaseFixture();
  mkdirSync(join(fixture, 'release-fixture-0.1.0.tgz'));
  expect(() =>
    execFileSync(process.execPath, [join(fixture, 'scripts/release.mjs')], {
      cwd: fixture,
      stdio: ['pipe', 'pipe', 'pipe'],
    }),
  ).toThrow();
  expect(git(['tag', '--list', 'v0.1.0']).trim()).toBe('');
});
