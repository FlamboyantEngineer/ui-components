import { type CSSProperties, type ReactNode, useState } from 'react';
import { Badge } from '../../src/components/badge/badge.js';
import {
  applyBoardMove,
  applyColumnMove,
  Board,
  type BoardCardState,
  type BoardColumn,
  type BoardLane,
  type BoardMove,
} from '../../src/components/board/index.js';
import { Button } from '../../src/components/button/button.js';
import { DropdownMenu } from '../../src/components/dropdown-menu/dropdown-menu.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import {
  CalendarGlyph,
  CheckGlyph,
  EditGlyph,
  FolderGlyph,
  MoreVerticalGlyph,
  SearchGlyph,
} from '../../src/core/glyphs.js';
import type { Key } from '../../src/core/props.js';
import { ControlledCollapse, DefaultCollapsedLanes } from './board-collapse-cases.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { TypedBoard } from './collection-identity-cases.js';
import { RowMenu } from './row-menu.js';

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

const frame: CSSProperties = { maxWidth: '100%' };

const place = (task: Task, cell: { column: Key; lane: Key | null }): Task => ({
  ...task,
  column: String(cell.column),
  lane: cell.lane === null ? task.lane : String(cell.lane),
});

/** A card's title and tag; in a collapsed column, the title alone, which the stylesheet clamps. */
function TaskCard({ task, isColumnCollapsed }: { task: Task } & BoardCardState) {
  if (isColumnCollapsed) return <span>{task.title}</span>;
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

const renderCard = (task: Task, state: BoardCardState) => <TaskCard task={task} {...state} />;
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
  const [arranging, setArranging] = useState(true);
  return (
    <div style={frame} data-lab-demo="moves">
      <Button size="sm" isSelected={arranging} onPress={() => setArranging(!arranging)}>
        Arrange
      </Button>
      <Board
        aria-label="Chores"
        columns={order}
        items={items}
        getColumn={getColumn}
        getTextValue={getTextValue}
        renderCard={renderCard}
        onMove={
          arranging
            ? (move) => {
                setOutput(describeMove(move, items));
                setItems(applyBoardMove(items, move, place));
              }
            : undefined
        }
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
  const [virtualized, setVirtualized] = useState(true);
  return (
    <div style={frame} data-lab-demo="virtualized">
      <Button size="sm" isSelected={virtualized} onPress={() => setVirtualized(!virtualized)}>
        Virtualize
      </Button>
      <Board
        aria-label="Inventory"
        columns={[columns[0] as BoardColumn, columns[3] as BoardColumn]}
        items={items}
        getColumn={getColumn}
        getTextValue={getTextValue}
        renderCard={renderCard}
        virtualized={virtualized}
        onMove={(move) => setItems(applyBoardMove(items, move, place))}
      />
    </div>
  );
}

interface Step {
  id: string;
  title: string;
  column: string;
}

const stepColumns: BoardColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'done', title: 'Done' },
];

const placeStep = (step: Step, cell: { column: Key }): Step => ({
  ...step,
  column: String(cell.column),
});

/** A board that applies its own moves and reports the last one. */
function StepBoard(props: {
  label: string;
  steps: Step[];
  renderStep?: (step: Step) => ReactNode;
}) {
  const { label, renderStep } = props;
  const [steps, setSteps] = useState(props.steps);
  const [output, setOutput] = useState(`${label}: no move yet`);
  return (
    <>
      <Board
        aria-label={label}
        columns={stepColumns}
        items={steps}
        getColumn={(step) => step.column}
        getTextValue={(step) => step.title}
        renderCard={renderStep ?? ((step) => step.title)}
        onMove={(move) => {
          setOutput(`${label}: moved ${String(move.key)} to ${String(move.column)}`);
          setSteps(applyBoardMove(steps, move, placeStep));
        }}
      />
      <output data-lab-output>{output}</output>
    </>
  );
}

/** A board whose first card draws a board of its own (both use the keys a and b) and whose second has a field. */
/** Cards with a menu of their own, which returns focus to its button as it closes. */
function MenuBoard() {
  const [output, setOutput] = useState('none');
  return (
    <div style={frame} data-lab-demo="card-menus">
      <Board
        aria-label="Errands"
        columns={columns.slice(0, 2)}
        items={tasks}
        getColumn={getColumn}
        getTextValue={getTextValue}
        renderCard={(task) => (
          <>
            <span>{task.title}</span>
            <RowMenu
              label={`More for ${task.title}`}
              onAction={(key) => setOutput(`${key} ${task.id}`)}
            />
          </>
        )}
      />
      <p>
        Menu: <output data-lab-output>{output}</output>
      </p>
    </div>
  );
}

