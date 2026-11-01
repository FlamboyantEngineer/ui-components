import { useMemo, useState } from 'react';
import {
  CodeBlock,
  createCodeBlockOverride,
  type CodeBlockVariant,
} from '../../src/components/code-block/index.js';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import type { CodeEditorWrap, CodeToken } from '../../src/components/code-editor/code-editor.js';
import { Markdown } from '../../src/components/markdown/markdown.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { TextMatchProvider } from '../../src/components/text-match/text-match.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { languageSamples, largeFile, tokenizeTypeScript } from './code-block-samples.js';

const keywords = new Set(['const', 'let', 'function', 'return', 'if', 'else', 'export', 'await']);
const parts =
  /(\/\/[^\n]*|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|\d+(?:\.\d+)?|[A-Za-z_$][\w$]*|\s+|.)/g;

/** A small script tokenizer: comments, strings, numbers, keywords and punctuation. */
function tokenizeScript(source: string): CodeToken[] {
  return (source.match(parts) ?? []).map((text) => {
    if (text.startsWith('//')) return { text, type: 'comment' };
    if (/^["']/.test(text)) return { text, type: 'string' };
    if (/^\d/.test(text)) return { text, type: 'number' };
    if (keywords.has(text)) return { text, type: 'keyword' };
    return { text, type: /^[(){}[\];,.]$/.test(text) ? 'punctuation' : null };
  });
}

const script = [
  '// Nights of a trip',
  'function countNights(stops) {',
  '  return stops.reduce(',
  '    (sum, stop) => sum + stop.nights,',
  '    0,',
  '  );',
  '}',
].join('\n');

const longScript = [
  'const route = await planRoute({ from: "Lisbon", to: "Porto", stops: ["Coimbra", "Aveiro"], avoidTolls: true, departAt: "2026-05-02T08:30" });',
  'console.log(route.summary);',
].join('\n');

const session = [
  '$ npm install trip-kit',
  'added 1 package in 2s',
  '$ npx trip-kit plan --to Porto',
  'Route ready: 3 h 10 min',
].join('\n');

const longSession = [
  '$ npx trip-kit plan --from Lisbon --to Porto --stops Coimbra,Aveiro --avoid-tolls --depart 2026-05-02T08:30',
  'Route ready: 3 h 10 min, 2 stops, no tolls, departs Saturday 2 May at 08:30 from Lisbon Oriente',
].join('\n');

const samples: Record<CodeBlockVariant, Record<'short' | 'long', string>> = {
  code: { short: script, long: longScript },
  terminal: { short: session, long: longSession },
};

const answer = [
  'Add the helper, then run the planner:',
  '',
  '```ts',
  'const days = countDays(plan.stops);',
  '```',
  '',
  '```console',
  '$ npx trip-kit plan --days 5',
  'Plan saved to plan.json',
  '```',
  '',
  'A language without a tokenizer, even an object property name, draws plain code:',
  '',
  '```constructor',
  'new Plan()',
  '```',
  '',
  'An indented block has no language:',
  '',
  '    plan.json',
].join('\n');

function ApplyDemo() {
  const [applied, setApplied] = useState('Nothing applied yet.');
  return (
    <div data-lab-demo="apply" style={{ maxWidth: 520 }}>
      <CodeBlock
        code={script}
        language="ts"
        title="count-nights.ts"
        tokenize={tokenizeScript}
        onApply={(code) => setApplied(`Applied ${code.split('\n').length} lines.`)}
      />
      <CodeBlock
        code={'$ npm test'}
        variant="terminal"
        applyLabel="Run"
        onApply={(code) => setApplied(`Ran: ${code}`)}
      />
      <p data-lab-output="applied" role="status">
        {applied}
      </p>
    </div>
  );
}

function FindDemo() {
  const [query, setQuery] = useState('stop');
  return (
    <div data-lab-demo="find" style={{ maxWidth: 520 }}>
      <SearchField label="Find in code" value={query} onChange={setQuery} />
      <TextMatchProvider query={query}>
        <CodeBlock code={script} language="ts" tokenize={tokenizeScript} />
      </TextMatchProvider>
    </div>
  );
}

function MarkdownDemo() {
  const [applied, setApplied] = useState('');
  const renderNode = useMemo(
    () =>
      createCodeBlockOverride({
        tokenizers: { ts: tokenizeScript },
        applyLabel: 'Insert',
        onApply: (code, language) => setApplied(`Inserted ${language ?? 'plain'}: ${code}`),
      }),
    [],
  );
  return (
    <div data-lab-demo="markdown" style={{ maxWidth: 520 }}>
      <Markdown source={answer} renderNode={renderNode} />
      <p data-lab-output="inserted">{applied}</p>
    </div>
  );
}

/** Lab-only metrics: a fixed monospace line, and wide letters for the highlighted token. */
const lateHighlightStyle = `
[data-lab-demo="late-highlight"] .ui-code-block__code { font: 10px/24px monospace; }
[data-lab-demo="late-highlight"] .ui-code-block__token[data-token="wide"] { letter-spacing: 10px; }
`;

const wideTokens = (source: string): CodeToken[] => [{ text: source, type: 'wide' }];

/** The same code, highlighted later with a token whose letters the host spaces wider. */
function LateHighlight() {
  const [isHighlighted, setHighlighted] = useState(false);
  return (
    <div data-lab-demo="late-highlight">
      <style>{lateHighlightStyle}</style>
      <div style={{ width: 220 }}>
        <CodeBlock code={'x'.repeat(20)} tokenize={isHighlighted ? wideTokens : undefined} />
      </div>
      <p>
        <button type="button" onClick={() => setHighlighted(!isHighlighted)}>
          {isHighlighted ? 'Remove highlighting' : 'Highlight'}
        </button>
      </p>
    </div>
  );
}

const numberedScript = [
  '/* Nights of a trip,',
  '   counted per stop. */',
  'function countNights(stops) {',
  '',
  '  return stops.reduce((sum, stop) => sum + stop.nights, 0);',
  '}',
  '',
].join('\n');

const wrappedScript = [
  'const route = await planRoute({ from: "Lisbon", to: "Porto", stops: ["Coimbra", "Aveiro"], avoidTolls: true });',
  'console.log(route.summary);',
].join('\n');

function LineNumbersDemo() {
  return (
    <div data-lab-demo="line-numbers" style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      <CodeBlock
        code={numberedScript}
        language="js"
        title="count-nights.js"
        tokenize={tokenizeScript}
        lineNumbers
      />
      <CodeBlock code={session} variant="terminal" lineNumbers />
      <div style={{ width: 320 }}>
        <CodeBlock
          code={wrappedScript}
          language="ts"
          title="Wrapped"
          tokenize={tokenizeScript}
          lineNumbers
          wrap="soft"
        />
      </div>
    </div>
  );
}

/** Lab-only: the host bounds the code's height, so the large file scrolls down as well. */
const boundedStyle = `
[data-lab-demo="large"] .ui-code-block__code { max-height: 360px; box-sizing: border-box; }
`;

function LargeFileDemo() {
  const [hasNumbers, setNumbers] = useState(true);
  const [wrap, setWrap] = useState<CodeEditorWrap>('off');
  return (
    <div data-lab-demo="large" style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
      <style>{boundedStyle}</style>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <Checkbox isSelected={hasNumbers} onChange={setNumbers}>
          Line numbers
        </Checkbox>
        <SegmentedChoice
          aria-label="Long lines"
          sizing="content"
          options={[
            { value: 'off', label: 'Scroll sideways' },
            { value: 'soft', label: 'Wrap' },
          ]}
          value={wrap}
          onChange={(value) => setWrap(value === 'soft' ? 'soft' : 'off')}
        />
      </div>
      <CodeBlock
        code={largeFile}
        language="ts"
        title="restock.ts"
        tokenize={tokenizeTypeScript}
        lineNumbers={hasNumbers}
        wrap={wrap}
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Variants"
      description="Code and terminal blocks with short and long lines, with Copy alone or with an Apply action. Long lines scroll sideways and become focusable."
    >
      <StateMatrix
        axes={{
          variant: ['code', 'terminal'],
          content: ['short', 'long'],
          actions: ['copy', 'apply'],
        }}
        render={({ variant, content, actions }) => (
          <div style={{ width: 360 }}>
            <CodeBlock
              code={samples[variant][content]}
              variant={variant}
              language={variant === 'code' ? 'ts' : 'sh'}
              tokenize={tokenizeScript}
              onApply={actions === 'apply' ? () => undefined : undefined}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Languages and titles"
      description="The header shows the title, else the language, else the variant's name; a tokenizer highlights typed tokens."
    >
      <div data-lab-demo="languages" style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <CodeBlock code={script} language="ts" tokenize={tokenizeScript} />
        <CodeBlock code={'{ "city": "Lisbon", "nights": 3 }'} language="json" />
        <CodeBlock code={script} language="ts" title="count-nights.ts" tokenize={tokenizeScript} />
        <CodeBlock code={'Plain text without a language.'} />
      </div>
    </LabSection>
    <LabSection
      title="Highlighted languages"
      description="TypeScript, JSON, CSS and Python through the code editor's tokenizers, and a shell syntax built from the same ordered rules, each passed as tokenize and numbered."
    >
      <div
        data-lab-demo="highlighted-languages"
        style={{ display: 'grid', gap: 12, maxWidth: 560 }}
      >
        {languageSamples.map((sample) => (
          <CodeBlock
            key={sample.title}
            code={sample.code}
            language={sample.language}
            title={sample.title}
            tokenize={sample.tokenize}
            lineNumbers
          />
        ))}
      </div>
    </LabSection>
    <LabSection
      title="Line numbers"
      description="lineNumbers numbers each line in a gutter the stylesheet draws, so Copy, a selection and find take only the code. Blank lines keep their numbers; the empty line after a final line break gets none. A wrapped line keeps one number."
    >
      <LineNumbersDemo />
    </LabSection>
    <LabSection
      title="Large file"
      description="Over a thousand lines in a viewport the host bounds to 360 pixels: the code scrolls down and sideways, and the keyboard can reach it to scroll. The numbers stay at the start while it scrolls sideways; Wrap trades sideways scrolling for wrapped rows."
    >
      <LargeFileDemo />
    </LabSection>
    <LabSection
      title="Long lines"
      description="A long line scrolls sideways instead of wrapping; the code joins the tab order, so the keyboard can scroll it."
    >
      <div data-lab-demo="long" style={{ maxWidth: 420 }}>
        <CodeBlock code={longScript} language="ts" tokenize={tokenizeScript} />
      </div>
    </LabSection>
    <LabSection
      title="Highlighting arrives later"
      description="The code stays the same while highlighting spaces its letters wider: the code starts to overflow and joins the tab order, and leaves it once the highlighting is removed."
    >
      <LateHighlight />
    </LabSection>
    <LabSection
      title="Terminal"
      description="Command lines after the prompt and their output; Copy takes only the commands. A block can name its own prompt, or hold only output."
    >
      <div data-lab-demo="terminal" style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <CodeBlock code={session} variant="terminal" />
        <CodeBlock
          code={'PS> Get-Date\nSaturday, 2 May 2026 08:30:00'}
          variant="terminal"
          prompt="PS>"
          title="PowerShell"
        />
        <CodeBlock code={'Route ready: 3 h 10 min\nPlan saved to plan.json'} variant="terminal" />
      </div>
    </LabSection>
    <LabSection
      title="Apply"
      description="With onApply, an Apply action hands over the block's value: the code, or a terminal block's commands. applyLabel renames it."
    >
      <ApplyDemo />
    </LabSection>
    <LabSection
      title="Find"
      description="The code renders through TextMatch, so a TextMatchProvider marks the query."
    >
      <FindDemo />
    </LabSection>
    <LabSection
      title="Markdown"
      description="createCodeBlockOverride draws a Markdown answer's code blocks as code blocks: highlighted by fence language, a console fence as a terminal, with an Insert action."
    >
      <MarkdownDemo />
    </LabSection>
  </>,
);
