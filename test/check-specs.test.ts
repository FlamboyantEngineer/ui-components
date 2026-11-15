// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { requireDefined } from '../src/utils/require-defined.js';

const dirs: string[] = [];

function requirement(id: string) {
  return [
    `### ${id} - Sample`,
    '',
    'Statement.',
    '',
    'Implementation: `src/sample.ts`',
    'Verification: `src/sample.test.ts`',
    '',
  ];
}

/** Runs the checker on one spec, in a scratch repository whose test names every ID. */
function check(headings: string[]) {
  const dir = mkdtempSync(join(tmpdir(), 'ui-specs-'));
  dirs.push(dir);
  for (const sub of ['scripts/lib', 'specs', 'src']) mkdirSync(join(dir, sub), { recursive: true });
  for (const script of ['check-specs.mjs', 'lib/script.mjs', 'lib/markdown-links.mjs']) {
    copyFileSync(join(process.cwd(), 'scripts', script), join(dir, 'scripts', script));
  }
  const lines = ['# Sample', ''];
  for (const heading of headings) {
    lines.push(...(heading.startsWith('## ') ? [heading, ''] : requirement(heading)));
  }
  writeFileSync(join(dir, 'specs/SAMPLE.md'), lines.join('\n'));
  writeFileSync(join(dir, 'src/sample.ts'), '');
  writeFileSync(join(dir, 'src/sample.test.ts'), `// ${headings.join(' ')}\n`);
  return spawnSync('node', ['scripts/check-specs.mjs'], { cwd: dir, encoding: 'utf8' });
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('check-specs', () => {
  it('accepts requirements numbered from 1 under ascending groups', () => {
    const result = check([
      '## UIC-SAMPLE-1 - First',
      'UIC-SAMPLE-1.1',
      'UIC-SAMPLE-1.2',
      '## UIC-SAMPLE-3 - Third',
      'UIC-SAMPLE-3.1',
    ]);
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  it('rejects a requirement outside its group, a gap, a reordering and a descending group', () => {
    const result = check([
      '## UIC-SAMPLE-2 - Second',
      'UIC-SAMPLE-2.1',
      'UIC-SAMPLE-2.3',
      'UIC-SAMPLE-2.2',
      'UIC-SAMPLE-4.1',
      '## UIC-SAMPLE-1 - First',
      'UIC-SAMPLE-1.1',
    ]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('UIC-SAMPLE-2.3 follows .1');
    expect(result.stderr).toContain('UIC-SAMPLE-2.2 follows .3');
    expect(result.stderr).toContain(
      'UIC-SAMPLE-4.1 is not under its group heading ## UIC-SAMPLE-4',
    );
    expect(result.stderr).toContain('group UIC-SAMPLE-1 comes after group 2');
  });

  it('requires the reference stylesheet to read each measured property hook', () => {
    const styled = (css: string) => {
      const dir = mkdtempSync(join(tmpdir(), 'ui-specs-'));
      dirs.push(dir);
      for (const sub of ['scripts/lib', 'specs', 'src', 'labs/reference']) {
        mkdirSync(join(dir, sub), { recursive: true });
      }
      for (const script of ['check-specs.mjs', 'lib/script.mjs', 'lib/markdown-links.mjs']) {
        copyFileSync(join(process.cwd(), 'scripts', script), join(dir, 'scripts', script));
      }
      const spec = [
        '# Sample',
        '',
        '## UIC-SAMPLE-1 - First',
        '',
        ...requirement('UIC-SAMPLE-1.1'),
        '## Hooks',
        '',
        '| Hook | Kind | Values | Description |',
        '| --- | --- | --- | --- |',
        '| `ui-sample` | root | | The root. |',
        '| `--ui-sample-width` | property | | Its width. |',
        '',
      ];
      writeFileSync(join(dir, 'specs/SAMPLE.md'), spec.join('\n'));
      writeFileSync(join(dir, 'src/sample.ts'), '');
      writeFileSync(join(dir, 'src/sample.test.ts'), '// UIC-SAMPLE-1.1\n');
      writeFileSync(join(dir, 'labs/reference/sample.css'), css);
      return spawnSync('node', ['scripts/check-specs.mjs'], { cwd: dir, encoding: 'utf8' });
    };
    expect(styled('.ui-sample { width: var(--ui-sample-width); }').stderr).toBe('');
    expect(styled('.ui-sample { width: 10px; }').stderr).toContain(
      'labs/reference/ never reads --ui-sample-width (declared in specs/SAMPLE.md)',
    );
  });

  it('requires a requirement naming each util the package exports, not internal helpers', () => {
    const exported = (index: string) => {
      const result = check(['## UIC-SAMPLE-1 - First', 'UIC-SAMPLE-1.1']);
      const dir = requireDefined(dirs.at(-1));
      mkdirSync(join(dir, 'src/utils'));
      for (const name of ['shared', 'internal'])
        writeFileSync(join(dir, `src/utils/${name}.ts`), '');
      writeFileSync(join(dir, 'src/utils/index.ts'), index);
      expect(result.status).toBe(0);
      return spawnSync('node', ['scripts/check-specs.mjs'], { cwd: dir, encoding: 'utf8' });
    };
    const unnamed = exported("export { share } from './shared.js';\n");
    expect(unnamed.status).toBe(1);
    expect(unnamed.stderr).toContain(
      'src/utils/shared.ts is exported by src/utils/index.ts but is not the Implementation: of any spec requirement',
    );
    expect(unnamed.stderr).not.toContain('internal');
    expect(exported("export { sample } from '../sample.js';\n").status).toBe(0);
  });

  it('rejects links to missing specs and headings in specs and docs, and nothing in code', () => {
    const result = check(['## UIC-SAMPLE-1 - First', 'UIC-SAMPLE-1.1']);
    expect(result.status).toBe(0);
    const dir = requireDefined(dirs.at(-1));
    mkdirSync(join(dir, 'docs'));
    writeFileSync(
      join(dir, 'docs/GUIDE.md'),
      [
        '# Guide',
        '',
        'See [the sample](../specs/SAMPLE.md#uic-sample-11---sample) and [first](../specs/SAMPLE.md#uic-sample-1---first).',
        'Also [gone](../specs/GONE.md), [renamed](../specs/SAMPLE.md#uic-sample-9---gone) and [here](#guide).',
        'Code is not a link: `[x](NOPE.md)`, nor [external](https://example.com/NOPE.md).',
        '',
      ].join('\n'),
    );
    const linked = spawnSync('node', ['scripts/check-specs.mjs'], { cwd: dir, encoding: 'utf8' });
    expect(linked.status).toBe(1);
    expect(linked.stderr).toContain(
      'docs/GUIDE.md:4: links to ../specs/GONE.md, which does not exist',
    );
    expect(linked.stderr).toContain(
      'docs/GUIDE.md:4: links to #uic-sample-9---gone, which ../specs/SAMPLE.md has no heading for',
    );
    expect(linked.stderr).not.toContain('NOPE');
    expect(linked.stderr).not.toContain(':3:');
    expect(linked.stderr).not.toContain('#guide');
  });
});
