import { useState } from 'react';
import { CheckGlyph, InfoGlyph, UsersGlyph } from '../../src/core/glyphs.js';
import { ListFilter } from '../../src/components/list-filter/list-filter.js';
import { DockPanel, DockPanelPane } from '../../src/components/dock-panel/dock-panel.js';
import type { ControlSize } from '../../src/core/props.js';

type Filter = 'unread' | 'all' | 'mentions';

export function ListFilterExample({
  label = 'Notifications',
  size = 'sm',
  isDisabled = false,
}: {
  label?: string;
  size?: ControlSize;
  isDisabled?: boolean;
}) {
  const [value, setValue] = useState<Filter>('unread');
  const [count, setCount] = useState(7);
  const [isRejecting, setRejecting] = useState(false);
  const [error, setError] = useState('');
  return (
    <div data-lab-filter={label}>
      <ListFilter<Filter>
        aria-label={`${label} filters`}
        aria-describedby={error ? `${label}-error` : undefined}
        options={[
          { value: 'unread', label: 'Unread', count },
          { value: 'all', label: 'All', count },
          { value: 'mentions', label: 'Mentions', count: 0 },
        ]}
        value={value}
        size={size}
        isDisabled={isDisabled}
        onChange={async (next, signal) => {
          setError('');
          await new Promise<void>((resolve) => setTimeout(resolve, 150));
          if (signal.aborted) return;
          if (isRejecting) throw new Error('Change unavailable. Try again.');
          setValue(next);
        }}
        onError={(reason) =>
          setError(reason instanceof Error ? reason.message : 'Change unavailable.')
        }
        actions={[
          {
            verb: 'custom',
            id: 'read',
            icon: CheckGlyph,
            label: 'Mark all read',
            onPress: async () => {
              await new Promise<void>((resolve) => setTimeout(resolve, 150));
              setCount(0);
            },
          },
          { verb: 'more', items: [{ id: 'export', label: 'Export list' }] },
        ]}
      />
      <p>
        Current filter: <output>{value}</output>
      </p>
      <p id={`${label}-error`} role={error ? 'alert' : undefined}>
        {error}
      </p>
      <label>
        <input
          type="checkbox"
          checked={isRejecting}
          onChange={(event) => setRejecting(event.target.checked)}
        />{' '}
        Reject next change
      </label>{' '}
      <button type="button" onClick={() => setCount((current) => (current === 7 ? 128 : 7))}>
        Change counts
      </button>
    </div>
  );
}

export function FilterDockExample() {
  return (
    <div
      data-lab-demo="filter-dock"
      style={{ display: 'flex', width: 640, maxWidth: '100%', height: 340 }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>List workspace</div>
      <DockPanel label="Lists" defaultSize={320} minSize={180} minMainSize={0}>
        <DockPanelPane id="notifications" label="Notifications" icon={InfoGlyph} count={7}>
          <ListFilterExample />
          <ul>
            <li>New review available</li>
            <li>Shared notes updated</li>
          </ul>
        </DockPanelPane>
        <DockPanelPane id="comments" label="Comments" icon={UsersGlyph} count={128}>
          <ListFilterExample label="Comments" />
          <p>Two readers added notes.</p>
        </DockPanelPane>
      </DockPanel>
    </div>
  );
}
