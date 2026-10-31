import {
  CalendarGlyph,
  CheckGlyph,
  EditGlyph,
  FolderGlyph,
  MoreVerticalGlyph,
  SearchGlyph,
} from '../../src/core/glyphs.js';
import { useState, type CSSProperties } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import { DropdownMenu } from '../../src/components/dropdown-menu/dropdown-menu.js';
import {
  Board,
  applyBoardMove,
  applyColumnMove,
  type BoardColumn,
  type BoardLane,
  type BoardMove,
} from '../../src/components/board/index.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { TypedBoard } from './collection-identity-cases.js';

interface Task {
  id: string;
  title: string;
  column: string;
  lane: string;
  tag?: 'Urgent' | 'Blocked';
}

const columns: BoardColumn[] = [
  { id: 'todo', title: 'To do', icon: CalendarGlyph },
  { id: 'doing', title: 'Doing', limit: 2, icon: EditGlyph },
  { id: 'review', title: 'Review', limit: 3, icon: SearchGlyph },
  { id: 'done', title: 'Done', icon: CheckGlyph },
];

const lanes: BoardLane[] = [
  { id: 'garden', title: 'Garden', icon: FolderGlyph },
  { id: 'kitchen', title: 'Kitchen', icon: FolderGlyph },
];

const tasks: Task[] = [
  { id: 'seeds', title: 'Order seeds', column: 'todo', lane: 'garden', tag: 'Urgent' },
  { id: 'fence', title: 'Repaint the fence', column: 'todo', lane: 'garden' },
  { id: 'tiles', title: 'Replace the cracked tiles', column: 'todo', lane: 'kitchen' },
  { id: 'hedge', title: 'Trim the hedge', column: 'doing', lane: 'garden' },
  { id: 'shelf', title: 'Fit a spice shelf', column: 'doing', lane: 'kitchen', tag: 'Blocked' },
  { id: 'tap', title: 'Fix the dripping tap', column: 'review', lane: 'kitchen' },
  { id: 'pond', title: 'Clean the pond', column: 'done', lane: 'garden' },
];

const frame: CSSProperties = { maxWidth: '100%', overflowX: 'auto' };

const place = (task: Task, cell: { column: Key; lane: Key | null }): Task => ({
  ...task,
  column: String(cell.column),
  lane: cell.lane === null ? task.lane : String(cell.lane),
});

function TaskCard({ task }: { task: Task }) {
  return (
    <>
      <span>{task.title}</span>
      {task.tag ? (
        <Badge tone={task.tag === 'Urgent' ? 'danger' : 'warning'} size="sm">
          {task.tag}
        </Badge>
      ) : null}
    </>
  );
}

const renderCard = (task: Task) => <TaskCard task={task} />;
const getColumn = (task: Task) => task.column;
const getLane = (task: Task) => task.lane;
const getTextValue = (task: Task) => task.title;

const states = {
  cards: { items: tasks, columns: columns.slice(0, 2) },
  empty: { items: [], columns: columns.slice(0, 2) },
  'over limit': {
    items: tasks.map((task) => ({
      ...task,
      column: task.column === 'todo' ? 'doing' : task.column,
    })),
    columns: columns.slice(1, 2),
  },
  collapsed: { items: tasks, columns: columns.slice(0, 2) },
  'collapsed long title': {
    items: tasks,
    columns: [
      columns[0] as BoardColumn,
      { id: 'doing', title: 'Waiting for parts from the hardware store', limit: 2 },
    ],
  },
} as const;

const columnMenu = [
  { id: 'sort', label: 'Sort by title' },
  { id: 'clear', label: 'Clear column' },
];

/** Applies a column menu action to the owner's tasks: sorts the column's cards or removes them. */
function applyColumnAction(items: readonly Task[], column: BoardColumn, action: Key): Task[] {
  if (action === 'clear') return items.filter((task) => task.column !== column.id);
  const sorted = items
    .filter((task) => task.column === column.id)
    .sort((a, b) => a.title.localeCompare(b.title));
  return items.map((task) => (task.column === column.id ? (sorted.shift() as Task) : task));
}

function ColumnActions({
  column,
  onAction,
}: {
  column: BoardColumn;
  onAction: (key: Key) => void;
}) {
  return (
    <DropdownMenu
      label={`${column.title} actions`}
      iconOnly
      icon={MoreVerticalGlyph}
      size="sm"
      placement="bottom end"
      items={columnMenu}
      onAction={onAction}
    />
  );
}

function describeMove(move: BoardMove, items: readonly Task[]): string {
  const title = (key: Key | null) => items.find((task) => task.id === key)?.title ?? '';
  const column = columns.find((entry) => entry.id === move.column)?.title ?? '';
  const where =
    move.targetKey === null ? 'empty cell' : `${move.position} ${title(move.targetKey)}`;
  return `Last move: ${title(move.key)} to ${column}, ${where}`;
}

