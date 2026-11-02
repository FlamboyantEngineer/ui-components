import type { CodeToken, CodeTokenizer } from './code-layers.js';
import { tokenizeJson } from './json-text.js';

export type CodeLanguage =
  'text' | 'json' | 'javascript' | 'typescript' | 'html' | 'css' | 'sql' | 'python' | 'markdown';
export interface CodeSyntaxRule {
  /** Styling token kind, such as keyword, string, number or comment. */
  type: string;
  /** Matched at the current offset; flags are preserved except g and y. Empty matches are ignored. */
  pattern: RegExp;
}
export type CodeSyntax = readonly CodeSyntaxRule[];

const quoted: CodeSyntaxRule = {
  type: 'string',
  pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/,
};
const numeric: CodeSyntaxRule = {
  type: 'number',
  pattern: /\b(?:0[xob][\da-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/i,
};
const comment: CodeSyntaxRule = { type: 'comment', pattern: /\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*/ };
const js: CodeSyntax = [
  comment,
  quoted,
  numeric,
  {
    type: 'keyword',
    pattern:
      /\b(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|false|finally|for|from|function|if|import|in|instanceof|let|new|null|of|return|static|super|switch|this|throw|true|try|typeof|undefined|var|void|while|yield)\b/,
  },
];
const presets: Record<Exclude<CodeLanguage, 'text' | 'json'>, CodeSyntax> = {
  javascript: js,
  typescript: [
    {
      type: 'keyword',
      pattern:
        /\b(?:abstract|any|as|boolean|declare|enum|implements|interface|keyof|never|number|private|protected|public|readonly|satisfies|string|type|unknown)\b/,
    },
    ...js,
  ],
  html: [
    { type: 'comment', pattern: /<!--[\s\S]*?(?:-->|$)/ },
    { type: 'keyword', pattern: /<\/?[\w:-]+(?:\s+[^<>]*?)?\s*\/?>|<!DOCTYPE[^>]*>/i },
    quoted,
  ],
  css: [
    { type: 'comment', pattern: /\/\*[\s\S]*?(?:\*\/|$)/ },
    quoted,
    { type: 'number', pattern: /#[\da-f]{3,8}\b|\b\d+(?:\.\d+)?(?:px|em|rem|vh|vw|s|ms|%)?/i },
    { type: 'keyword', pattern: /--?[\w-]+|[\w-]+(?=\s*:)/ },
  ],
  sql: [
    { type: 'comment', pattern: /--[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/ },
    quoted,
    numeric,
    {
      type: 'keyword',
      pattern:
        /\b(?:select|from|where|join|left|right|inner|outer|on|as|and|or|not|null|is|in|order|by|group|having|limit|offset|insert|into|values|update|set|delete|create|table|drop|alter|distinct|asc|desc|true|false|count|sum|avg)\b/i,
    },
  ],
  python: [
    { type: 'comment', pattern: /#[^\n]*/ },
    { type: 'string', pattern: /"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)/ },
    quoted,
    numeric,
    {
      type: 'keyword',
      pattern:
        /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/,
    },
  ],
  markdown: [
    { type: 'string', pattern: /```[\s\S]*?(?:```|$)|`[^`\n]*`/ },
    { type: 'keyword', pattern: /^#{1,6}\s[^\n]*|\*\*[^*\n]+\*\*|__[^_\n]+__/m },
    { type: 'link', pattern: /\[[^\]\n]+\]\([^)\n]+\)/ },
  ],
};

/** Ordered syntax rules preserve every source character, including unmatched text. */
export function createCodeTokenizer(syntax: CodeSyntax): CodeTokenizer {
  const rules = syntax.map((rule) => ({
    ...rule,
    pattern: new RegExp(rule.pattern.source, rule.pattern.flags.replace(/[gy]/g, '') + 'y'),
  }));
  return (source) => {
    const tokens: CodeToken[] = [];
    let plain = '';
    for (let offset = 0; offset < source.length;) {
      const match = rules
        .map((rule) => {
          rule.pattern.lastIndex = offset;
          return { type: rule.type, text: rule.pattern.exec(source)?.[0] };
        })
        .find((token) => token.text);
      if (!match?.text) {
        plain += source[offset];
        offset += 1;
        continue;
      }
      if (plain) {
        tokens.push({ text: plain });
        plain = '';
      }
      tokens.push({ text: match.text, type: match.type });
      offset += match.text.length;
    }
    if (plain) tokens.push({ text: plain });
    return tokens;
  };
}
const tokenizers = Object.fromEntries(
  Object.entries(presets).map(([language, syntax]) => [language, createCodeTokenizer(syntax)]),
) as Record<keyof typeof presets, CodeTokenizer>;

/**
 * The tokenizer for custom `syntax`, or else for a `language` preset; none for plain text. A
 * `CodeBlock` can take it as `tokenize` to highlight as the editor does.
 */
export function resolveCodeTokenizer({
  language = 'text',
  syntax,
}: {
  language?: CodeLanguage | undefined;
  syntax?: CodeSyntax | undefined;
}): CodeTokenizer | undefined {
  if (syntax) return createCodeTokenizer(syntax);
  if (language === 'json') return tokenizeJson;
  return language === 'text' ? undefined : tokenizers[language];
}
