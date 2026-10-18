import type { ReactNode } from 'react';
import { useUiStrings } from '../../core/provider.js';
import type { BlockChange, ComparedBlockRow } from '../../utils/compare-blocks.js';
import { Button } from '../button/button.js';
import {
  RedlineBlock,
  RedlineMarker,
  nameBlockType,
  redlineCompareHooks as hooks,
} from './redline-compare-parts.js';
import { createRedlineWords, type RedlineSide } from './redline-text.js';

/** A decision on one change. */
export type RedlineDecision = 'accepted' | 'rejected';

export interface RedlineRowProps {
  row: ComparedBlockRow;
  /** The row element's id. */
  rowId: string;
  isSplit: boolean;
  isCurrent: boolean;
  decision: RedlineDecision | undefined;
  /** Decides the change; without it the row draws no decision buttons. */
  onResolve: ((decision: RedlineDecision) => void) | undefined;
  /** Moves to a moved block's other position. */
  onJump: () => void;
}

/** The block a cell draws: a moved block draws only at its own position on each side. */
function readSideBlock(row: ComparedBlockRow, side: RedlineSide) {
  if (side === 'old') return row.move === 'to' ? undefined : row.oldBlock;
  return side === 'new' ? row.newBlock : (row.newBlock ?? row.oldBlock);
}

function RedlineCell({ row, side }: { row: ComparedBlockRow; side: RedlineSide }) {
  const block = readSideBlock(row, side);
  return (
    <div {...hooks.slot('cell', { side, empty: !block })}>
      {block ? <RedlineBlock block={block} words={createRedlineWords(row, side)} /> : null}
    </div>
  );
}

/** The notes under a row: a changed kind, changed formatting, and a moved block's jump button. */
function RedlineNotes({ row, onJump }: Pick<RedlineRowProps, 'row' | 'onJump'>) {
  const strings = useUiStrings();
  const { oldBlock, newBlock } = row;
  const notes: ReactNode[] = [];
  if (row.isTypeChanged && oldBlock && newBlock) {
    const text = strings.redlineTypeChange(
      nameBlockType(oldBlock, strings),
      nameBlockType(newBlock, strings),
    );
    notes.push(
      <span key="type" {...hooks.slot('note', { note: 'type' })}>
        {text}
      </span>,
    );
  }
  if (row.isFormatChanged) {
    notes.push(
      <span key="format" {...hooks.slot('note', { note: 'format' })}>
        {strings.redlineFormatChange}
      </span>,
    );
  }
  if (row.move) {
    notes.push(
      <Button
        key="jump"
        variant="link"
        size="sm"
        className={hooks.slotClass('jump')}
        onPress={onJump}
      >
        {row.move === 'from' ? strings.redlineGoToNewPosition : strings.redlineGoToOldPosition}
      </Button>,
    );
  }
  return notes.length > 0 ? <div {...hooks.slot('notes')}>{notes}</div> : null;
}

function RedlineActions(props: {
  decision: RedlineDecision | undefined;
  labelId: string;
  onResolve: (decision: RedlineDecision) => void;
}) {
  const strings = useUiStrings();
  const choices = [
    { decision: 'accepted', slot: 'accept', label: strings.redlineAccept },
    { decision: 'rejected', slot: 'reject', label: strings.redlineReject },
  ] as const;
  return (
    <div {...hooks.slot('actions')}>
      {choices.map(({ decision, slot, label }) => (
        <Button
          key={decision}
          variant="secondary"
          size="sm"
          className={hooks.slotClass(slot)}
          aria-describedby={props.labelId}
          isSelected={props.decision === decision}
          onPress={() => props.onResolve(decision)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

/**
 * One aligned row: its change marker and spoken description, one cell inline or the old and new
 * cells side by side, its notes and, for a change, the accept and reject buttons.
 */
export function RedlineRow({
  row,
  rowId,
  isSplit,
  isCurrent,
  decision,
  onResolve,
  onJump,
}: RedlineRowProps) {
  const strings = useUiStrings();
  const labelId = `${rowId}-label`;
  const label = strings.redlineRow(
    row.move ? (`moved-${row.move}` as const) : (row.change as Exclude<BlockChange, 'moved'>),
    nameBlockType((row.newBlock ?? row.oldBlock)!, strings),
  );
  return (
    <li
      id={rowId}
      tabIndex={-1}
      {...hooks.slot('row', {
        change: row.change,
        move: row.move,
        current: isCurrent,
        resolution: decision,
      })}
    >
      <RedlineMarker change={row.change} label={label} labelId={labelId} />
      {isSplit ? (
        <>
          <RedlineCell row={row} side="old" />
          <RedlineCell row={row} side="new" />
        </>
      ) : (
        <RedlineCell row={row} side="both" />
      )}
      <RedlineNotes row={row} onJump={onJump} />
      {onResolve ? (
        <RedlineActions decision={decision} labelId={labelId} onResolve={onResolve} />
      ) : null}
    </li>
  );
}
