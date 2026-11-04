import { useMemo, useState, type ReactNode } from 'react';
import {
  Markdown,
  listMarkdownHeadings,
  parseMarkdown,
  type MarkdownNode,
} from '../../src/components/markdown/index.js';
import { Outline } from '../../src/components/outline/outline.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { TextMatchProvider } from '../../src/components/text-match/text-match.js';
import { LargeInputDemo } from './large-input-demo.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { StreamingDemo } from './markdown-streaming-demo.js';
import { MarkdownOverrideSections } from './markdown-override-cases.js';
import { MarkdownWideTableDemo } from './markdown-wide-table-demo.js';

const samples = {
  text: [
    '## Orchard notes',
    '',
    'Pick *ripe* fruit **gently**, never ~~in the rain~~.  ',
    'Store apples cool and pears at room temperature, as the `storage` guide says.',
    '',
    'Setext heading',
    '--------------',
    '',
    'Escaped \\*stars\\* and entities: &copy; 2026 &mdash; Cider &amp; Co.',
  ].join('\n'),
  lists: [
    '- Apples',
    '  - Bramley',
    '  - Cox',
    '- Pears',
    '',
    '3. Wash',
    '4. Core',
    '5. Slice',
  ].join('\n'),
  code: [
    'Run `press --batch 4`:',
    '',
    '```sh',
    'press --batch 4 --cool',
    '```',
    '',
    '    indented code',
  ].join('\n'),
  table: [
    '| Fruit | Orchard | Crates |',
    '|:------|:-------:|-------:|',
    '| Apple | North | 1,240 |',
    '| Pear | South | 86 |',
    '| Plum | East | 412 |',
  ].join('\n'),
  quote: [
    '> Apples keep for months.',
    '> > A nested remark.',
    '',
    '***',
    '',
    'After the break.',
  ].join('\n'),
  links: [
    'Read the [planting guide](/guides/planting "Planting by season"), the [seed catalogue][seeds] or',
    'the <https://example.com/orchards> page. Write to <orchard@example.com>.',
    '',
    "[seeds]: https://example.com/seeds 'Seeds for every orchard'",
  ].join('\n'),
} as const;

const lazyLines = [
  '> Apples keep for months',
  'when stored cool.',
  '',
  '> ### Pears',
  'Pears ripen off the tree.',
  '',
  '- ```',
  '  press --cool',
  '  ```',
  'Press after the harvest.',
].join('\n');

const tabbedCode = [
  '> ```make',
  '> press:',
  '> \tpress --batch 4',
  '> ```',
  '',
  '- Then clean up:',
  '',
  '  ```make',
  '  clean:',
  '  \trm -f cider',
  '  ```',
].join('\n');

const taskList = [
  '- [x] Prune the apple trees',
  '- [ ] Order **crates**',
  '- [ ] Press cider',
  '',
  '  Use the small press first.',
  '- Plain item',
].join('\n');

const guide = [
  '# Orchard guide',
  '',
  'This guide covers [planting](#planting), [harvest](#harvest) and [winter care](#apr%C3%A8s-r%C3%A9colte).',
  '',
  '## Planting',
  '',
  'Plant in late autumn, two metres apart.',
  '',
  '### Soil',
  '',
  'Loose, well-drained soil suits most fruit trees.',
  '',
  '## Harvest',
  '',
  'Pick when the fruit lifts away with a gentle twist.',
  '',
  '## Après-récolte',
  '',
  'Rake the leaves and mulch the young trees before the first frost.',
].join('\n');

const unsafe = [
  'Raw HTML stays text: <b onclick="window.unsafe = true">bold</b> <script>window.unsafe = true</script>',
  '',
  '[A script link](javascript:window.unsafe=true) and ![a data image](data:image/png;base64,AA)',
].join('\n');

const overrides = [
  '## Harvest by month',
  '',
  '```chart',
  'Apples 7',
  'Pears 4',
  'Plums 2',
  '```',
  '',
  '![A pear](pear.svg "Pear")',
].join('\n');

const pearDrawing =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24 6c-2 0-3 2-3 4-6 3-11 12-11 20 0 7 6 12 14 12s14-5 14-12c0-8-5-17-11-20 0-2-1-4-3-4Z" fill="#9bbb59"/></svg>',
  );

/** A chart drawn from a fenced block, an image source resolved, a heading given an anchor. */
function renderOverride(node: MarkdownNode, children: ReactNode): ReactNode {
  if (node.type === 'codeBlock' && node.language === 'chart') {
    const rows = node.text.split('\n').map((line) => line.split(' '));
    return (
      <figure data-lab-chart>
        <figcaption>Crates per month</figcaption>
        <ul>
          {rows.map(([label = '', value = '0']) => (
            <li key={label}>
              {label}: {'■'.repeat(Number(value))} {value}
            </li>
          ))}
        </ul>
      </figure>
    );
  }
  if (node.type === 'image') return <img src={pearDrawing} alt={node.alt} width={48} height={48} />;
  if (node.type === 'heading') {
    return (
      <h2 id={`override-${node.id}`}>
        {children} <a href={`#override-${node.id}`}>#</a>
      </h2>
    );
  }
  return undefined;
}

