import { useState } from 'react';
import { Checkbox } from '../../src/components/checkbox/checkbox.js';
import {
  Timeline,
  type TimelineItem,
  type TimelineItemChange,
  type TimelineRow,
  type TimelineRowColumnEntry,
} from '../../src/components/timeline/index.js';

const rows: TimelineRow[] = [
  {
    id: 'site',
    label: 'Site work',
    children: [
      { id: 'beds', label: 'Raised beds along the south fence' },
      { id: 'paths', label: 'Paths' },
      { id: 'pond', label: 'Pond' },
    ],
  },
  { id: 'opening', label: 'Opening' },
];

const initialItems: TimelineItem[] = [
  { id: 'dig', rowId: 'beds', label: 'Dig beds', start: '2026-03-02', end: '2026-03-06' },
  { id: 'sow', rowId: 'beds', label: 'Sow seeds', start: '2026-03-12', end: '2026-03-16' },
  { id: 'gravel', rowId: 'paths', label: 'Lay gravel', start: '2026-03-09', end: '2026-03-13' },
  { id: 'open', rowId: 'opening', label: 'Open day', start: '2026-03-21', kind: 'milestone' },
];

const dependencies = [
  { from: 'dig', to: 'gravel' },
  { from: 'gravel', to: 'open' },
];

/** A host property: how far the row's one item has come, read from its progress. */
const status: TimelineRowColumnEntry = {
  id: 'status',
  header: 'Status',
  renderValue: ({ items }) => {
    if (items.length !== 1) return null;
    return items[0]?.progress === 1 ? 'Done' : 'Open';
  },
};

const choices = [
  { id: 'duration', label: 'Duration', column: 'duration' },
  { id: 'dependencies', label: 'Dependencies', column: 'dependencies' },
  { id: 'status', label: 'Status', column: status },
] as const;

/**
 * Row properties the reader turns on and off: built-in duration and dependencies and a host status
 * column, in that order, over a group, a row of two items, a row of one, an empty row and a
 * milestone. Moving an item updates its row's values.
 */
export function RowPropertiesDemo() {
  const [items, setItems] = useState(initialItems);
  const [shown, setShown] = useState<readonly string[]>(['duration', 'dependencies']);
  const toggle = (id: string, isOn: boolean) =>
    setShown((current) => (isOn ? [...current, id] : current.filter((entry) => entry !== id)));
  const columns = choices.filter((choice) => shown.includes(choice.id)).map((c) => c.column);
  const onItemChange = (change: TimelineItemChange) =>
    setItems((current) =>
      current.map((item) => (item.id === change.id ? { ...item, ...change } : item)),
    );
  return (
    <div data-lab-demo="row-properties">
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        {choices.map((choice) => (
          <Checkbox
            key={choice.id}
            isSelected={shown.includes(choice.id)}
            onChange={(isOn) => toggle(choice.id, isOn)}
          >
            {choice.label}
          </Checkbox>
        ))}
      </div>
      <Timeline
        aria-label="Garden works"
        rows={rows}
        items={items}
        dependencies={dependencies}
        scale="day"
        range={{ start: '2026-03-01', end: '2026-03-24' }}
        today="2026-03-05"
        rowColumns={columns}
        onItemChange={onItemChange}
      />
    </div>
  );
}
