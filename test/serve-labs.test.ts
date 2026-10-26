// @vitest-environment node
import { spawn, type ChildProcess } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let server: ChildProcess;
let baseUrl: string;
let fixture: string;

beforeAll(async () => {
  fixture = mkdtempSync(join(tmpdir(), 'ui-lab-server-'));
  const labs = join(fixture, 'labs');
  mkdirSync(labs);
  copyFileSync(join(process.cwd(), 'labs/index.html'), join(labs, 'index.html'));
  writeFileSync(join(fixture, 'outside.txt'), 'Outside the lab directory');
  symlinkSync('../outside.txt', join(labs, 'outside.txt'));
  symlinkSync('index.html', join(labs, 'alias.html'));
  server = spawn(process.execPath, [
    join(process.cwd(), 'scripts/serve-labs.mjs'),
    '--port',
    '0',
    '--dir',
    labs,
  ]);
  baseUrl = await new Promise<string>((resolve, reject) => {
    server.stdout?.on('data', (chunk: Buffer) => {
      const url = chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0];
      if (url) resolve(url);
    });
    server.once('error', reject);
    server.once('exit', (code) => reject(new Error(`Lab server exited with ${code}`)));
  });
});

afterAll(async () => {
  if (server && server.exitCode === null && server.signalCode === null) {
    const stopped = new Promise<void>((resolve) => server.once('exit', () => resolve()));
    server.kill();
    await stopped;
  }
  if (fixture) rmSync(fixture, { recursive: true, force: true });
});

describe('static lab server', () => {
  it('UIC-LABS-1.1 serves the index through a plain static request', async () => {
    const response = await fetch(baseUrl);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(await response.text()).toContain('<title>Labs</title>');
  });

  it('UIC-LABS-1.1 rejects malformed paths and keeps serving subsequent requests', async () => {
    const malformed = await fetch(`${baseUrl}%E0%A4%A`);
    expect(malformed.status).toBe(400);
    expect(await malformed.text()).toBe('Bad request');
    const next = await fetch(`${baseUrl}index.html`);
    expect(next.status).toBe(200);
  });

  it('UIC-LABS-1.1 rejects paths outside the labs and reports missing files', async () => {
    const outside = await fetch(`${baseUrl}..%2fpackage.json`);
    expect(outside.status).toBe(403);
    const missing = await fetch(`${baseUrl}not-a-lab.html`);
    expect(missing.status).toBe(404);
  });

  it('UIC-LABS-1.1 rejects symlinks outside the labs and allows aliases within them', async () => {
    const outside = await fetch(`${baseUrl}outside.txt`);
    expect(outside.status).toBe(403);
    const inside = await fetch(`${baseUrl}alias.html`);
    expect(inside.status).toBe(200);
    expect(await inside.text()).toContain('<title>Labs</title>');
  });
});
