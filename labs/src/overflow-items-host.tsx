import { useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { Button } from '../../src/components/button/button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { useOverflowItems } from '../../src/utils/index.js';

const labels = ['Inbox', 'Drafts', 'Sent', 'Archive', 'Spam', 'Trash'];
const widths = { wide: 560, medium: 300, narrow: 150 } as const;
type Width = keyof typeof widths;
type Layout = 'direct' | 'placed' | 'nested';

interface RowOptions {
  pinned: string;
  minVisible: number;
}

/** Shows the kept and hidden items under a row. */
function Readout({ visible, hidden }: { visible: readonly string[]; hidden: readonly string[] }) {
  return (
    <p>
      Kept: <output data-lab-output="kept">{visible.join(', ') || 'none'}</output>; hidden:{' '}
      <output data-lab-output="hidden">{hidden.join(', ') || 'none'}</output>
    </p>
  );
}

function Chip({ label, pinned }: { label: string; pinned: string }) {
  return (
    <span data-lab-item={label} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
      <Badge>{label === pinned ? `${label} (pinned)` : label}</Badge>
    </span>
  );
}

function useHostOverflow({ pinned, minVisible }: RowOptions) {
  return useOverflowItems({
    items: labels,
    getPriority: (label) => (label === pinned ? 1 : 0),
    minVisible,
  });
}

/** Items and the indicator are the container's children, the indicator at the collapsing end. */
function DirectRow(options: RowOptions) {
  const { containerRef, visibleItems, hiddenItems } = useHostOverflow(options);
  return (
    <>
      <div ref={containerRef} style={{ display: 'flex', gap: 4 }} data-lab-row="">
        {visibleItems.map((label) => (
          <Chip key={label} label={label} pinned={options.pinned} />
        ))}
        {hiddenItems.length > 0 ? (
          <span data-lab-indicator="">
            <Badge>{`+${String(hiddenItems.length)}`}</Badge>
          </span>
        ) : null}
      </div>
      <Readout visible={visibleItems} hidden={hiddenItems} />
    </>
  );
}

/** The indicator sits after the first item, wherever indicatorRef places it. */
function PlacedRow(options: RowOptions) {
  const { containerRef, indicatorRef, visibleItems, hiddenItems } = useHostOverflow(options);
  const [first, ...rest] = visibleItems;
  return (
    <>
      <div ref={containerRef} style={{ display: 'flex', gap: 4 }} data-lab-row="">
        {first === undefined ? null : <Chip label={first} pinned={options.pinned} />}
        {hiddenItems.length > 0 ? (
          <span ref={indicatorRef} data-lab-indicator="">
            <Badge>{`+${String(hiddenItems.length)}`}</Badge>
          </span>
        ) : null}
        {rest.map((label) => (
          <Chip key={label} label={label} pinned={options.pinned} />
        ))}
      </div>
      <Readout visible={visibleItems} hidden={hiddenItems} />
    </>
  );
}

/** The items live in a list of their own beside a fixed action that keeps its size. */
function NestedRow(options: RowOptions) {
  const { containerRef, itemContainerRef, visibleItems, hiddenItems } = useHostOverflow(options);
  return (
    <>
      <div ref={containerRef} style={{ display: 'flex', gap: 4 }} data-lab-row="">
        <ul
          ref={itemContainerRef}
          aria-label="Folders"
          style={{ display: 'flex', gap: 4, margin: 0, padding: 0, listStyle: 'none', minWidth: 0 }}
        >
          {visibleItems.map((label) => (
            <li key={label} data-lab-item={label} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Badge>{label === options.pinned ? `${label} (pinned)` : label}</Badge>
            </li>
          ))}
        </ul>
        {hiddenItems.length > 0 ? (
          <span data-lab-indicator="">
            <Badge>{`+${String(hiddenItems.length)}`}</Badge>
          </span>
        ) : null}
        <Button size="sm" data-lab-fixed="">
          New folder
        </Button>
      </div>
      <Readout visible={visibleItems} hidden={hiddenItems} />
    </>
  );
}

const rows = { direct: DirectRow, placed: PlacedRow, nested: NestedRow } as const;

/** A host-rendered row measured by useOverflowItems, with every option in reach. */
export function OverflowItemsHost() {
  const [width, setWidth] = useState<Width>('medium');
  const [layout, setLayout] = useState<Layout>('direct');
  const [pinned, setPinned] = useState('Trash');
  const [minVisible, setMinVisible] = useState(0);
  const Row = rows[layout];
  return (
    <div data-lab-demo="overflow-items">
      <div role="group" aria-label="Row options">
        <SegmentedChoice
          aria-label="Width"
          sizing="content"
          options={Object.keys(widths).map((value) => ({ value, label: value }))}
          value={width}
          onChange={(value) => setWidth((value as Width | null) ?? 'medium')}
        />
        <SegmentedChoice
          aria-label="Layout"
          sizing="content"
          options={[
            { value: 'direct', label: 'Direct children' },
            { value: 'placed', label: 'Placed indicator' },
            { value: 'nested', label: 'Nested list' },
          ]}
          value={layout}
          onChange={(value) => setLayout((value as Layout | null) ?? 'direct')}
        />
        <SegmentedChoice
          aria-label="Pinned item"
          sizing="content"
          options={['Inbox', 'Sent', 'Trash'].map((value) => ({ value, label: value }))}
          value={pinned}
          onChange={(value) => setPinned(value ?? 'Trash')}
        />
        <SegmentedChoice
          aria-label="Minimum visible"
          sizing="content"
          options={['0', '2'].map((value) => ({ value, label: value }))}
          value={String(minVisible)}
          onChange={(value) => setMinVisible(Number(value ?? 0))}
        />
      </div>
      <div data-lab-frame="" style={{ width: widths[width] }}>
        <Row key={layout} pinned={pinned} minVisible={minVisible} />
      </div>
    </div>
  );
}
