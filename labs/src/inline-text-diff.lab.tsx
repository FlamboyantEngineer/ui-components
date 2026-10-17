import { useId, useState } from 'react';
import { InlineTextDiff } from '../../src/components/inline-text-diff/inline-text-diff.js';
import { createInlineTextDiffExcerpt } from '../../src/components/inline-text-diff/text-diff.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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

function LiveDiff() {
  const beforeId = useId();
  const afterId = useId();
  const [before, setBefore] = useState('The quick brown fox');
  const [after, setAfter] = useState('The quick red fox');
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
      <p>
        Changed: <InlineTextDiff segments={createInlineTextDiffExcerpt(before, after)} />
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
    <LabSection title="Live" description="Edit both values to see the excerpt follow.">
      <LiveDiff />
    </LabSection>
  </>,
);
