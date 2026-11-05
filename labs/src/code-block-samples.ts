// Sample code for the Code Block lab: highlighted examples in several languages, and a large file.

import {
  type CodeTokenizer,
  resolveCodeTokenizer,
} from '../../src/components/code-editor/index.js';

/** A lab-only shell syntax, through the same ordered rules as the editor's language presets. */
const tokenizeShell = resolveCodeTokenizer({
  syntax: [
    { type: 'comment', pattern: /#[^\n]*/ },
    { type: 'string', pattern: /"(?:\\.|[^"\\])*"|'[^']*'/ },
    { type: 'literal', pattern: /\$\{?\w+\}?/ },
    { type: 'keyword', pattern: /\b(?:if|then|else|fi|for|in|do|done|export|echo|cd|set)\b/ },
    { type: 'number', pattern: /\b\d+\b/ },
  ],
});

interface LanguageSample {
  title: string;
  language: string;
  code: string;
  tokenize: CodeTokenizer | undefined;
}

export const languageSamples: readonly LanguageSample[] = [
  {
    title: 'shelves.ts',
    language: 'typescript',
    tokenize: resolveCodeTokenizer({ language: 'typescript' }),
    code: [
      'interface Shelf {',
      '  label: string;',
      '  items: readonly string[];',
      '}',
      '',
      '/* Shelves with nothing left on them. */',
      'export function emptyShelves(shelves: Shelf[]): string[] {',
      '  return shelves.filter((shelf) => shelf.items.length === 0).map((shelf) => shelf.label);',
      '}',
    ].join('\n'),
  },
  {
    title: 'basket.json',
    language: 'json',
    tokenize: resolveCodeTokenizer({ language: 'json' }),
    code: [
      '{',
      '  "fruit": "Pear",',
      '  "count": 12,',
      '  "ripe": true,',
      '  "notes": null',
      '}',
    ].join('\n'),
  },
  {
    title: 'card.css',
    language: 'css',
    tokenize: resolveCodeTokenizer({ language: 'css' }),
    code: [
      '/* A fruit card */',
      '.card {',
      '  --card-accent: #228844;',
      '  padding: 12px 16px;',
      '  border-radius: 6px;',
      '}',
    ].join('\n'),
  },
  {
    title: 'labels.py',
    language: 'python',
    tokenize: resolveCodeTokenizer({ language: 'python' }),
    code: [
      '# Labels for a crate of fruit',
      'def label(fruit, count=12):',
      '    """Returns the crate label."""',
      '    if count > 0:',
      "        return f'{count} x {fruit}'",
      '    return None',
    ].join('\n'),
  },
  {
    title: 'restock.sh',
    language: 'shell',
    tokenize: tokenizeShell,
    code: [
      '#!/bin/sh',
      'set -e',
      'export SHELF="${1:-A}"',
      'for crate in 1 2 3; do',
      '  echo "Restocking crate $crate on shelf $SHELF"',
      'done',
    ].join('\n'),
  },
];

export const tokenizeTypeScript = resolveCodeTokenizer({ language: 'typescript' });

/** How many generated functions the large file holds: six lines each, past a thousand lines. */
const largeFunctionCount = 170;

/** A generated TypeScript file of over a thousand lines, some of them long. */
export const largeFile = [
  '// Generated restocking helpers: one function per item.',
  'export interface Item { name: string; count: number; shelf: string }',
  '',
  ...Array.from({ length: largeFunctionCount }, (_, index) => {
    const n = index + 1;
    return [
      `/** Restocks item ${n} when it runs low. */`,
      `export function restockItem${n}(item: Item, threshold = ${(n % 9) + 3}): Item {`,
      `  if (item.count >= threshold) return item; // Enough on shelf ${String.fromCharCode(65 + (n % 26))}${n}: the record comes back unchanged, so callers can compare it by identity.`,
      '  return { ...item, count: threshold * 2 };',
      '}',
      '',
    ];
  }).flat(),
].join('\n');
