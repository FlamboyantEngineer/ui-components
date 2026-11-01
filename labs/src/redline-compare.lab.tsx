import { useState } from 'react';
import {
  RedlineCompare,
  type RedlineCompareLayout,
  type RedlineDecision,
} from '../../src/components/redline-compare/redline-compare.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import type { DocumentBlock } from '../../src/utils/compare-blocks.js';
import { requireDefined } from './require-defined.js';
import { ShadowRootApp } from './shadow-root-host.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LargeInputDemo } from './large-input-demo.js';

const orchardWords = [
  'apple pear plum quince cherry orchard ladder basket crate press cider frost',
  'walnut hazel medlar damson sloe rowan elder bramble hedge barrel cellar harvest',
]
  .join(' ')
  .split(' ');

/** The orchard words in an order fixed by `seed`, as a paragraph. */
function shuffleWords(seed: number): string {
  const order = [...orchardWords];
  let state = seed;
  for (let index = order.length - 1; index > 0; index -= 1) {
    state = (state * 48_271) % 2_147_483_647;
    const other = state % (index + 1);
    [order[index], order[other]] = [order[other] ?? '', order[index] ?? ''];
  }
  return `${order.join(' ')}.`;
}

/**
 * A 400-paragraph document without ids, one paragraph a line, and its rewrite: every paragraph's
 * words reordered, so every old paragraph shares all its words with every new one.
 */
const rewrittenDocument = () =>
  Array.from({ length: 400 }, (_, index) => shuffleWords(index + 1)).join('\n');

const toParagraphs = (text: string): DocumentBlock[] =>
  text.split('\n').map((line) => ({ type: 'paragraph', text: line }));

const rewrite = (text: string) =>
  text
    .split('\n')
    .map((_, index) => shuffleWords(index + 10_001))
    .join('\n');

const revision3: DocumentBlock[] = [
  { id: 'title', type: 'heading', level: 1, text: 'Pump maintenance' },
  { id: 'scope', type: 'paragraph', text: 'This procedure applies to the two booster pumps.' },
  { id: 'safety', type: 'heading', level: 2, text: 'Safety' },
  {
    id: 'isolate',
    type: 'list-item',
    level: 1,
    text: 'Isolate the pump at the main switch.',
    marks: [{ type: 'bold', start: 0, end: 7 }],
  },
  { id: 'drain', type: 'list-item', level: 1, text: 'Drain the casing into a bucket.' },
  { id: 'gloves', type: 'list-item', level: 1, text: 'Wear gloves.' },
  { id: 'steps', type: 'heading', level: 2, text: 'Steps' },
  {
    id: 'seal',
    type: 'paragraph',
    text: 'Replace the shaft seal every 2000 hours, as the manual describes.',
    marks: [{ type: 'link', start: 48, end: 54, href: '#manual' }],
  },
  { id: 'note', type: 'paragraph', text: 'Record the hours in the log.' },
  { id: 'torque', type: 'code', text: 'torque = 12 Nm' },
];

const revision4: DocumentBlock[] = [
  { id: 'title', type: 'heading', level: 1, text: 'Pump maintenance' },
  { id: 'scope', type: 'paragraph', text: 'This procedure applies to all three booster pumps.' },
  { id: 'safety', type: 'heading', level: 2, text: 'Safety' },
  { id: 'gloves', type: 'list-item', level: 1, text: 'Wear gloves and eye protection.' },
  {
    id: 'isolate',
    type: 'list-item',
    level: 1,
    text: 'Isolate the pump at the main switch.',
    marks: [{ type: 'italic', start: 0, end: 7 }],
  },
  { id: 'lock', type: 'list-item', level: 2, text: 'Lock the switch and tag it.' },
  { id: 'drain', type: 'list-item', level: 1, text: 'Drain the casing into a bucket.' },
  { id: 'steps', type: 'heading', level: 2, text: 'Steps' },
  {
    id: 'seal',
    type: 'paragraph',
    text: 'Replace the shaft seal every 1500 hours, as the manual describes.',
    marks: [{ type: 'link', start: 48, end: 54, href: '#manual' }],
  },
  { id: 'note', type: 'quote', text: 'Record the hours in the log.' },
  { id: 'torque', type: 'code', text: 'torque = 14 Nm' },
];

const short: DocumentBlock[] = [
  { type: 'heading', level: 2, text: 'Opening hours' },
  { type: 'paragraph', text: 'Open daily from nine to five.' },
];

const contents = {
  edited: [
    short,
    [requireDefined(short[0]), { type: 'paragraph', text: 'Open daily from eight to six.' }],
  ],
  written: [[], short],
  cleared: [short, []],
  unchanged: [short, short],
} as const;
const contentNames = Object.keys(contents) as Array<keyof typeof contents>;
const typedBlocks: DocumentBlock[] = [
  { id: 1, type: 'paragraph', text: 'Numeric entry' },
  { id: '1', type: 'paragraph', text: 'Text entry' },
  { id: 'keep', type: 'paragraph', text: 'Unchanged entry' },
];

const draftNotes: DocumentBlock[] = [
  { type: 'paragraph', text: 'The library opens at nine on weekdays.' },
  { type: 'paragraph', text: 'Bring a card to borrow books.' },
  { type: 'paragraph', text: 'Quiet rooms are on the second floor.' },
];

