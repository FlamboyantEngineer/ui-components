import type { ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Button } from '../button/button.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import type {
  DiffBlock,
  DiffLine,
  FoldRow,
  SplitRow,
  TextDiffLine,
  UnifiedRow,
} from './diff-rows.js';
import { textDiffHooks as hooks } from './text-diff-hooks.js';

/** The side a table draws: the old text, the new text, or both in one unified table. */
export type TableSide = 'old' | 'new' | 'both';

export interface TableOptions {
  /** Prefix of the rows' ids. */
  baseId: string;
  /** The change the reader moved to. */
  current: number | null;
  renderLineWidget: ((line: TextDiffLine) => ReactNode) | undefined;
  onExpand: (fold: FoldRow) => void;
}

interface LineRowsProps {
  line: DiffLine;
  side: TableSide;
  change: number | null;
  options: TableOptions;
}

const markers = { added: '+', removed: '−', unchanged: '' } as const;

function toPublicLine({ change, oldNumber, newNumber, text }: DiffLine): TextDiffLine {
  return { change, oldNumber, newNumber, text };
}

function columnCount(side: TableSide): number {
  return side === 'both' ? 4 : 3;
}

/** Whether a line's widget draws on this side: a split diff draws it beside its new line if any. */
function drawsWidget(line: DiffLine, side: TableSide): boolean {
  return side === 'both' || side === (line.newNumber === null ? 'old' : 'new');
}

function LineText({ line }: { line: DiffLine }) {
  const content = line.words
    ? line.words.map((part, index) =>
        part.isChanged ? (
          <span key={index} {...hooks.slot('word')}>
            {part.text}
          </span>
        ) : (
          part.text
        ),
      )
    : line.text;
  if (line.change === 'added') return <ins {...hooks.slot('text')}>{content}</ins>;
  if (line.change === 'removed') return <del {...hooks.slot('text')}>{content}</del>;
  return <span {...hooks.slot('text')}>{content}</span>;
}

function NumberCell({ side, value }: { side: 'old' | 'new'; value: number | null }) {
  return (
    <td {...hooks.slot('number', { side })}>
      <span aria-hidden="true">{value}</span>
    </td>
  );
}

function LineRows({ line, side, change, options }: LineRowsProps) {
  const strings = useUiStrings();
  const widget = drawsWidget(line, side) ? options.renderLineWidget?.(toPublicLine(line)) : null;
  const label = strings.textDiffLine(
    line.change,
    side === 'new' ? null : line.oldNumber,
    side === 'old' ? null : line.newNumber,
  );
  return (
    <>
      <tr
        id={getRowId(options.baseId, side, line.key)}
        tabIndex={-1}
        {...hooks.slot('line', {
          change: line.change,
          current: change !== null && change === options.current,
        })}
      >
        {side === 'new' ? null : <NumberCell side="old" value={line.oldNumber} />}
        {side === 'old' ? null : <NumberCell side="new" value={line.newNumber} />}
        <td {...hooks.slot('marker')}>
          <span aria-hidden="true">{markers[line.change]}</span>
          <VisuallyHidden elementType="span">{label}</VisuallyHidden>
        </td>
        <td {...hooks.slot('content')}>
          <LineText line={line} />
        </td>
      </tr>
      {isEmptyNode(widget) ? null : (
        <tr {...hooks.slot('widget')}>
          <td colSpan={columnCount(side)}>{widget}</td>
        </tr>
      )}
    </>
  );
}

/** Folded unchanged lines: the new side, or the unified table, offers to show them. */
function FoldRows({
  fold,
  side,
  options,
}: {
  fold: FoldRow;
  side: TableSide;
  options: TableOptions;
}) {
  const strings = useUiStrings();
  const label = strings.textDiffShowLines(fold.count);
  return (
    <tr {...hooks.slot('fold')}>
      <td colSpan={columnCount(side)}>
        {side === 'old' ? (
          <span aria-hidden="true">{label}</span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className={hooks.slotClass('expand')}
            onPress={() => options.onExpand(fold)}
          >
            {label}
          </Button>
        )}
      </td>
    </tr>
  );
}

/** The id of the row that draws a line on one side. */
export function getRowId(baseId: string, side: TableSide, key: string): string {
  return `${baseId}-${side}-${key}`;
}

/** The id of a change's first row: its first added line in a split diff, when it adds any. */
export function getChangeRowId(
  baseId: string,
  block: Extract<DiffBlock, { kind: 'change' }>,
  isSplit: boolean,
): string {
  const [removed] = block.removed;
  const [added] = block.added;
  if (!isSplit) return getRowId(baseId, 'both', requireDefined(removed ?? added).key);
  return added
    ? getRowId(baseId, 'new', added.key)
    : getRowId(baseId, 'old', requireDefined(removed).key);
}

/** Both texts in one table: each change's removed lines, then its added lines. */
export function UnifiedTable({ rows, options }: { rows: UnifiedRow[]; options: TableOptions }) {
  return (
    <table {...hooks.slot('table')}>
      <tbody>
        {rows.map((row) =>
          row.kind === 'fold' ? (
            <FoldRows key={row.key} fold={row} side="both" options={options} />
          ) : (
            <LineRows
              key={row.key}
              line={row.line}
              side="both"
              change={row.change}
              options={options}
            />
          ),
        )}
      </tbody>
    </table>
  );
}

/** One side of a split diff; a line the other side has alone leaves an empty filler row. */
export function SplitTable({
  rows,
  side,
  options,
}: {
  rows: SplitRow[];
  side: 'old' | 'new';
  options: TableOptions;
}) {
  return (
    <table {...hooks.slot('table')}>
      <tbody>
        {rows.map((row) => {
          if (row.kind === 'fold') {
            return <FoldRows key={row.key} fold={row} side={side} options={options} />;
          }
          const line = row[side];
          if (!line) {
            return (
              <tr key={row.key} aria-hidden="true" {...hooks.slot('filler')}>
                <td colSpan={columnCount(side)} />
              </tr>
            );
          }
          return (
            <LineRows key={row.key} line={line} side={side} change={row.change} options={options} />
          );
        })}
      </tbody>
    </table>
  );
}
