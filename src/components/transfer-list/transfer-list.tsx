import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { IconButton } from '../icon-button/icon-button.js';
import { TransferPane, type TransferListItem, type TransferListSide } from './transfer-pane.js';
import { useTransferList, type TransferSide } from './use-transfer-list.js';

export type { TransferListItem, TransferListSide } from './transfer-pane.js';

export interface TransferListProps extends BaseProps, AriaLabellingProps {
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
}

interface MoveButtonsProps {
  from: TransferListSide;
  side: TransferSide;
  /** The title of the side the items move to. */
  toLabel: string;
  onTransfer: (from: TransferListSide, keys: ReadonlySet<Key>) => void;
}

const hooks = createHooks('transfer-list', ['actions', 'move', 'reorder']);

/** The two buttons that move one side's selected items, or all it shows, to the other side. */
function MoveButtons({ from, side, toLabel, onTransfer }: MoveButtonsProps) {
  const strings = useUiStrings();
  const isForward = from === 'available';
  return (
    <>
      <IconButton
        {...hooks.slot('move', { scope: 'selected', target: isForward ? 'chosen' : 'available' })}
        icon={isForward ? 'chevron-right' : 'chevron-left'}
        label={strings.moveSelectedTo(toLabel)}
        tooltip={strings.moveSelectedTo(toLabel)}
        size="sm"
        variant="secondary"
        isDisabled={side.selected.size === 0}
        onPress={() => onTransfer(from, side.selected)}
      />
      <IconButton
        {...hooks.slot('move', { scope: 'all', target: isForward ? 'chosen' : 'available' })}
        icon={isForward ? 'chevron-double-right' : 'chevron-double-left'}
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
    onSelectionChange: (keys: Parameters<typeof model.select>[1]) => model.select(side, keys),
    onAction: (key: Key) => model.act(side, key),
    onFilterTextChange: (text: string) => model.filter(side, text),
  });
  const reorderTools = reorderable ? (
    <div {...hooks.slot('reorder')}>
      {(['up', 'down'] as const).map((direction) => (
        <IconButton
          key={direction}
          icon={direction === 'up' ? 'arrow-up' : 'arrow-down'}
          label={strings.moveItem(direction)}
          tooltip={strings.moveItem(direction)}
          size="sm"
          variant="ghost"
          isDisabled={isDisabled || !model[direction].canStep}
          onPress={model[direction].onStep}
        />
      ))}
    </div>
  ) : null;
  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest, data: { reorderable, disabled: isDisabled } })}
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
