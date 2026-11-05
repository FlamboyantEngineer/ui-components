// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, it } from 'vitest';

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function git(repo: string, ...args: string[]) {
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: 'pipe' }).trim();
}

function createRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'ui-cleanup-'));
  dirs.push(dir);
  const repo = join(dir, 'checkout with spaces');
  mkdirSync(join(repo, 'scripts'), { recursive: true });
  copyFileSync('scripts/cleanup.mjs', join(repo, 'scripts/cleanup.mjs'));
  copyFileSync('cleanup', join(repo, 'cleanup'));
  git(repo, 'init', '--initial-branch=dev');
  git(repo, 'config', 'user.email', 'test@example.com');
  git(repo, 'config', 'user.name', 'Test');
  git(repo, 'config', 'commit.gpgsign', 'false');
  writeFileSync(join(repo, 'tracked.txt'), 'initial');
  git(repo, 'add', 'tracked.txt');
  git(repo, 'commit', '-m', 'Initial');
  git(repo, 'remote', 'add', 'origin', repo);
  git(repo, 'update-ref', 'refs/remotes/origin/dev', 'HEAD');
  return { dir, repo };
}

function runCleanup(repo: string, cwd: string) {
  if (process.platform === 'win32') {
    execFileSync(process.execPath, [join(repo, 'scripts/cleanup.mjs')], { cwd, stdio: 'pipe' });
  } else {
    execFileSync('sh', [join(repo, 'cleanup')], { cwd, stdio: 'pipe' });
  }
}

it('cleans test output from its own repository and preserves sources, builds and dependencies', () => {
  const { dir, repo } = createRepo();
  const removed = [
    'coverage/report.json',
    'test-results/run/trace.zip',
    'playwright-report/index.html',
    'blob-report/report.zip',
    'node_modules/.cache/typecheck.tsbuildinfo',
    'node_modules/.vite/vitest/results.json',
  ];
  const kept = [
    'src/component.tsx',
    'dist/index.js',
    'labs/build/reference.css',
    'node_modules/example/index.js',
    'package-lock.json',
    'notes.tmp',
  ];
  for (const file of [...removed, ...kept]) {
    mkdirSync(dirname(join(repo, file)), { recursive: true });
    writeFileSync(join(repo, file), 'fixture');
  }
  mkdirSync(join(dir, 'test-results'));
  writeFileSync(join(dir, 'test-results/keep.txt'), 'another directory');

  runCleanup(repo, dir);
  runCleanup(repo, dir);

  for (const file of removed) expect(existsSync(join(repo, file)), file).toBe(false);
  for (const file of kept) expect(existsSync(join(repo, file)), file).toBe(true);
  expect(existsSync(join(dir, 'test-results/keep.txt'))).toBe(true);
});

it('returns to dev tracking origin/dev, preserving local dev commits and deleting unmerged branches', () => {
  const { dir, repo } = createRepo();
  writeFileSync(join(repo, 'tracked.txt'), 'local dev');
  git(repo, 'commit', '-am', 'Local dev');
  const devCommit = git(repo, 'rev-parse', 'HEAD');
  git(repo, 'switch', '-c', 'working');
  writeFileSync(join(repo, 'tracked.txt'), 'unmerged work');
  git(repo, 'commit', '-am', 'Working branch');
  git(repo, 'branch', 'another-working-branch');

  runCleanup(repo, dir);

  expect(git(repo, 'branch', '--show-current')).toBe('dev');
  expect(git(repo, 'rev-parse', 'HEAD')).toBe(devCommit);
  expect(git(repo, 'rev-parse', '--abbrev-ref', 'dev@{upstream}')).toBe('origin/dev');
  expect(git(repo, 'for-each-ref', '--format=%(refname)', 'refs/heads/')).toBe('refs/heads/dev');
  expect(git(repo, 'rev-parse', '--verify', 'refs/remotes/origin/dev')).not.toBe(devCommit);
});

it('creates local dev from origin/dev when it is missing', () => {
  const { dir, repo } = createRepo();
  git(repo, 'branch', '-m', 'working');

  runCleanup(repo, dir);

  expect(git(repo, 'branch', '--show-current')).toBe('dev');
  expect(git(repo, 'rev-parse', '--abbrev-ref', 'dev@{upstream}')).toBe('origin/dev');
  expect(git(repo, 'for-each-ref', '--format=%(refname)', 'refs/heads/')).toBe('refs/heads/dev');
});

it('stops before deleting branches or output when uncommitted work prevents switching to dev', () => {
  const { dir, repo } = createRepo();
  git(repo, 'switch', '-c', 'working');
  writeFileSync(join(repo, 'tracked.txt'), 'working');
  git(repo, 'commit', '-am', 'Working branch');
  writeFileSync(join(repo, 'tracked.txt'), 'uncommitted');
  mkdirSync(join(repo, 'test-results'));
  writeFileSync(join(repo, 'test-results/keep.txt'), 'report');

  expect(() => runCleanup(repo, dir)).toThrow();

  expect(git(repo, 'branch', '--show-current')).toBe('working');
  expect(git(repo, 'branch', '--list', 'working')).not.toBe('');
  expect(existsSync(join(repo, 'test-results/keep.txt'))).toBe(true);
});
