import { useState, type CSSProperties } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import {
  Timeline,
  type TimelineItem,
  type TimelineItemChange,
  type TimelineProps,
  type TimelineRow,
  type TimelineScale,
  type TimelineView,
} from '../../src/components/timeline/timeline.js';
import type { Key } from '../../src/core/props.js';
import { UiProvider } from '../../src/core/provider.js';
import { requireDefined } from './require-defined.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const today = '2026-03-11';

const smallRows: TimelineRow[] = [
  { id: 1, label: 'Preparation' },
  { id: '1', label: 'Cooking' },
];

const smallItems: TimelineItem[] = [
  {
    id: 2,
    rowId: 1,
    label: 'Shopping',
    start: '2026-03-02',
    end: '2026-03-06',
    progress: 1,
    tone: 'success',
  },
  {
    id: '2',
    rowId: 1,
    label: 'Chopping',
    start: '2026-03-09',
    end: '2026-03-13',
    progress: 0.5,
  },
  {
    id: 'stew',
    rowId: '1',
    label: 'Slow stew',
    start: '2026-03-12',
    end: '2026-03-25',
    tone: 'info',
  },
  { id: 'serve', rowId: '1', label: 'Dinner', start: '2026-03-27', kind: 'milestone' },
];

const smallDependencies = [
  { from: '2', to: 'stew' },
  { from: 'stew', to: 'serve' },
];

const ranges: Record<TimelineScale, { start: string; end: string }> = {
  day: { start: '2026-03-01', end: '2026-03-31' },
  week: { start: '2026-03-01', end: '2026-04-11' },
  month: { start: '2026-02-01', end: '2026-05-31' },
  quarter: { start: '2026-01-01', end: '2026-12-31' },
};

const planRows: TimelineRow[] = [
  {
    id: 'planning',
    label: 'Planning',
    children: [
      { id: 'survey', label: 'Survey' },
      { id: 'budget', label: 'Budget' },
    ],
  },
  {
    id: 'build',
    label: 'Build',
    children: [
      { id: 'demolition', label: 'Demolition' },
      { id: 'plumbing', label: 'Plumbing' },
      { id: 'electrical', label: 'Electrical' },
      { id: 'cabinets', label: 'Cabinets' },
    ],
  },
  {
    id: 'finish',
    label: 'Finish',
    children: [
      { id: 'painting', label: 'Painting' },
      { id: 'handover', label: 'Handover' },
    ],
  },
];

const planItems: TimelineItem[] = [
  {
    id: 'measure',
    rowId: 'survey',
    label: 'Measure rooms',
    start: '2026-02-23',
    end: '2026-02-27',
    progress: 1,
    tone: 'success',
  },
  {
    id: 'quotes',
    rowId: 'budget',
    label: 'Collect quotes',
    start: '2026-03-02',
    end: '2026-03-10',
    progress: 0.6,
  },
  {
    id: 'approve',
    rowId: 'budget',
    label: 'Budget approved',
    start: '2026-03-12',
    kind: 'milestone',
    isReadOnly: true,
  },
  {
    id: 'strip',
    rowId: 'demolition',
    label: 'Strip kitchen',
    start: '2026-03-16',
    end: '2026-03-20',
    progress: 0.2,
  },
  {
    id: 'pipes',
    rowId: 'plumbing',
    label: 'New pipes',
    start: '2026-03-23',
    end: '2026-04-01',
    tone: 'info',
  },
  {
    id: 'wiring',
    rowId: 'electrical',
    label: 'Rewire',
    start: '2026-03-19',
    end: '2026-03-27',
    tone: 'warning',
  },
  { id: 'fit', rowId: 'cabinets', label: 'Fit cabinets', start: '2026-04-02', end: '2026-04-10' },
  { id: 'paint', rowId: 'painting', label: 'Paint walls', start: '2026-04-13', end: '2026-04-17' },
  {
    id: 'keys',
    rowId: 'handover',
    label: 'Hand over keys',
    start: '2026-04-20',
    kind: 'milestone',
    tone: 'success',
  },
];

const planDependencies = [
  { from: 'measure', to: 'quotes' },
  { from: 'quotes', to: 'approve' },
  { from: 'approve', to: 'strip' },
  { from: 'strip', to: 'pipes' },
  { from: 'strip', to: 'wiring' },
  { from: 'pipes', to: 'fit' },
  { from: 'wiring', to: 'fit' },
  { from: 'fit', to: 'paint' },
  { from: 'paint', to: 'keys' },
];

const scaleOptions = (['day', 'week', 'month', 'quarter'] as const).map((value) => ({
  value,
  label: requireDefined(value[0]).toUpperCase() + value.slice(1),
}));

const viewOptions = [
  { value: 'chart', label: 'Chart' },
  { value: 'table', label: 'Table' },
];

const toolbar: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 };
const cellBox: CSSProperties = { width: 520 };

const days = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });

function applyChange(items: readonly TimelineItem[], change: TimelineItemChange) {
  return items.map((item) => (item.id === change.id ? { ...item, ...change } : item));
}

