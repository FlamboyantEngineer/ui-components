import type { CodeToken, CodeTokenizer } from './code-layers.js';
import { tokenizeJson } from './json-text.js';

export type CodeLanguage =
  | 'text'
  | 'json'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'sql'
  | 'python'
  | 'markdown'
  | 'c'
  | 'cpp'
  | 'yaml'
  | 'xml'
  | 'shell';
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
const cKeywords =
  'auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|restrict|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|NULL|true|false|bool';
const cppKeywords =
  'alignas|alignof|catch|class|constexpr|consteval|decltype|delete|explicit|friend|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|template|this|throw|try|typename|using|virtual';
const c: CodeSyntax = [
  comment,
  { type: 'keyword', pattern: /^[ \t]*#[ \t]*\w+/m },
  quoted,
  numeric,
  { type: 'keyword', pattern: new RegExp(`\\b(?:${cKeywords})\\b`) },
];
const xml: CodeSyntax = [
  { type: 'comment', pattern: /<!--[\s\S]*?(?:-->|$)/ },
  { type: 'string', pattern: /<!\[CDATA\[[\s\S]*?(?:\]\]>|$)/ },
  { type: 'keyword', pattern: /<[?!/]?[\w:.-]*|\??\/?>/ },
  { type: 'string', pattern: /"[^"]*"|'[^']*'/ },
  { type: 'key', pattern: /(?=([\w:.-]+))\1(?=\s*=)/ },
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
    { type: 'keyword', pattern: /<\/?[\w:-]+(?:\s[^<>]*)?\/?>|<!DOCTYPE[^>]*>/i },
    quoted,
  ],
  css: [
    { type: 'comment', pattern: /\/\*[\s\S]*?(?:\*\/|$)/ },
    quoted,
    { type: 'number', pattern: /#[\da-f]{3,8}\b|\b\d+(?:\.\d+)?(?:px|em|rem|vh|vw|s|ms|%)?/i },
    { type: 'keyword', pattern: /--?[\w-]+|(?=([\w-]+))\1(?=\s*:)/ },
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
  c,
  cpp: [{ type: 'keyword', pattern: new RegExp(`\\b(?:${cppKeywords})\\b`) }, ...c],
  yaml: [
    { type: 'comment', pattern: /(?:^|(?<=\s))#[^\n]*/ },
    { type: 'keyword', pattern: /^(?:---|\.\.\.)$/m },
    { type: 'key', pattern: /[^\s#:'"[\]{},-][^\n#:]*(?=:(?:\s|$))/ },
    quoted,
    numeric,
    { type: 'keyword', pattern: /\b(?:true|false|null|yes|no|on|off)\b|~/i },
  ],
  xml,
  shell: [
    { type: 'comment', pattern: /(?:^|(?<=\s))#[^\n]*/ },
    { type: 'string', pattern: /"(?:\\.|[^"\\])*"|'[^']*'/ },
    { type: 'literal', pattern: /\$(?:\{[^}\n]*\}|\w+|[?#$!@*-])/ },
    numeric,
    {
      type: 'keyword',
      pattern:
        /\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|in|function|return|exit|export|local|readonly|set|unset|echo|cd|source)\b/,
    },
    { type: 'punctuation', pattern: /&&|\|\||[|&;<>]/ },
  ],
  markdown: [
    { type: 'string', pattern: /```[\s\S]*?(?:```|$)|`[^`\n]*`/ },
    { type: 'keyword', pattern: /^#{1,6}\s[^\n]*|\*\*[^*\n]+\*\*|__[^_\n]+__/m },
    { type: 'link', pattern: /\[[^[\]\n]+\]\([^)\n]+\)/ },
  ],
};

/** Options of `createCodeTokenizer` for the presets. */
interface TokenizerOptions {
  /**
   * Whether rules are tried at the start of each word only: after no rule matches at a word
   * character, the rest of that word stays plain. True for presets, whose rules start at a word
   * boundary or match to the same word end from any start inside it.
   */
  wordStarts: boolean;
}

/** Lines longer than this stay plain, so a pasted minified file cannot stall highlighting. */
const maxHighlightedLine = 5000;

const wordCharacter = /\w/;
const wordRun = /\w+/y;

/** The end of the run of `pattern` at `offset` in `source`. */
function runEndOf(pattern: RegExp, source: string, offset: number): number {
  pattern.lastIndex = offset;
  return pattern.test(source) ? pattern.lastIndex : offset + 1;
}

/** The end of the line at `offset` when it is too long to highlight, or null. */
function longLineEnd(source: string, offset: number): number | null {
  if (offset > 0 && source[offset - 1] !== '\n') return null;
  const newline = source.indexOf('\n', offset);
  const end = newline === -1 ? source.length : newline;
  return end - offset > maxHighlightedLine ? end : null;
}

/** Ordered syntax rules preserve every source character, including unmatched text. */
export function createCodeTokenizer(
  syntax: CodeSyntax,
  { wordStarts }: TokenizerOptions = { wordStarts: false },
): CodeTokenizer {
  const rules = syntax.map((rule) => ({
    ...rule,
    pattern: new RegExp(rule.pattern.source, rule.pattern.flags.replace(/[gy]/g, '') + 'y'),
  }));
  const matchAt = (source: string, offset: number) => {
    for (const rule of rules) {
      rule.pattern.lastIndex = offset;
      const text = rule.pattern.exec(source)?.[0];
      if (text) return { text, type: rule.type };
    }
    return null;
  };
  return (source) => {
    const tokens: CodeToken[] = [];
    let plain = '';
    for (let offset = 0; offset < source.length;) {
      const skipTo = longLineEnd(source, offset);
      const match = skipTo === null ? matchAt(source, offset) : null;
      if (!match) {
        const isWord = wordStarts && wordCharacter.test(source[offset] ?? '');
        const end = skipTo ?? (isWord ? runEndOf(wordRun, source, offset) : offset + 1);
        plain += source.slice(offset, end);
        offset = end;
        continue;
      }
      if (plain) {
        tokens.push({ text: plain });
        plain = '';
      }
      tokens.push(match);
      offset += match.text.length;
    }
    if (plain) tokens.push({ text: plain });
    return tokens;
  };
}
const tokenizers = Object.fromEntries(
  Object.entries(presets).map(([language, syntax]) => [
    language,
    createCodeTokenizer(syntax, { wordStarts: true }),
  ]),
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
