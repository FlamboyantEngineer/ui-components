import { useState } from 'react';
import { Board, type BoardColumn, type BoardLane } from '../../src/components/board/index.js';
import { Button } from '../../src/components/button/button.js';
import { CalendarGlyph, CheckGlyph, EditGlyph, FolderGlyph } from '../../src/core/glyphs.js';
import type { Key } from '../../src/core/props.js';
import { useUiStorage } from '../../src/core/provider.js';

interface Chore {
  id: string;
  title: string;
  column: string;
  lane: string;
}

const columns: BoardColumn[] = [
  { id: 'todo', title: 'To do', icon: CalendarGlyph },
  { id: 'doing', title: 'Doing', icon: EditGlyph },
  { id: 'done', title: 'Done', icon: CheckGlyph },
];

const lanes: BoardLane[] = [
  { id: 'garden', title: 'Garden', icon: FolderGlyph },
  { id: 'kitchen', title: 'Kitchen', icon: FolderGlyph },
];

const chores: Chore[] = [
  { id: 'seeds', title: 'Order seeds', column: 'todo', lane: 'garden' },
  { id: 'tiles', title: 'Replace the cracked tiles', column: 'todo', lane: 'kitchen' },
  { id: 'hedge', title: 'Trim the hedge', column: 'doing', lane: 'garden' },
  { id: 'tap', title: 'Fix the dripping tap', column: 'done', lane: 'kitchen' },
];

const boardProps = {
  columns,
  lanes,
  items: chores,
  getColumn: (chore: Chore) => chore.column,
  getLane: (chore: Chore) => chore.lane,
  getTextValue: (chore: Chore) => chore.title,
  renderCard: (chore: Chore) => <span>{chore.title}</span>,
};

function formatKeys(keys: Iterable<Key>): string {
  return [...keys].map(String).join(', ') || 'none';
}

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

/** What the provider storage holds under a board's `persistKey`. */
function Stored({ name, persistKey }: { name: string; persistKey: string }) {
  const storage = useUiStorage();
  const read = (part: string) => storage.getItem(`${persistKey}:${part}`) ?? 'nothing';
  return <Output name={name} value={`columns ${read('columns')}; lanes ${read('lanes')}`} />;
}

const controlledKey = 'lab-board-controlled';

/**
 * Collapsed columns and lanes owned by the host: the buttons collapse and reopen them from outside,
 * the board's own toggles report back, and the controlled sets win over `persistKey`, which keeps
 * nothing for them.
 */
export function ControlledCollapse() {
  const [collapsedColumns, setColumns] = useState<Set<Key>>(new Set(['doing']));
  const [collapsedLanes, setLanes] = useState<Set<Key>>(new Set());
  return (
    <div data-lab-demo="controlled-collapse">
      <p>
        <Button size="sm" variant="secondary" onPress={() => setColumns(new Set(['done']))}>
          Collapse Done only
        </Button>{' '}
        <Button size="sm" variant="secondary" onPress={() => setColumns(new Set())}>
          Reopen every column
        </Button>{' '}
        <Button size="sm" variant="secondary" onPress={() => setLanes(new Set(['kitchen']))}>
          Collapse the Kitchen lane
        </Button>{' '}
        <Button size="sm" variant="secondary" onPress={() => setLanes(new Set())}>
          Reopen every lane
        </Button>
      </p>
      <Board
        aria-label="Chores, collapse owned by the host"
        {...boardProps}
        collapsedColumns={collapsedColumns}
        onCollapsedColumnsChange={setColumns}
        collapsedLanes={collapsedLanes}
        onCollapsedLanesChange={setLanes}
        persistKey={controlledKey}
      />
      <Output name="collapsed-columns" value={formatKeys(collapsedColumns)} />
      <Output name="collapsed-lanes" value={formatKeys(collapsedLanes)} />
      <Stored name="controlled-stored" persistKey={controlledKey} />
    </div>
  );
}

const defaultKey = 'lab-board-default-lanes';

/**
 * The Kitchen lane starts collapsed (`defaultCollapsedLanes`) and the board owns it from there,
 * remembering each change under `persistKey`, which wins over the default on the next visit.
 */
export function DefaultCollapsedLanes() {
  const [changes, setChanges] = useState<string[]>([]);
  const storage = useUiStorage();
  return (
    <div data-lab-demo="default-lanes">
      <Board
        aria-label="Chores, Kitchen collapsed at first"
        {...boardProps}
        defaultCollapsedLanes={['kitchen']}
        onCollapsedLanesChange={(keys) => setChanges([...changes, formatKeys(keys)])}
        persistKey={defaultKey}
      />
      <Output name="lane-changes" value={changes.join(' → ') || 'No change yet'} />
      <Stored name="default-stored" persistKey={defaultKey} />
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          storage.removeItem(`${defaultKey}:columns`);
          storage.removeItem(`${defaultKey}:lanes`);
          setChanges([...changes, 'stored sets cleared']);
        }}
      >
        Forget the stored sets
      </Button>
    </div>
  );
}