/** A timeline that applies its own changes, as an owner does. */
function OwnedTimeline({
  initialItems,
  ...props
}: Omit<TimelineProps, 'items'> & { initialItems: readonly TimelineItem[] }) {
  const [items, setItems] = useState(initialItems);
  return (
    <Timeline
      {...props}
      items={items}
      onItemChange={(change) => setItems((current) => applyChange(current, change))}
    />
  );
}

function ZoomCell({ scale, mode }: { scale: TimelineScale; mode: string }) {
  const props = {
    'aria-label': `Dinner plan by ${scale}`,
    rows: smallRows,
    dependencies: smallDependencies,
    scale,
    range: ranges[scale],
    today,
  };
  return (
    <div style={cellBox}>
      {mode === 'editable' ? (
        <OwnedTimeline {...props} initialItems={smallItems} />
      ) : (
        <Timeline {...props} items={smallItems} />
      )}
    </div>
  );
}

/** The dinner plan in a right-to-left locale: time runs from the right, keys and drags follow. */
function RightToLeftCell() {
  return (
    <div dir="rtl" style={cellBox} data-lab-demo="rtl">
      <UiProvider locale="he-IL">
        <OwnedTimeline
          aria-label="Dinner plan, right to left"
          rows={smallRows}
          dependencies={smallDependencies}
          scale="day"
          range={ranges.day}
          today={today}
          initialItems={smallItems}
        />
      </UiProvider>
    </div>
  );
}

function StateCell({ state }: { state: string }) {
  const props = {
    'aria-label': `Dinner plan, ${state}`,
    rows: [{ id: 'all', label: 'Dinner', children: smallRows }],
    items: state === 'no items' ? [] : smallItems,
    dependencies: smallDependencies,
    range: ranges.week,
    today,
  };
  return (
    <div style={cellBox}>
      <Timeline
        {...props}
        selectionMode="single"
        defaultSelectedKeys={state === 'selected' ? ['2'] : []}
        defaultExpandedKeys={state === 'collapsed' ? [] : undefined}
      />
    </div>
  );
}

/** The full plan: zoom and view switches, editing, selection and a record of the last change. */
function PlanDemo() {
  const [items, setItems] = useState(planItems);
  const [scale, setScale] = useState<TimelineScale>('week');
  const [view, setView] = useState<TimelineView>('chart');
  const [selected, setSelected] = useState<Set<Key>>(new Set());
  const [lastChange, setLastChange] = useState('None yet');
  const [isLocked, setLocked] = useState(false);
  const onItemChange = (change: TimelineItemChange) => {
    setItems((current) => applyChange(current, change));
    const name = items.find((item) => item.id === change.id)?.label;
    const span = `${days.format(Date.parse(change.start))} to ${days.format(Date.parse(change.end))}`;
    setLastChange(`${name}: ${span}`);
  };
  return (
    <div data-lab-demo="plan">
      <div style={toolbar}>
        <SegmentedChoice
          aria-label="Zoom"
          options={scaleOptions}
          value={scale}
          onChange={(value) => setScale((value as TimelineScale | null) ?? 'week')}
          size="sm"
          sizing="content"
        />
        <SegmentedChoice
          aria-label="View"
          options={viewOptions}
          value={view}
          onChange={(value) => setView((value as TimelineView | null) ?? 'chart')}
          size="sm"
          sizing="content"
        />
        <Button size="sm" onPress={() => setLocked((current) => !current)}>
          {isLocked ? 'Unlock timeline' : 'Lock timeline'}
        </Button>
      </div>
      <Timeline
        aria-label="Kitchen renovation"
        rows={planRows}
        items={items}
        dependencies={planDependencies}
        scale={scale}
        view={view}
        today={today}
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={(keys) =>
          setSelected(new Set(keys === 'all' ? items.map((item) => item.id) : keys))
        }
        onItemChange={isLocked ? undefined : onItemChange}
      />
      <p data-lab-demo="last-change">Last change: {lastChange}</p>
      <p data-lab-demo="selection">Selected: {selected.size}</p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Zoom levels"
      description="Days, weeks, months and quarters over the same plan, with progress, a milestone, dependencies and the today marker. Editable timelines move and resize their bars; fixed ones do not. The rows and items include numeric and text keys with the same spelling."
    >
      <StateMatrix
        axes={{ scale: ['day', 'week', 'month', 'quarter'], mode: ['editable', 'fixed'] }}
        render={({ mode, scale }) => <ZoomCell mode={mode} scale={scale} />}
      />
    </LabSection>
    <LabSection
      title="States"
      description="A selected bar, a collapsed group and a timeline with no items. The stew starts before the chopping ends, so their dependency is in conflict."
    >
      <StateMatrix
        axes={{ state: ['selected', 'collapsed', 'no items'] }}
        render={({ state }) => <StateCell state={state} />}
      />
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left locale time runs from the right edge, the row names pin to the right, dependencies mirror, and Left Arrow or a drag to the left moves an item later."
    >
      <RightToLeftCell />
    </LabSection>
    <LabSection
      title="Project plan"
      description="Nested groups that collapse, a locked milestone, drag and keyboard editing (arrows move by the zoom unit, Shift and arrows change the end), multiple selection, and the table view of the same items. Dependencies name their predecessors even when those rows are hidden. Cancelling a drag discards its draft dates, and so does switching to the table or collapsing the bar's group while dragging."
    >
      <PlanDemo />
    </LabSection>
  </>,
);
