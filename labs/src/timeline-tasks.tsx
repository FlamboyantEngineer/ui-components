import { useState } from 'react';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import {
  Timeline,
  TimelineItemEditor,
  type TimelineItem,
  type TimelineRow,
  type TimelineView,
} from '../../src/components/timeline/index.js';
import type { MenuEntry } from '../../src/components/menu/menu.js';
import type { Key } from '../../src/core/props.js';

const gardenRows: TimelineRow[] = [
  { id: 'beds', label: 'Beds' },
  { id: 'paths', label: 'Paths' },
  { id: 'opening', label: 'Opening' },
];

const gardenItems: TimelineItem[] = [
  {
    id: 'dig',
    rowId: 'beds',
    label: 'Dig beds',
    start: '2026-03-02',
    end: '2026-03-06',
    progress: 0.5,
  },
  { id: 'sow', rowId: 'beds', label: 'Sow seeds', start: '2026-03-12', end: '2026-03-16' },
  {
    id: 'gravel',
    rowId: 'paths',
    label: 'Lay gravel',
    start: '2026-03-04',
    end: '2026-03-11',
    tone: 'info',
    isReadOnly: true,
  },
  { id: 'open', rowId: 'opening', label: 'Open day', start: '2026-03-21', kind: 'milestone' },
];

const viewOptions = [
  { value: 'chart', label: 'Chart' },
  { value: 'table', label: 'Table' },
];

/** The commands of an item's menu: a read-only item only shows its details. */
function itemMenu(item: TimelineItem): MenuEntry[] {
  if (item.isReadOnly) return [{ id: 'edit', label: 'View details' }];
  const entries: MenuEntry[] = [{ id: 'edit', label: 'Edit' }];
  if (item.kind !== 'milestone') entries.push({ id: 'complete', label: 'Mark complete' });
  return [...entries, { id: 'remove', label: 'Remove' }];
}

function applyEdit(items: readonly TimelineItem[], edit: Partial<TimelineItem> & { id: Key }) {
  return items.map((item) => (item.id === edit.id ? { ...item, ...edit } : item));
}

/**
 * Items with context menus: Edit opens the item editor, whose Save the owner applies by id, and
 * the chart and the table show the same owned items.
 */
export function TaskEditingDemo() {
  const [items, setItems] = useState(gardenItems);
  const [view, setView] = useState<TimelineView>('chart');
  const [editingId, setEditingId] = useState<Key | null>(null);
  const [lastAction, setLastAction] = useState('None yet');
  const editing = items.find((item) => item.id === editingId) ?? null;
  const onAction = (key: Key, item: TimelineItem) => {
    setLastAction(`${String(key)} ${item.label}`);
    if (key === 'edit') setEditingId(item.id);
    if (key === 'complete') {
      setItems((current) => applyEdit(current, { id: item.id, progress: 1 }));
    }
    if (key === 'remove') setItems((current) => current.filter((entry) => entry.id !== item.id));
  };
  return (
    <div data-lab-demo="task-menus">
      <div style={{ marginBottom: 12 }}>
        <SegmentedChoice
          aria-label="Task view"
          options={viewOptions}
          value={view}
          onChange={(value) => setView((value as TimelineView | null) ?? 'chart')}
          size="sm"
          sizing="content"
        />
      </div>
      <Timeline
        aria-label="Garden plan"
        rows={gardenRows}
        items={items}
        scale="day"
        range={{ start: '2026-03-01', end: '2026-03-24' }}
        today="2026-03-05"
        view={view}
        itemMenu={itemMenu}
        onItemMenuAction={onAction}
        onItemChange={(change) => setItems((current) => applyEdit(current, change))}
      />
      <TimelineItemEditor
        item={editing}
        onSave={(edit) => {
          setItems((current) => applyEdit(current, edit));
          setLastAction(`saved ${edit.label}`);
        }}
        onClose={() => setEditingId(null)}
      />
      <p data-lab-log="task-menus">Last action: {lastAction}</p>
    </div>
  );
}
