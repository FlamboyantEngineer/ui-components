import { useState, type ReactNode } from 'react';
import { MetaLine, formatMetaLine } from '../../src/components/meta-line/meta-line.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const entrySets: Record<string, readonly ReactNode[]> = {
  one: ['Lisbon'],
  several: ['Lisbon', 'Portugal', '545,000 people'],
  'empty entries': [null, 'Lisbon', '', false, 'Portugal', undefined, '  '],
  zero: ['Orchard', 0, 'crates left'],
  nodes: [
    <a key="link" href="#lisbon">
      Lisbon
    </a>,
    <time key="time" dateTime="2026-10-08">
      October 8
    </time>,
    <strong key="count">12 visits</strong>,
  ],
  none: [null, '', false],
};
const sets = Object.keys(entrySets);

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      Clicked {count}
    </button>
  );
}

function ToggleDemo() {
  const [leading, setLeading] = useState(true);
  return (
    <div data-lab-toggle>
      <p>
        <label>
          <input
            type="checkbox"
            checked={leading}
            onChange={(event) => setLeading(event.target.checked)}
          />{' '}
          Show the leading entry
        </label>
      </p>
      <p>
        <MetaLine
          items={[leading ? 'Updated today' : null, <Counter key="counter" />, '3 notes']}
        />
      </p>
      <p>
        Text form: <code>{formatMetaLine([leading ? 'Updated today' : null, '3 notes'])}</code>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Entries"
      description="Empty entries leave no separator, zero stays, and a line with nothing left renders nothing. The narrow column is 160px."
    >
      <StateMatrix
        axes={{ entries: sets, container: ['wide', 'narrow'] }}
        render={({ entries, container }) => {
          const line = <MetaLine items={entrySets[entries] ?? []} />;
          return container === 'narrow' ? <div style={{ width: 160 }}>{line}</div> : line;
        }}
      />
    </LabSection>
    <LabSection
      title="Changing entries"
      description="The button keeps its count while the entry before it comes and goes."
    >
      <ToggleDemo />
    </LabSection>
  </>,
);
