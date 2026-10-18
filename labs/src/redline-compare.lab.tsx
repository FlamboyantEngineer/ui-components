import { useState } from 'react';
import {
  RedlineCompare,
  type RedlineCompareLayout,
  type RedlineDecision,
} from '../../src/components/redline-compare/redline-compare.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import type { DocumentBlock } from '../../src/utils/compare-blocks.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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
  edited: [short, [short[0]!, { type: 'paragraph', text: 'Open daily from eight to six.' }]],
  written: [[], short],
  cleared: [short, []],
  unchanged: [short, short],
} as const;
const contentNames = Object.keys(contents) as Array<keyof typeof contents>;

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
          setLast(`${decision} ${row.key} (${row.change})`);
        }}
      />
      <output data-lab-output>{`Last decision: ${last}`}</output>
    </div>
  );
}

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
  </>,
);