function OutlineDemo() {
  const document = useMemo(() => parseMarkdown(guide), []);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24 }}>
      <Outline headings={listMarkdownHeadings(document, 'guide-')} aria-label="Guide outline" />
      <Markdown source={document} headingIdPrefix="guide-" data-lab-guide />
    </div>
  );
}

function FindDemo() {
  const [query, setQuery] = useState('apple');
  return (
    <>
      <SearchField label="Find in notes" value={query} onChange={setQuery} />
      <TextMatchProvider query={query}>
        <Markdown source={`${samples.text}\n\n${samples.table}`} data-lab-find />
      </TextMatchProvider>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Constructs"
      description="Each kind of block and inline at body size and at a small size: headings, emphasis, lists, code, a table, quotes, a break and links. A code block names its language only in data-language; the Streaming section highlights code through createCodeBlockOverride."
    >
      <StateMatrix
        axes={{ content: Object.keys(samples), text: ['body', 'small'] }}
        render={({ content, text }) => (
          <div style={text === 'small' ? { fontSize: 12, maxWidth: 360 } : { maxWidth: 420 }}>
            <Markdown source={samples[content as keyof typeof samples]} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Task lists"
      description="Task items as read-only checkboxes named by their text; a loose item keeps its later paragraph."
    >
      <Markdown source={taskList} data-lab-tasks />
    </LabSection>
    <LabSection
      title="Nested blocks"
      description="Nested quotes can hold nested lists while keeping their content in source order. A line without the quote marker continues only an open paragraph: after a heading or a code block it starts a paragraph outside."
    >
      <Markdown
        source={`${'> '.repeat(6)}- outer\n${'> '.repeat(6)}  - nested item`}
        data-lab-nested
      />
      <Markdown source={lazyLines} data-lab-lazy />
    </LabSection>
    <LabSection
      title="Tabs in code"
      description="Code keeps its tabs as written, inside quotes and lists too, so copying a recipe gives back working tabs."
    >
      <Markdown source={tabbedCode} data-lab-tabs />
    </LabSection>
    <LabSection
      title="Heading ids and outline"
      description="One parse feeds the outline and the reader; headings carry prefixed ids and in-page links follow them."
    >
      <OutlineDemo />
    </LabSection>
    <LabSection
      title="Find"
      description="Text renders through TextMatch, so a TextMatchProvider marks the query in text, code and table cells."
    >
      <FindDemo />
    </LabSection>
    <LabSection
      title="Node overrides"
      description="renderNode draws a chart from a fenced block, resolves an image source and gives a heading an anchor."
    >
      <Markdown source={overrides} renderNode={renderOverride} data-lab-overrides />
    </LabSection>
    <MarkdownOverrideSections />
    <LabSection
      title="Streaming"
      description="A long answer streams in chunk by chunk: incomplete emphasis, links, fences and table rows never flash raw markers, code renders through createCodeBlockOverride and [n] markers through createCitationOverride, and only the block a chunk changed renders again."
    >
      <StreamingDemo />
    </LabSection>
    <LabSection
      title="Safe content"
      description="Raw HTML shows as text; a script link keeps its formatted label, and a data image keeps only its alt text."
    >
      <Markdown source={unsafe} data-lab-unsafe />
      <Markdown source={`[${'`code` '.repeat(8)}](javascript:noop)`} data-lab-unsafe-spans />
    </LabSection>
    <LabSection
      title="Large unbalanced input"
      description="Markers that never pair, nested brackets and unclosed link destinations parse in time proportional to their length."
    >
      <LargeInputDemo
        label="96 KB of unbalanced markers"
        build={() => 'a* _b '.repeat(8_000) + '['.repeat(16_000) + '[a]('.repeat(8_000)}
      >
        {(source) => <Markdown source={source} />}
      </LargeInputDemo>
    </LabSection>
    <MarkdownWideTableDemo />
    <LabSection
      title="Deep nesting"
      description="2,000 nested block quotes and 2,000 nested emphasis spans draw without overflowing the stack: past 256 levels elements are unwrapped and their text kept in order."
    >
      <LargeInputDemo
        name="deep-nesting"
        label="2,000 nested quotes and emphasis"
        build={() =>
          '>'.repeat(2_000) + ' Deepest quote\n\n' + '*a '.repeat(2_000) + 'b*'.repeat(2_000)
        }
      >
        {(source) => <Markdown source={source} />}
      </LargeInputDemo>
    </LabSection>
  </>,
);
