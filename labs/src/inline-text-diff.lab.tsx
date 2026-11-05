import { useId, useState } from 'react';
import {
  createInlineTextDiffExcerpt,
  createInlineWordDiff,
  splitTextDiff,
} from '../../src/components/inline-text-diff/index.js';
import {
  InlineTextDiff,
  type InlineTextDiffView,
} from '../../src/components/inline-text-diff/inline-text-diff.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { InlineTextDiffCases } from './inline-text-diff-cases.js';
import { LabHelperCalls } from './lab-helper-calls.js';

const longBefore = `Shipping notes for the orchard: ${'pack the apples gently, '.repeat(3)}then label each crate.`;
const changes = {
  replace: ['The red apple is ripe.', 'The green apple is ripe.'],
  insert: ['Lisbon to Porto', 'Lisbon to Coimbra to Porto'],
  delete: ['Pears, plums and cherries', 'Pears and cherries'],
  'first value': ['', 'A new description'],
  cleared: ['An old description', ''],
  'long change': [longBefore, `${longBefore.slice(0, 40)}${'Ship the pears first. '.repeat(8)}`],
  markup: ['Text <b>bold</b>', 'Text <i>italic</i>'],
} as const;
const cases = Object.keys(changes) as Array<keyof typeof changes>;
const wordChanges = {
  'several words': ['Ship pears to Lisbon on Monday.', 'Ship plums to Porto on Friday.'],
  'joined change': ['The quick brown fox', 'The slow red fox'],
  punctuation: ['Apples, pears and plums.', 'Apples; pears and plums!'],
  'added sentence': ['Pack the crates.', 'Pack the crates. Label each one.'],
} as const;
const wordCases = Object.keys(wordChanges) as Array<keyof typeof wordChanges>;

function LiveDiff() {
  const beforeId = useId();
  const afterId = useId();
  const [before, setBefore] = useState('The quick brown fox');
  const [after, setAfter] = useState('The quick red fox');
  const [view, setView] = useState<InlineTextDiffView>('changes');
  return (
    <div data-lab-live>
      <p>
        <label htmlFor={beforeId}>Before </label>
        <input
          id={beforeId}
          value={before}
          onChange={(event) => setBefore(event.target.value)}
        />{' '}
        <label htmlFor={afterId}>After </label>
        <input id={afterId} value={after} onChange={(event) => setAfter(event.target.value)} />
      </p>
      <SegmentedChoice
        aria-label="Show"
        sizing="content"
        options={[
          { value: 'changes', label: 'Changes' },
          { value: 'final', label: 'Final text' },
        ]}
        value={view}
        onChange={(value) => setView(value === 'final' ? 'final' : 'changes')}
      />
      <p>
        Changed:{' '}
        <InlineTextDiff
          segments={createInlineTextDiffExcerpt(before, after)}
          view={view}
          finalText={after}
        />
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Changes"
      description="Each kind of change, in the flow of a sentence and in a 160px column."
    >
      <StateMatrix
        axes={{ change: cases, container: ['inline', 'narrow'] }}
        render={({ change, container }) => {
          const [before, after] = changes[change];
          const diff = <InlineTextDiff segments={createInlineTextDiffExcerpt(before, after)} />;
          return container === 'narrow' ? (
            <div style={{ width: 160 }}>{diff}</div>
          ) : (
            <span>Description changed: {diff}</span>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Word changes"
      description="createInlineWordDiff shows every changed run of words in place, whole."
    >
      <StateMatrix
        axes={{ change: wordCases }}
        render={({ change }) => {
          const [before, after] = wordChanges[change];
          return (
            <span data-lab-words={change}>
              <InlineTextDiff segments={createInlineWordDiff(before, after)} />
            </span>
          );
        }}
      />
    </LabSection>
    <LabSection
      title="Live"
      description="Edit both values to see the excerpt follow. Show switches between the marked changes and the final text: the whole value after the change, without marks, passed as finalText because the excerpt cuts its context."
    >
      <LiveDiff />
    </LabSection>
    <LabSection
      title="Splitting a change"
      description="splitTextDiff splits two values around their one change, for a host that draws the change itself."
    >
      <LabHelperCalls
        calls={[
          [
            "splitTextDiff('The red apple', 'The green apple')",
            JSON.stringify(splitTextDiff('The red apple', 'The green apple')),
          ],
          ["splitTextDiff('Porto', 'Porto')", JSON.stringify(splitTextDiff('Porto', 'Porto'))],
        ]}
      />
    </LabSection>
    <InlineTextDiffCases />
  </>,
);
