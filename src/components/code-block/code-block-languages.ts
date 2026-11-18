// The built-in highlighting a code block takes from its language name (UIC-CODE-BLOCK-1.4).

import type { CodeTokenizer } from '../code-editor/code-editor.js';
import { type CodeLanguage, resolveCodeTokenizer } from '../code-editor/code-languages.js';

/** Language names, as fences and hosts write them, for each of the Code Editor's presets. */
const namesByLanguage: Readonly<Record<Exclude<CodeLanguage, 'text'>, readonly string[]>> = {
  json: ['json', 'jsonc', 'json5'],
  javascript: ['javascript', 'js', 'jsx', 'mjs', 'cjs'],
  typescript: ['typescript', 'ts', 'tsx', 'mts', 'cts'],
  html: ['html', 'htm', 'xhtml'],
  css: ['css'],
  sql: ['sql'],
  python: ['python', 'py'],
  java: ['java'],
  markdown: ['markdown', 'md'],
  c: ['c', 'h'],
  cpp: ['cpp', 'c++', 'cc', 'cxx', 'hpp', 'hh'],
  yaml: ['yaml', 'yml'],
  xml: ['xml', 'svg', 'xsl', 'plist'],
  shell: ['shell', 'sh', 'bash', 'zsh', 'ksh'],
};

const languagesByName: ReadonlyMap<string, CodeLanguage> = new Map(
  Object.entries(namesByLanguage).flatMap(([language, names]) =>
    names.map((name) => [name, language as CodeLanguage] as const),
  ),
);

/** Language names whose blocks hold prose or plain text rather than code. */
const plainTextNames: ReadonlySet<string> = new Set(['text', 'txt', 'plain', 'plaintext']);

/** The built-in tokenizer for a language name, ignoring case; none for plain text or an unknown name. */
export function findLanguageTokenizer(name: string | null | undefined): CodeTokenizer | undefined {
  const language = name ? languagesByName.get(name.toLowerCase()) : undefined;
  return language ? resolveCodeTokenizer({ language }) : undefined;
}

/** Whether a language name, ignoring case, names plain text such as `text` or `txt`. */
export function isPlainTextLanguage(name: string | null | undefined): boolean {
  return name ? plainTextNames.has(name.toLowerCase()) : false;
}
