// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ESLint, type Linter } from 'eslint';
import { resolveConfig } from 'prettier';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error The tooling is plain JavaScript modules without declarations.
import { createBaseConfig } from '../tooling/eslint.mjs';

const repository = process.cwd();
const bin = join(repository, 'tooling', 'bin.mjs');
const dirs: string[] = [];

/** A scratch repository with these files and this tooling.config.mjs body. */
function scratch(config: string, files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'ui-tooling-'));
  dirs.push(dir);
  writeFileSync(join(dir, 'tooling.config.mjs'), config);
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  return dir;
}

function run(dir: string, ...args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], { cwd: dir, encoding: 'utf8' });
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('shared tooling', () => {
  it('UIC-TOOLING-1.1 ships the tooling folder and exports its configuration', () => {
    const manifest = JSON.parse(readFileSync(join(repository, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
      files: string[];
      bin: Record<string, string>;
    };
    expect(manifest.files).toContain('tooling');
    expect(manifest.exports['./tooling/eslint']).toBe('./tooling/eslint.mjs');
    expect(manifest.exports['./tooling/prettier']).toBe('./tooling/prettier.json');
    expect(manifest.bin['ui-components-tooling']).toBe('tooling/bin.mjs');
  });

  it('UIC-TOOLING-1.1 keeps library source and tooling apart', () => {
    const rules = pathToFileURL(join(repository, 'scripts', 'structure-rules.mjs')).href;
    const dir = scratch(
      [
        `import { checkComponentStructure } from '${rules}';`,
        'export default { structure: { names: [], rules: checkComponentStructure } };',
        '',
      ].join('\n'),
      {
        'src/sample.ts':
          "export { createBaseConfig } from '@flamboyantengineer/ui-components/tooling/eslint';\n",
        'tooling/probe.mjs':
          "import { useState } from 'react';\nimport '../src/sample.js';\nexport { useState };\n",
        'tooling/ok.mjs': "import { join } from 'node:path';\nexport { join };\n",
      },
    );
    const result = run(dir, 'check-structure');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'src/sample.ts: library source cannot import @flamboyantengineer/ui-components/tooling/eslint',
    );
    expect(result.stderr).toContain('tooling/probe.mjs: tooling cannot import react');
    expect(result.stderr).toContain('tooling/probe.mjs: tooling cannot import ../src/sample.js');
    expect(result.stderr).not.toContain('tooling/ok.mjs');
  });

  it('UIC-TOOLING-1.2 UIC-TOOLING-2.3 runs the repository rules from its configuration', () => {
    const dir = scratch(
      [
        'export default {',
        '  structure: { names: [], rules: ({ root }) => [`own rule at ${root.length > 0}`] },',
        '};',
        '',
      ].join('\n'),
      { 'src/sample.ts': 'export const sample = 1;\n' },
    );
    const result = run(dir, 'check-structure');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('own rule at true');
  });

  it('UIC-TOOLING-1.3 prints the usage for a missing or unknown command', () => {
    for (const args of [[], ['check-everything']]) {
      const result = spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain(
        'Usage: ui-components-tooling <check-references | check-specs | check-structure>',
      );
    }
  });

  it('UIC-TOOLING-1.3 declares the tools it loads as optional peers', () => {
    const manifest = JSON.parse(readFileSync(join(repository, 'package.json'), 'utf8')) as {
      peerDependencies: Record<string, string>;
      peerDependenciesMeta: Record<string, { optional?: boolean }>;
    };
    const tools = ['@eslint/js', 'eslint', 'eslint-plugin-simple-import-sort', 'globals'];
    for (const name of [...tools, 'prettier', 'typescript', 'typescript-eslint']) {
      expect(manifest.peerDependencies[name], name).toBeDefined();
      expect(manifest.peerDependenciesMeta[name]?.optional, name).toBe(true);
    }
  });

  it('UIC-TOOLING-2.3 enforces names, re-exports, layers and cycles', () => {
    const config = [
      'export default {',
      '  structure: {',
      "    names: ['src'],",
      '    layers: {',
      '      protocol: { imports: [], browser: true },',
      "      client: { imports: ['protocol'], browser: true },",
      "      server: { imports: ['protocol'] },",
      '    },',
      '  },',
      '};',
      '',
    ].join('\n');
    const dir = scratch(config, {
      'src/BadName.ts': 'export const bad = 1;\n',
      'src/index.ts': "export { bad } from './BadName.js';\nexport const extra = 1;\n",
      'src/protocol/codec.ts':
        "import { readFileSync } from 'node:fs';\nexport { readFileSync };\n",
      'src/client/provider.ts': "import { start } from '../server/room.js';\nexport { start };\n",
      'src/server/room.ts': "import { cwd } from 'node:process';\nexport const start = cwd;\n",
      'src/server/outside.ts': "export { x } from '../../test/fixture.js';\n",
      'src/a.ts': "import { b } from './b.js';\nexport const a = b;\n",
      'src/b.ts': "import { a } from './a.js';\nexport const b = () => a;\n",
      'src/types-a.ts': "import type { B } from './types-b.js';\nexport type A = B;\n",
      'src/types-b.ts': "import type { A } from './types-a.js';\nexport type B = A | 1;\n",
    });
    const result = run(dir, 'check-structure');
    expect(result.status).toBe(1);
    const problems = result.stderr;
    expect(problems).toContain('src/BadName.ts: file and directory names are kebab-case');
    expect(problems).toContain('src/index.ts: an index.ts only re-exports with export … from');
    expect(problems).toContain(
      'src/protocol/codec.ts: protocol/ runs in a browser and cannot import node:fs',
    );
    expect(problems).toContain('src/client/provider.ts: client/ cannot import server/');
    expect(problems).not.toContain('src/server/room.ts');
    expect(problems).toContain(
      'src/server/outside.ts: library source cannot import ../../test/fixture.js',
    );
    expect(problems).toContain('import cycle: src/a.ts, src/b.ts');
    expect(problems).not.toContain('types-a');

    const withTypes = config.replace("names: ['src'],", "names: ['src'], typeImportCycles: true,");
    writeFileSync(join(dir, 'tooling.config.mjs'), withTypes);
    expect(run(dir, 'check-structure').stderr).toContain(
      'import cycle: src/types-a.ts, src/types-b.ts',
    );
  });

  it('UIC-TOOLING-2.3 reports only cycles across the configured directories', () => {
    const dir = scratch(
      "export default { structure: { names: [], cyclesAcross: 'src/components' } };\n",
      {
        'src/components/one/one.ts': "import { two } from './two.js';\nexport const one = two;\n",
        'src/components/one/two.ts':
          "import { one } from './one.js';\nexport const two = () => one;\n",
        'src/components/avatar/avatar.ts':
          "import { card } from '../card/card.js';\nexport const avatar = card;\n",
        'src/components/card/card.ts':
          "import { avatar } from '../avatar/avatar.js';\nexport const card = () => avatar;\n",
      },
    );
    const result = run(dir, 'check-structure');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'import cycle across src/components: src/components/avatar/avatar.ts, src/components/card/card.ts',
    );
    expect(result.stderr).not.toContain('one/one.ts');
  });

  it('UIC-TOOLING-3.1 gives every repository the shared rules and lets it allow components', async () => {
    const eslint = new ESLint({ cwd: repository });
    const source = (await eslint.calculateConfigForFile('src/core/props.ts')) as Linter.Config;
    expect(source.rules?.['max-lines-per-function']).toEqual([
      2,
      { max: 80, skipBlankLines: true, skipComments: true },
    ]);
    expect(source.rules?.['simple-import-sort/imports']).toEqual([
      2,
      { groups: [['^\\u0000', '^node:', '^@?\\w', '^']] },
    ]);
    const script = (await eslint.calculateConfigForFile('tooling/bin.mjs')) as Linter.Config;
    expect(script.languageOptions?.globals).toHaveProperty('process');

    const naming = (components: boolean) => {
      const configs = createBaseConfig({
        name: 'sample',
        tsconfigRootDir: repository,
        typedFiles: ['src/**/*.ts'],
        sourceFiles: ['src/**/*.ts'],
        nodeFiles: ['scripts/**/*.mjs'],
        components,
      }) as Linter.Config[];
      const rule = configs.find((config) => config.name === 'sample/source')?.rules?.[
        '@typescript-eslint/naming-convention'
      ] as unknown[];
      return rule.find((option) => (option as { selector?: string }).selector === 'function') as {
        format: string[];
      };
    };
    expect(naming(false).format).toEqual(['camelCase']);
    expect(naming(true).format).toEqual(['camelCase', 'PascalCase']);
  });

  it('UIC-TOOLING-3.2 resolves the shared Prettier options through the repository file', async () => {
    expect(JSON.parse(readFileSync(join(repository, '.prettierrc.json'), 'utf8'))).toBe(
      './tooling/prettier.json',
    );
    const options = await resolveConfig(join(repository, 'src', 'index.ts'));
    expect(options).toEqual(
      JSON.parse(readFileSync(join(repository, 'tooling', 'prettier.json'), 'utf8')),
    );
  });
});