/** Cards with a note field, moved by their drag handles only. */
function HandleBoard() {
  const [items, setItems] = useState(tasks.filter((task) => task.lane === 'garden'));
  return (
    <div style={frame} data-lab-demo="handle-drag">
      <Board
        aria-label="Garden notes"
        columns={columns.slice(0, 2)}
        items={items}
        getColumn={getColumn}
        getTextValue={getTextValue}
        dragTrigger="handle"
        renderCard={(task) => (
          <TextField label={`Note for ${task.title}`} size="sm" defaultValue={task.title} />
        )}
        onMove={(move) => setItems(applyBoardMove(items, move, place))}
      />
    </div>
  );
}

function NestedBoards() {
  return (
    <div style={frame} data-lab-demo="nested">
      <StepBoard
        label="Rooms"
        steps={[
          { id: 'a', title: 'Paint the hall', column: 'todo' },
          { id: 'b', title: 'Wash the windows', column: 'todo' },
        ]}
        renderStep={(step) =>
          step.id === 'a' ? (
            <StepBoard
              label="Hall steps"
              steps={[
                { id: 'a', title: 'Sand the walls', column: 'todo' },
                { id: 'b', title: 'Prime the walls', column: 'todo' },
              ]}
            />
          ) : (
            <>
              {step.title}
              <input aria-label={`Notes for ${step.title}`} defaultValue="Use the soft cloth" />
            </>
          )
        }
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Columns with cards and drag handles, each card as wide as its column header, scrolling sideways under an overlay thumb when the page is narrow, empty cells, a column over its limit, and collapsed columns: one compressed to its icon, and one without an icon that keeps its chevron. A collapsed toggle shows its column's title and count in a tooltip."
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
      description="Drag cards within and between columns, or press Alt+Arrow keys on a card; drag a column header or press Alt+ArrowLeft and Alt+ArrowRight on its handle, or on the toggle of a collapsed column. Focus follows a moved item until you act elsewhere. Doing holds at most two cards. Every cell adds cards, and each column header ends with a menu that sorts or clears the column. Arrange turns card moves off and on; the cards stay as they are."
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
      title="Collapse owned by the host"
      description="collapsedColumns and collapsedLanes come from the host: Doing starts collapsed, the buttons collapse and reopen columns and lanes from outside, and the board's own toggles report through onCollapsedColumnsChange and onCollapsedLanesChange, shown below. The controlled sets win over persistKey, so the stored line stays empty."
    >
      <ControlledCollapse />
    </LabSection>
    <LabSection
      title="Lanes collapsed at first"
      description="defaultCollapsedLanes starts the Kitchen lane collapsed; from there the board owns it, reports each change and remembers it under persistKey, and the stored set wins over the default when the page is opened again. Forget the stored sets, then reload, to start from the default once more."
    >
      <DefaultCollapsedLanes />
    </LabSection>
    <LabSection
      title="Long columns"
      description="Five hundred cards, virtualized: each cell renders only the cards in view and scrolls under an overlay thumb. Virtualize turns virtualization off and on; the cards in view, their focus and their state stay as they are. The wheel scrolls a list while it can move, and the page elsewhere over the board."
    >
      <LongBoard />
    </LabSection>
    <LabSection
      title="Card menus"
      description="Each card holds a menu button. Enter or Space on the button opens its menu; Escape or an item closes it and returns focus to the button, not to the card."
    >
      <MenuBoard />
    </LabSection>
    <LabSection
      title="Distinct board keys"
      description="Numeric and text keys identify separate cards and columns; keyboard moves keep focus on the item that moved."
    >
      <TypedBoard />
    </LabSection>
    <LabSection
      title="Nested boards and fields"
      description="A card that draws a board of its own, kept inside the card: it scrolls its own columns sideways, and collapsing the outer column restyles only the outer cards. A card with a notes field. Alt+Arrow keys on a card move it on the board it belongs to, even where both boards use the same card keys. In the notes field, the arrow keys, Alt+Arrow keys and typing stay with the field."
    >
      <NestedBoards />
    </LabSection>
    <LabSection
      title="Drag by handle"
      description="Cards that hold a note field move by their drag handles only: a press or drag in a field selects its text and never drags the card."
    >
      <HandleBoard />
    </LabSection>
  </>,
);
