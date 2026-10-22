import { useState, type CSSProperties } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
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

interface Task {
  id: string;
  title: string;
  column: string;
  lane: string;
  tag?: 'Urgent' | 'Blocked';
}

const columns: BoardColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'Doing', limit: 2 },
  { id: 'review', title: 'Review', limit: 3 },
  { id: 'done', title: 'Done' },
];

const lanes: BoardLane[] = [
  { id: 'garden', title: 'Garden' },
  { id: 'kitchen', title: 'Kitchen' },
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
} as const;

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
  let added = items.length;
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
        onAddCard={({ column }) => {
          added += 1;
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
      description="Columns with cards and drag handles, empty cells, a column over its limit and a collapsed column."
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
              defaultCollapsedColumns={state === 'collapsed' ? ['doing'] : []}
              onMove={() => {}}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Moving cards and columns"
      description="Drag cards within and between columns, or press Alt+Arrow keys on a card; drag a column header or press Alt+ArrowLeft and Alt+ArrowRight on its handle. Focus follows a moved item until you act elsewhere. Doing holds at most two cards. Every cell adds cards."
    >
      <MovingBoard />
    </LabSection>
    <LabSection
      title="Lanes"
      description="The columns repeated per area. Lanes and columns collapse, and the board remembers which ones through the provider storage."
    >
      <LaneBoard />
    </LabSection>
    <LabSection
      title="Long columns"
      description="Five hundred cards, virtualized: each cell renders only the cards in view."
    >
      <LongBoard />
    </LabSection>
  </>,
);