const finalNotes: DocumentBlock[] = [
  { type: 'paragraph', text: 'The library opens at eight on weekdays.' },
  { type: 'paragraph', text: 'Quiet rooms are on the second floor.' },
  { type: 'paragraph', text: 'Bring a card to borrow books.' },
  { type: 'paragraph', text: 'Parking is free after six.' },
];

/** A review: accept or reject each change, inline or side by side. */
function Review() {
  const [layout, setLayout] = useState<RedlineCompareLayout>('inline');
  const [decisions, setDecisions] = useState<Record<string, RedlineDecision>>({});
  const [last, setLast] = useState('none');
  return (
    <div data-lab-demo="review">
      <SegmentedChoice
        aria-label="Layout"
        options={[
          { value: 'inline', label: 'Inline' },
          { value: 'split', label: 'Side by side' },
        ]}
        value={layout}
        onChange={(value) => setLayout(value === 'split' ? 'split' : 'inline')}
      />
      <RedlineCompare
        aria-label="Pump maintenance, revision 3 to 4"
        oldBlocks={revision3}
        newBlocks={revision4}
        layout={layout}
        oldLabel="Revision 3"
        newLabel="Revision 4"
        resolutions={decisions}
        onResolve={({ decision, row }) => {
          setDecisions({ ...decisions, [row.key]: decision });
          setLast(`${decision} ${row.newBlock?.id ?? row.oldBlock?.id} (${row.change})`);
        }}
      />
      <output data-lab-output>{`Last decision: ${last}`}</output>
    </div>
  );
}

/** A paragraph whose two links overlap on "setup guide": the later link takes the overlap. */
const linkedNote: DocumentBlock = {
  id: 'links',
  type: 'paragraph',
  text: 'Read the setup guide appendix first.',
  marks: [
    { type: 'link', start: 9, end: 20, href: '#setup' },
    { type: 'link', start: 15, end: 29, href: '#appendix' },
    { type: 'bold', start: 9, end: 29 },
  ],
};

mountLab(
  <>
    <LabSection
      title="Layouts"
      description="Edited, newly written, cleared and unchanged documents, inline in one column and side by side. Deleted words are struck in del elements and inserted words in ins elements; the header counts the changed blocks and steps between them (also with n and p)."
    >
      <StateMatrix
        axes={{ content: contentNames, layout: ['inline', 'split'] }}
        render={({ content, layout }) => (
          <RedlineCompare
            aria-label={`${content} document, ${layout}`}
            oldBlocks={contents[content][0]}
            newBlocks={contents[content][1]}
            layout={layout}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Review"
      description="Two revisions of a procedure aligned by block id: a changed scope, a list item moved above another (with links between its two positions), a nested item added, a bold mark turned italic, a paragraph turned into a quote and a changed code block. Accept and reject report each decision as plain data."
    >
      <Review />
    </LabSection>
    <LabSection
      title="Blocks without ids"
      description="Blocks without ids match by their text: an equal paragraph that moved, a rewritten paragraph paired with its old version because most of its words stayed, and a new one."
    >
      <StateMatrix
        axes={{ layout: ['inline', 'split'] }}
        render={({ layout }) => (
          <RedlineCompare
            aria-label={`Visitor notes, ${layout}`}
            oldBlocks={draftNotes}
            newBlocks={finalNotes}
            layout={layout}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Rewritten document"
      description="Four hundred paragraphs without ids, each rewritten in the same words. Pairing skips paragraphs that cannot read alike by their lengths and shared words, and runs at most eight word diffs per removed paragraph, so the comparison stays fast."
    >
      <LargeInputDemo label="400 rewritten paragraphs" build={rewrittenDocument}>
        {(text) => (
          <RedlineCompare
            aria-label="Rewritten document"
            oldBlocks={toParagraphs(text)}
            newBlocks={toParagraphs(rewrite(text))}
          />
        )}
      </LargeInputDemo>
    </LabSection>
    <LabSection
      title="Overlapping links"
      description="An added paragraph whose two links overlap. A stretch of text is never inside two links: where they overlap, the link that starts later wins, then the shorter one, then the one listed last; the bold mark spans both."
    >
      <RedlineCompare
        aria-label="Overlapping links"
        oldBlocks={[]}
        newBlocks={[linkedNote]}
        data-lab-demo="links"
      />
    </LabSection>
    <LabSection
      title="Typed identifiers"
      description="Numeric and string identifiers remain distinct when a paragraph moves, and the jump links connect its two positions."
    >
      <RedlineCompare
        aria-label="Typed identifiers"
        oldBlocks={typedBlocks}
        newBlocks={[
          requireDefined(typedBlocks[1]),
          requireDefined(typedBlocks[2]),
          requireDefined(typedBlocks[0]),
        ]}
        data-lab-demo="typed"
      />
    </LabSection>
    <LabSection
      title="Inside a shadow root"
      description="Visitor notes inside an open shadow root, as a web component holds them: Next change and the links between a moved paragraph's two positions still move focus to the right row."
    >
      <ShadowRootApp demo="shadow-redline">
        <RedlineCompare aria-label="Shadow notes" oldBlocks={draftNotes} newBlocks={finalNotes} />
      </ShadowRootApp>
    </LabSection>
  </>,
);
