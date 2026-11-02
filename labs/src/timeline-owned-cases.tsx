// Cases of the timeline lab for expansion owned by the host, and for a row height and selection
// mode other than the defaults.

import { useState, type CSSProperties } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import {
  Timeline,
  type TimelineItem,
  type TimelineItemChange,
  type TimelineRow,
  type TimelineView,
} from '../../src/components/timeline/index.js';
import type { Key, SelectionMode } from '../../src/core/props.js';

const rows: TimelineRow[] = [
  {
    id: 'beds',
    label: 'Beds',
    children: [
      { id: 'dig', label: 'Digging' },
      { id: 'sow', label: 'Sowing' },
    ],
  },
  {
    id: 'shed',
    label: 'Shed',
    children: [
      { id: 'base', label: 'Base' },
      { id: 'walls', label: 'Walls' },
    ],
  },
  { id: 'party', label: 'Party' },
];

const groups = ['beds', 'shed'];

const initialItems: TimelineItem[] = [
  { id: 'turn', rowId: 'dig', label: 'Turn soil', start: '2026-03-02', end: '2026-03-06' },
  { id: 'seed', rowId: 'sow', label: 'Sow peas', start: '2026-03-09', end: '2026-03-11' },
  { id: 'slab', rowId: 'base', label: 'Pour slab', start: '2026-03-04', end: '2026-03-09' },
  { id: 'frame', rowId: 'walls', label: 'Frame walls', start: '2026-03-12', end: '2026-03-18' },
  { id: 'feast', rowId: 'party', label: 'Garden party', start: '2026-03-21', kind: 'milestone' },
];

const dependencies = [
  { from: 'turn', to: 'seed' },
  { from: 'slab', to: 'frame' },
  { from: 'frame', to: 'feast' },
];

const range = { start: '2026-03-01', end: '2026-03-28' };
const box: CSSProperties = { width: 560 };
const toolbar: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 };

function formatKeys(keys: Iterable<Key>): string {
  return [...keys].map(String).join(', ') || 'none';
}

const views = { chart: 'Chart', table: 'Table' } as const satisfies Record<TimelineView, string>;

const isView = (value: unknown): value is TimelineView =>
  typeof value === 'string' && Object.hasOwn(views, value);

/**
 * The expanded groups owned by the host (`expandedKeys`, `onExpandedChange`): outside buttons open
 * and close them, the toggles in the row list report back, and the chart and table read the same set.
 */
export function ControlledExpansion() {
  const [expanded, setExpanded] = useState<Set<Key>>(new Set(['shed']));
  const [view, setView] = useState<TimelineView>('chart');
  return (
    <div data-lab-demo="controlled-expansion" style={box}>
      <div style={toolbar}>
        <Button size="sm" variant="secondary" onPress={() => setExpanded(new Set(groups))}>
          Expand every group
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setExpanded(new Set())}>
          Collapse every group
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setExpanded(new Set(['beds']))}>
          Only Beds
        </Button>
        <SegmentedChoice
          aria-label="View"
          size="sm"
          sizing="content"
          options={Object.entries(views).map(([value, label]) => ({ value, label }))}
          value={view}
          onChange={(value) => {
            if (isView(value)) setView(value);
          }}
        />
      </div>
      <Timeline
        aria-label="Garden jobs, expansion owned by the host"
        rows={rows}
        items={initialItems}
        dependencies={dependencies}
        scale="day"
        range={range}
        today="2026-03-10"
        view={view}
        expandedKeys={expanded}
        onExpandedChange={setExpanded}
      />
      <p>
        Expanded: <output data-lab-output="expanded">{formatKeys(expanded)}</output>
      </p>
    </div>
  );
}

const heights = { default: 'Default (36)', tall: '52 pixels' } as const;

type HeightChoice = keyof typeof heights;

const isHeightChoice = (value: unknown): value is HeightChoice =>
  typeof value === 'string' && Object.hasOwn(heights, value);

const modes = { none: 'None (default)', single: 'Single', multiple: 'Multiple' } as const;

const isMode = (value: unknown): value is SelectionMode =>
  typeof value === 'string' && Object.hasOwn(modes, value);

function applyChange(items: readonly TimelineItem[], change: TimelineItemChange) {
  return items.map((item) => (item.id === change.id ? { ...item, ...change } : item));
}

/**
 * Rows 52 pixels tall (`rowHeight`), with bars, row properties and dependency connectors following
 * the rows; and selection turned off (`selectionMode` `none`, the default), single or multiple.
 * Items still move by keyboard while selection is off.
 */
export function RowHeightAndSelection() {
  const [height, setHeight] = useState<HeightChoice>('tall');
  const [mode, setMode] = useState<SelectionMode>('none');
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<Set<Key>>(new Set());
  return (
    <div data-lab-demo="row-height" style={box}>
      <div style={toolbar}>
        <SegmentedChoice
          aria-label="Row height"
          size="sm"
          sizing="content"
          options={Object.entries(heights).map(([value, label]) => ({ value, label }))}
          value={height}
          onChange={(value) => {
            if (isHeightChoice(value)) setHeight(value);
          }}
        />
        <SegmentedChoice
          aria-label="Selection"
          size="sm"
          sizing="content"
          options={Object.entries(modes).map(([value, label]) => ({ value, label }))}
          value={mode}
          onChange={(value) => {
            if (!isMode(value)) return;
            setMode(value);
            setSelected(new Set());
          }}
        />
        <Button size="sm" variant="secondary" onPress={() => setItems(initialItems)}>
          Put the jobs back
        </Button>
      </div>
      <Timeline
        aria-label="Garden jobs, row height and selection"
        rows={rows}
        items={items}
        dependencies={dependencies}
        scale="day"
        range={range}
        today="2026-03-10"
        rowHeight={height === 'tall' ? 52 : undefined}
        rowColumns={['duration', 'dependencies']}
        selectionMode={mode}
        selectedKeys={selected}
        onSelectionChange={(keys) =>
          setSelected(new Set(keys === 'all' ? items.map((item) => item.id) : keys))
        }
        onItemChange={(change) => setItems((current) => applyChange(current, change))}
      />
      <p>
        Selected: <output data-lab-output="row-height-selected">{formatKeys(selected)}</output>
      </p>
    </div>
  );
}
