// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The scripts are plain JavaScript modules without declarations.
import { walk as walkFiles } from '../scripts/lib/script.mjs';

const walk = walkFiles as (dir: string) => string[];
const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const isMarked = (path: string) => read(path).startsWith("'use client';\n");

// Three tests run the checker over the whole source tree, which takes seconds on its own and longer
// on a loaded runner, past Vitest's five-second default.
describe('client boundaries', { timeout: 60_000 }, () => {
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
    expect(isMarked('src/core/glyphs.tsx')).toBe(true);
    for (const path of [
      'src/primitives/date-values.ts',
      'src/primitives/color-values.ts',
      'src/utils/value-store.ts',
      'src/components/pdf-viewer/page-bitmap.ts',
      'src/components/pdf-viewer/page-geometry.ts',
      'src/components/table/table-columns.ts',
    ]) {
      expect(isMarked(path), path).toBe(false);
    }
    // The check parses every library module, about four seconds on an idle machine and more on a
    // runner busy with the other test workers.
  }, 30_000);

  it('UIC-SERVER-COMPONENTS-1.1 reports a server module that calls or reads a client export', () => {
    // A scratch library beside the checker; inside node_modules so it resolves TypeScript.
    const dir = mkdtempSync(join(root, 'node_modules', '.client-boundaries-'));
    try {
      mkdirSync(join(dir, 'scripts/lib'), { recursive: true });
      mkdirSync(join(dir, 'src'));
      for (const script of ['check-client-boundaries.mjs', 'lib/script.mjs']) {
        copyFileSync(join(root, 'scripts', script), join(dir, 'scripts', script));
      }
      const files = {
        'client.ts': [
          "'use client';",
          "import { useState } from 'react';",
          'export const useCount = () => useState(0);',
          'export const makeLabel = (text: string) => text;',
          'export const Badge = () => null;',
        ],
        'server.ts': [
          "import { Badge, makeLabel } from './client.js';",
          "export const label = makeLabel('Draft');",
          'export const icons = { badge: Badge };',
        ],
        'index.ts': ["export * from './client.js';"],
      };
      for (const [name, lines] of Object.entries(files)) {
        writeFileSync(join(dir, 'src', name), `${lines.join('\n')}\n`);
      }
      const result = spawnSync('node', ['scripts/check-client-boundaries.mjs'], {
        cwd: dir,
        encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "src/server.ts: uses makeLabel from client src/client.ts as a value, so it starts with 'use client';",
      );
      expect(result.stderr).toContain(
        'src/index.ts: re-exports client src/client.ts with `export *`',
      );
      expect(result.stderr).not.toContain('Badge');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('UIC-SERVER-COMPONENTS-1.1 reports a server module that calls a pure helper through a client re-export', () => {
    const dir = mkdtempSync(join(root, 'node_modules', '.client-boundaries-'));
    try {
      mkdirSync(join(dir, 'scripts/lib'), { recursive: true });
      mkdirSync(join(dir, 'src'));
      for (const script of ['check-client-boundaries.mjs', 'lib/script.mjs']) {
        copyFileSync(join(root, 'scripts', script), join(dir, 'scripts', script));
      }
      const files = {
        'pure.ts': ['export const isReady = (text: string) => text !== "";'],
        'widget.tsx': [
          "'use client';",
          "import { useState } from 'react';",
          'export const useReady = () => useState(false);',
          "export { isReady } from './pure.js';",
        ],
        'server.ts': [
          "import { isReady } from './widget.js';",
          "export const ready = isReady('yes');",
        ],
      };
      for (const [name, lines] of Object.entries(files)) {
        writeFileSync(join(dir, 'src', name), `${lines.join('\n')}\n`);
      }
      const result = spawnSync('node', ['scripts/check-client-boundaries.mjs'], {
        cwd: dir,
        encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        'src/server.ts: uses isReady through client src/widget.tsx; import it from src/pure.ts',
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('UIC-SERVER-COMPONENTS-1.4 exports server-safe helpers from server modules', () => {
    const helpers = {
      'rich-text-editor': [
        'createRichTextSchema',
        'serializeRichTextHtml',
        'serializeRichTextText',
      ],
      'chat-controller': ['isAwaitingReader', 'reduceChatStream'],
      'condition-builder': ['createConditionMatcher', 'matchesConditionGroup'],
      'filter-bar': ['createFilterMatcher', 'matchesFilterCondition'],
      'pdf-viewer': ['findBoxAtPoint'],
      avatar: ['resolveAvatarColor'],
      checkbox: ['cycleCheckState'],
      'zoom-control': ['findNextZoomLevel'],
    };
    for (const [component, names] of Object.entries(helpers)) {
      const entry = `src/components/${component}/index.ts`;
      const source = ts.createSourceFile(entry, read(entry), ts.ScriptTarget.Latest, true);
      for (const name of names) {
        const statement = source.statements.find(
          (item): item is ts.ExportDeclaration =>
            ts.isExportDeclaration(item) &&
            item.exportClause !== undefined &&
            ts.isNamedExports(item.exportClause) &&
            item.exportClause.elements.some((element) => element.name.text === name),
        );
        const specifier = statement?.moduleSpecifier;
        if (!specifier || !ts.isStringLiteral(specifier)) throw new Error(`${entry} lacks ${name}`);
        const module = `src/components/${component}/${specifier.text.replace(/^\.\/|\.js$/g, '')}.ts`;
        expect(isMarked(module), `${name} from ${module}`).toBe(false);
      }
    }
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
    // A server page hands a glyph from /core to a client component.
    expect(read('scripts/check-server-components.mjs')).toMatch(
      /import \{ PlusGlyph, UiProvider \} from '\$\{manifest\.name\}\/core'/,
    );
  });
});
