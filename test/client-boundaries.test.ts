// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const isMarked = (path: string) => read(path).startsWith("'use client';\n");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe('client boundaries', () => {
  it('UIC-SERVER-COMPONENTS-1.1 UIC-SERVER-COMPONENTS-1.2 marks exactly the modules that need the client', () => {
    const output = execFileSync('node', ['scripts/check-client-boundaries.mjs'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(output).toContain('Client boundaries match.');
    expect(isMarked('src/components/button/button.tsx')).toBe(true);
    expect(isMarked('src/core/provider.tsx')).toBe(true);
    expect(isMarked('src/primitives/core.ts')).toBe(true);
    expect(isMarked('src/components/html-markup/sanitize-html.ts')).toBe(false);
    expect(isMarked('src/components/meta-line/meta-line.tsx')).toBe(false);
  });

  it('UIC-SERVER-COMPONENTS-1.2 leaves every entry point on the server', () => {
    const entries = walk(join(root, 'src')).filter((path) => path.endsWith('/index.ts'));
    expect(entries.length).toBeGreaterThan(100);
    expect(entries.filter((path) => readFileSync(path, 'utf8').includes('use client'))).toEqual([]);
  });

  it('UIC-SERVER-COMPONENTS-1.3 keeps the directive first in the built module', () => {
    const config = ts.getParsedCommandLineOfConfigFile(
      join(root, 'tsconfig.build.json'),
      {},
      { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined },
    );
    const { outputText } = ts.transpileModule(read('src/components/button/button.tsx'), {
      compilerOptions: config?.options ?? {},
      fileName: 'button.tsx',
    });
    expect(outputText.startsWith("'use client';\n")).toBe(true);
  });

  it('UIC-SERVER-COMPONENTS-2.1 checks an installed Next.js consumer in CI', () => {
    const manifest = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    expect(manifest.scripts['check:server-components']).toBe(
      'node scripts/check-server-components.mjs',
    );
    expect(read('.github/workflows/ci.yml')).toContain('run: npm run check:server-components');
    expect(read('scripts/check-server-components.mjs')).toMatch(
      /from '\$\{manifest\.name\}\/button'/,
    );
  });
});
