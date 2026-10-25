import { useMemo, useState } from 'react';
import {
  CodeBlock,
  createCodeBlockOverride,
  type CodeBlockVariant,
} from '../../src/components/code-block/index.js';
import type { CodeToken } from '../../src/components/code-editor/code-editor.js';
import { Markdown } from '../../src/components/markdown/markdown.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { TextMatchProvider } from '../../src/components/text-match/text-match.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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
      title="Long lines"
      description="A long line scrolls sideways instead of wrapping; the code joins the tab order, so the keyboard can scroll it."
    >
      <div data-lab-demo="long" style={{ maxWidth: 420 }}>
        <CodeBlock code={longScript} language="ts" tokenize={tokenizeScript} />
      </div>
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
