import { useState } from 'react';
import {
  DescriptionList,
  DescriptionRow,
  type DescriptionListColumns,
} from '../../src/components/description-list/description-list.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

function Facts({
  layout,
  columns,
}: {
  layout: 'inline' | 'stacked';
  columns: DescriptionListColumns;
}) {
  return (
    <DescriptionList layout={layout} columns={columns}>
      <DescriptionRow label="City">Lisbon</DescriptionRow>
      <DescriptionRow label="Country" secondary="Western Europe">
        Portugal
      </DescriptionRow>
      <DescriptionRow label="Rivers">{0}</DescriptionRow>
      <DescriptionRow label="Founded">
        <time dateTime="-1200">About 1200 BC</time>
      </DescriptionRow>
      <DescriptionRow label="Notes">
        A long value that wraps across lines instead of widening the row or being clipped by it.
      </DescriptionRow>
      <DescriptionRow label="Website">
        <a href="#lisbon">example.com/lisbon</a>
      </DescriptionRow>
    </DescriptionList>
  );
}

function FocusableRows() {
  const [log, setLog] = useState('Nothing yet');
  return (
    <div data-lab-focusable>
      <DescriptionList aria-label="Timestamps">
        {(['Created', 'Updated'] as const).map((label) => (
          <DescriptionRow
            key={label}
            label={label}
            tabIndex={0}
            data-lab-row={label}
            onClick={() => setLog(`Selected ${label}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') setLog(`Selected ${label}`);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              setLog(`Context menu on ${label}`);
            }}
          >
            {label === 'Created' ? 'Monday 09:00' : 'Tuesday 14:30'}
          </DescriptionRow>
        ))}
      </DescriptionList>
      <p data-lab-log>{log}</p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Layouts and columns"
      description="Inline and stacked rows in one or two columns, with a second definition, zero, rich and long values."
    >
      <StateMatrix
        axes={{ layout: ['inline', 'stacked'], columns: ['1', '2'] }}
        render={({ layout, columns }) => (
          <div style={{ width: 420 }}>
            <Facts layout={layout} columns={columns === '2' ? 2 : 1} />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Focusable rows"
      description="Rows a caller makes focusable keep their handlers. Click a row, press Enter on it or open its context menu."
    >
      <FocusableRows />
    </LabSection>
  </>,
);