function MovingBoard() {
  const [items, setItems] = useState(tasks);
  const [order, setOrder] = useState(columns);
  const [output, setOutput] = useState('No move yet');
  return (
    <div style={frame} data-lab-demo="moves">
      <Board
        aria-label="Chores"
        columns={order}
        items={items}
        getColumn={getColumn}
        getTextValue={getTextValue}
        renderCard={renderCard}
        onMove={(move) => {
          setOutput(describeMove(move, items));
          setItems(applyBoardMove(items, move, place));
        }}
        onColumnMove={(move) => {
          setOutput(
            `Last column move: ${String(move.key)} ${move.position} ${String(move.targetKey)}`,
          );
          setOrder(applyColumnMove(order, move));
        }}
        onAction={(key) => setOutput(`Opened ${String(key)}`)}
        renderColumnActions={(column) => (
          <ColumnActions
            column={column}
            onAction={(action) => {
              setItems(applyColumnAction(items, column, action));
              setOutput(`${action === 'clear' ? 'Cleared' : 'Sorted'} ${column.title}`);
            }}
          />
        )}
        onAddCard={({ column }) => {
          const added = items.length + 1;
          const task = {
            id: `new-${added}`,
            title: `New chore ${added}`,
            column: String(column),
            lane: 'garden',
          };
          setItems([...items, task]);
          setOutput(`Added ${task.title}`);
        }}
      />
      <output data-lab-output>{output}</output>
    </div>
  );
}

function LaneBoard() {
  const [items, setItems] = useState(tasks);
  return (
    <div style={frame} data-lab-demo="lanes">
      <Board
        aria-label="Chores by area"
        columns={columns}
        lanes={lanes}
        items={items}
        getColumn={getColumn}
        getLane={getLane}
        getTextValue={getTextValue}
        renderCard={renderCard}
        persistKey="lab-board-lanes"
        onMove={(move) => setItems(applyBoardMove(items, move, place))}
        renderColumnActions={(column) => (
          <ColumnActions
            column={column}
            onAction={(action) => setItems(applyColumnAction(items, column, action))}
          />
        )}
      />
    </div>
  );
}

const longColumn: Task[] = Array.from({ length: 500 }, (_, index) => ({
  id: `item-${index + 1}`,
  title: `Inventory item ${index + 1}`,
  column: index % 5 === 0 ? 'done' : 'todo',
  lane: 'garden',
}));

function LongBoard() {
  const [items, setItems] = useState(longColumn);
  return (
    <div style={frame} data-lab-demo="virtualized">
      <Board
        aria-label="Inventory"
        columns={[columns[0] as BoardColumn, columns[3] as BoardColumn]}
        items={items}
        getColumn={getColumn}
        getTextValue={getTextValue}
        renderCard={renderCard}
        virtualized
        onMove={(move) => setItems(applyBoardMove(items, move, place))}
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Columns with cards and drag handles, empty cells, a column over its limit, and a collapsed column, whose long title is cut rather than making the header row taller."
    >
      <StateMatrix
        axes={{ state: Object.keys(states) as Array<keyof typeof states> }}
        render={({ state }) => (
          <div style={frame}>
            <Board
              aria-label={`Chores, ${state}`}
              columns={states[state].columns}
              items={states[state].items}
              getColumn={getColumn}
              getTextValue={getTextValue}
              renderCard={renderCard}
              defaultCollapsedColumns={state.startsWith('collapsed') ? ['doing'] : []}
              onMove={() => {}}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left page the columns run from the right, and a column move marks the side of the target column it lands on."
    >
      <div dir="rtl" style={frame} data-lab-demo="rtl">
        <Board
          aria-label="Chores, right to left"
          columns={columns}
          items={tasks}
          getColumn={getColumn}
          getTextValue={getTextValue}
          renderCard={renderCard}
          onMove={() => {}}
        />
      </div>
    </LabSection>
    <LabSection
      title="Moving cards and columns"
      description="Drag cards within and between columns, or press Alt+Arrow keys on a card; drag a column header or press Alt+ArrowLeft and Alt+ArrowRight on its handle. Focus follows a moved item until you act elsewhere. Doing holds at most two cards. Every cell adds cards, and each column header ends with a menu that sorts or clears the column."
    >
      <MovingBoard />
    </LabSection>
    <LabSection
      title="Lanes"
      description="The columns repeated per area, with icons before the column and lane titles. Lanes and columns collapse, and the board remembers which ones through the provider storage."
    >
      <LaneBoard />
    </LabSection>
    <LabSection
      title="Long columns"
      description="Five hundred cards, virtualized: each cell renders only the cards in view."
    >
      <LongBoard />
    </LabSection>
    <LabSection
      title="Distinct board keys"
      description="Numeric and text keys identify separate cards and columns; keyboard moves keep focus on the item that moved."
    >
      <TypedBoard />
    </LabSection>
  </>,
);
