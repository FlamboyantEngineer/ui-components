'use client';

import type { AriaLabellingProps } from '../../core/events.js';
import {
  ArrowDownGlyph,
  ArrowUpGlyph,
  ChevronDoubleLeftGlyph,
  ChevronDoubleRightGlyph,
  ChevronLeftGlyph,
  ChevronRightGlyph,
} from '../../core/glyphs.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { transferListHooks as hooks } from './transfer-list-hooks.js';
import { type TransferListItem, type TransferListSide, TransferPane } from './transfer-pane.js';
import { type TransferSide, useTransferList } from './use-transfer-list.js';

export type { TransferListItem, TransferListSide } from './transfer-pane.js';

export interface TransferListProps extends RefProps<HTMLDivElement>, BaseProps, AriaLabellingProps {
  /** Every item, in the order the available side lists them. */
  items: readonly TransferListItem[];
  /** The chosen item ids, in the chosen side's order, controlled. */
  value?: readonly Key[] | undefined;
  /** The chosen item ids at first, uncontrolled. */
  defaultValue?: readonly Key[] | undefined;
  /** Called with the chosen item ids after each move or reorder. */
  onChange?: ((value: Key[]) => void) | undefined;
  /** The available side's title. Defaults to the provider's `availableItems`. */
  availableLabel?: string | undefined;
  /** The chosen side's title. Defaults to the provider's `chosenItems`. */
  chosenLabel?: string | undefined;
  /** Items that cannot be selected or moved. */
  disabledKeys?: Iterable<Key> | undefined;
  /** Lets the reader reorder the chosen side by drag and drop and with move up and down buttons. */
  reorderable?: boolean | undefined;
  /** Locks every row, filter and button. */
  isDisabled?: boolean | undefined;
  /** Renders only each side's rows in view; the stylesheet must bound the lists' height. */
  virtualized?: boolean | undefined;
  /** Row height in pixels for virtualized sides. Defaults to the list view's 48. */
  rowHeight?: number | undefined;
}

interface MoveButtonsProps {
  from: TransferListSide;
  side: TransferSide;
  /** The title of the side the items move to. */
  toLabel: string;
  onTransfer: (from: TransferListSide, keys: ReadonlySet<Key>) => void;
}

/** The two buttons that move one side's selected items, or all it shows, to the other side. */
function MoveButtons({ from, side, toLabel, onTransfer }: MoveButtonsProps) {
  const strings = useUiStrings();
  const isForward = from === 'available';
  return (
    <>
      <Button
        {...hooks.slot('move', { scope: 'selected', target: isForward ? 'chosen' : 'available' })}
        icon={isForward ? ChevronRightGlyph : ChevronLeftGlyph}
        label={strings.moveSelectedTo(toLabel)}
        tooltip={strings.moveSelectedTo(toLabel)}
        size="sm"
        variant="secondary"
        isDisabled={side.selected.size === 0}
        onPress={() => onTransfer(from, side.selected)}
      />
      <Button
        {...hooks.slot('move', { scope: 'all', target: isForward ? 'chosen' : 'available' })}
        icon={isForward ? ChevronDoubleRightGlyph : ChevronDoubleLeftGlyph}
        label={strings.moveAllTo(toLabel)}
        tooltip={strings.moveAllTo(toLabel)}
        size="sm"
        variant="secondary"
        isDisabled={side.movable.size === 0}
        onPress={() => onTransfer(from, side.movable)}
      />
    </>
  );
}

interface ReorderButtonsProps {
  up: { canStep: boolean; onStep: () => void };
  down: { canStep: boolean; onStep: () => void };
  isDisabled: boolean;
}

/** The chosen side's move up and move down buttons. */
function ReorderButtons({ isDisabled, ...steps }: ReorderButtonsProps) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('reorder')}>
      {(['up', 'down'] as const).map((direction) => (
        <Button
          key={direction}
          icon={direction === 'up' ? ArrowUpGlyph : ArrowDownGlyph}
          label={strings.moveItem(direction)}
          tooltip={strings.moveItem(direction)}
          size="sm"
          variant="ghost"
          isDisabled={isDisabled || !steps[direction].canStep}
          onPress={steps[direction].onStep}
        />
      ))}
    </div>
  );
}

/**
 * Chooses a subset of items, in order, between two lists: the available items and the chosen ones.
 * Each side filters its rows, counts them and selects several (Shift and Ctrl or Cmd); buttons move
 * the selection or every shown item across, a double click or Enter moves a row, and with
 * `reorderable` the chosen side reorders by drag and drop and with move up and down buttons.
 */
export function TransferList({
  items,
  value,
  defaultValue,
  onChange,
  availableLabel,
  chosenLabel,
  disabledKeys,
  reorderable = false,
  isDisabled = false,
  virtualized = false,
  rowHeight,
  className,
  id,
  ...rest
}: TransferListProps) {
  const strings = useUiStrings();
  const model = useTransferList({ items, value, defaultValue, onChange, disabledKeys, isDisabled });
  const { sides } = model;
  const labels = {
    available: availableLabel ?? strings.availableItems,
    chosen: chosenLabel ?? strings.chosenItems,
  };
  const pane = (side: TransferListSide) => ({
    side,
    label: labels[side],
    total: sides[side].all.length,
    items: sides[side].shown,
    selected: sides[side].selected,
    filterText: sides[side].filterText,
    disabledKeys: model.blocked,
    isDisabled,
    virtualized,
    rowHeight,
    onSelectionChange: (keys: Parameters<typeof model.select>[1]) => model.select(side, keys),
    onAction: (key: Key) => model.act(side, key),
    onFilterTextChange: (text: string) => model.filter(side, text),
  });
  const reorderTools = reorderable ? (
    <ReorderButtons up={model.up} down={model.down} isDisabled={isDisabled} />
  ) : null;
  return (
    <div
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: { reorderable, disabled: isDisabled, virtualized },
      })}
      id={id}
      role="group"
    >
      <TransferPane {...pane('available')} />
      <div {...hooks.slot('actions')}>
        <MoveButtons
          from="available"
          side={sides.available}
          toLabel={labels.chosen}
          onTransfer={model.transfer}
        />
        <MoveButtons
          from="chosen"
          side={sides.chosen}
          toLabel={labels.available}
          onTransfer={model.transfer}
        />
      </div>
      <TransferPane
        {...pane('chosen')}
        onReorder={reorderable && !isDisabled ? model.drop : undefined}
        tools={reorderTools}
      />
    </div>
  );
}
