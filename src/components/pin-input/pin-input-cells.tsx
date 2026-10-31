'use client';

import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Group, Input, useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { createSlotRegistry, type SlotRegistry } from '../../utils/slot-registry.js';
import {
  FieldFormValue,
  toAriaControlProps,
  type FieldControlProps,
  type FieldEnterKeyHint,
  type FieldState,
} from '../field/field.js';
import {
  filterPinCharacters,
  findActivePinCell,
  isPinCodeComplete,
  readEnteredText,
  writePinCharacters,
  type PinInputEdit,
  type PinInputType,
} from './pin-value.js';

/** A code's length and the characters its cells take. */
interface PinCodeShape {
  length: number;
  type: PinInputType;
}

/** How the cells look and what they take. */
interface PinCellOptions extends PinCodeShape {
  mask: boolean;
  placeholder: string | undefined;
  /** The first cell's autocomplete hint; the others never autocomplete. */
  autoComplete: string;
  enterKeyHint: FieldEnterKeyHint | undefined;
}

interface PinInputCellsProps {
  control: FieldControlProps;
  state: FieldState<string>;
  cells: PinCellOptions;
  /** The form name the joined value submits under. */
  name: string | undefined;
  onComplete: ((value: string) => void) | undefined;
}

/** What a cell's keys need: where it is, where focus may go and how to erase. */
interface CellKeyContext {
  index: number;
  value: string;
  active: number;
  isRtl: boolean;
  isEditable: boolean;
  focusCell(index: number): void;
  erase(index: number): void;
}

export const pinInputHooks = createHooks('pin-input', ['group', 'cell']);

const hooks = pinInputHooks;

type CellSlots = SlotRegistry<'group' | 'cell'>;

/**
 * The arrow keys, Home and End move between cells; Backspace erases and moves back; typing the
 * character a cell already holds moves on, as no change event follows it.
 */
function handleCellKey(event: KeyboardEvent<HTMLInputElement>, cell: CellKeyContext) {
  // An input method composing in a text cell owns its arrows and Backspace.
  if (isComposingKey(event.nativeEvent)) return;
  const { index, value } = cell;
  const step = cell.isRtl ? -1 : 1;
  const moves: Partial<Record<string, number>> = {
    ArrowLeft: index - step,
    ArrowRight: index + step,
    Home: 0,
    End: cell.active,
  };
  const target = moves[event.key];
  const isRetyped = event.key === value[index] && !event.ctrlKey && !event.metaKey && !event.altKey;
  if (target === undefined && event.key !== 'Backspace' && !isRetyped) return;
  event.preventDefault();
  if (target !== undefined) cell.focusCell(target);
  else if (event.key === 'Backspace' && cell.isEditable) cell.erase(index);
  else if (isRetyped) cell.focusCell(index + 1);
}

/**
 * What the field gives every cell, as native attributes on a plain input: its description and its
 * states. The group around the cells takes the field's name and states (`toAriaControlProps`).
 */
function toCellControlProps(control: FieldControlProps) {
  return {
    'aria-describedby': control['aria-describedby'],
    'aria-errormessage': control['aria-errormessage'],
    'aria-invalid': control['aria-invalid'],
    'aria-required': control['aria-required'],
    readOnly: control.readOnly,
    disabled: control.disabled,
  };
}

/**
 * Changes the value and moves focus once the new value has rendered, when the tab order and the
 * cell that takes the next character follow it. Focus moves only while it is still in the group
 * and the value did change, so a change the caller ignores moves nothing later. Completion follows
 * the rendered value too: once an edit renders a full code (the caller may cut, filter or change
 * what was typed), the field commits it and `onComplete` receives it, once per edit. An edit the
 * caller turns into a partial code commits nothing until focus leaves the field.
 */
function useCellWriter(
  state: FieldState<string>,
  options: { slots: CellSlots; cells: PinCodeShape; onComplete: PinInputCellsProps['onComplete'] },
) {
  const { slots, cells, onComplete } = options;
  const pendingFocus = useRef<{ index: number; from: string } | null>(null);
  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    pendingFocus.current = null;
    const group = slots.read('group');
    const isInside = group?.contains(group.ownerDocument.activeElement) ?? false;
    if (!pending || pending.from === state.value) return;
    if (isInside) slots.readAll('cell')[pending.index]?.focus();
    if (!isPinCodeComplete(state.value, cells)) return;
    state.commit();
    onComplete?.(state.value);
  });
  return (next: string, focusIndex: number) => {
    if (next === state.value) {
      slots.readAll('cell')[focusIndex]?.focus();
      return;
    }
    pendingFocus.current = { index: focusIndex, from: state.value };
    state.setValue(next);
  };
}

/**
 * The edits the cells make: `fill` writes entered characters from a cell on, `erase` is Backspace
 * (the cell's character, or the one before an empty cell, then focus moves back), and `remove` is a
 * native deletion (Delete, Cut, a deleting input event) that empties a cell: its character goes and
 * the later ones close up, while focus stays on the cell. Locked fields refuse every edit.
 */
function useCellEdits(
  state: FieldState<string>,
  options: { slots: CellSlots; cells: PinCodeShape; onComplete: PinInputCellsProps['onComplete'] },
) {
  const { length, type } = options.cells;
  const write = useCellWriter(state, options);
  const { value } = state;
  const isEditable = !state.isReadOnly && !state.isDisabled;
  const without = (index: number) => value.slice(0, index) + value.slice(index + 1);
  return {
    fill: (index: number, text: string) => {
      const characters = filterPinCharacters(text, type);
      if (characters === '' || !isEditable) return;
      const next = writePinCharacters(value, { index, characters, length });
      write(next, Math.min(index + characters.length, length - 1));
    },
    erase: (index: number) => {
      const target = index < value.length ? index : index - 1;
      if (target >= 0) write(without(target), Math.max(index - 1, 0));
    },
    remove: (index: number) => {
      if (isEditable && index < value.length) write(without(index), index);
    },
  };
}

/**
 * The cells of a code, one input each, in a group named by the field's label. One cell is in the
 * tab order, and focus never lands past the cell that takes the next character, so the value has
 * no gaps. A hidden input submits the joined value.
 */
export function PinInputCells({ control, state, cells, name, onComplete }: PinInputCellsProps) {
  const { length, type } = cells;
  const strings = useUiStrings();
  const { direction } = useLocale();
  const [slots] = useState<CellSlots>(() => createSlotRegistry());
  const firstRef = useMemo(
    () => mergeRefs(control.ref, slots.refAt('cell', 0)),
    [control.ref, slots],
  );
  const { value } = state;
  const active = findActivePinCell(value, length);
  const isEditable = !state.isReadOnly && !state.isDisabled;
  const focusCell = (index: number) => slots.readAll('cell')[clamp(index, 0, active)]?.focus();
  const { fill, erase, remove } = useCellEdits(state, {
    slots,
    cells: { length, type },
    onComplete,
  });
  const keys = { value, active, isRtl: direction === 'rtl', isEditable, focusCell, erase };
  // One cell is in the tab order: the focused one, else the active one, never past the active one.
  const [focused, setFocused] = useState<number | null>(null);
  const tabbable = Math.min(focused ?? active, active);
  const cellControl = toCellControlProps(control);
  const {
    'aria-label': label,
    'aria-labelledby': labelledBy,
    ...field
  } = toAriaControlProps(control);
  return (
    <>
      <Group
        {...hooks.slot('group')}
        ref={slots.ref('group')}
        aria-label={label}
        aria-labelledby={labelledBy}
        isDisabled={field.isDisabled}
        isInvalid={field.isInvalid}
        isReadOnly={field.isReadOnly}
        // The field commits once focus leaves it, so Tab reaches its restore button.
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(null);
        }}
      >
        {Array.from({ length }, (_, index) => (
          <Input
            key={index}
            {...hooks.slot('cell', { filled: index < value.length })}
            ref={index === 0 ? firstRef : slots.refAt('cell', index)}
            id={index === 0 ? control.id : undefined}
            type={cells.mask ? 'password' : 'text'}
            inputMode={type === 'numeric' ? 'numeric' : 'text'}
            autoComplete={index === 0 ? cells.autoComplete : 'off'}
            aria-label={strings.characterPosition(index + 1, length)}
            {...cellControl}
            placeholder={cells.placeholder}
            enterKeyHint={cells.enterKeyHint}
            tabIndex={index === tabbable ? 0 : -1}
            value={value[index] ?? ''}
            onChange={(event) => {
              const text = event.target.value;
              if (text === '') remove(index);
              else fill(index, readEnteredText(text, event.nativeEvent as PinInputEdit));
            }}
            onPaste={(event) => {
              event.preventDefault();
              fill(index, event.clipboardData.getData('text/plain'));
            }}
            onKeyDown={(event) => handleCellKey(event, { ...keys, index })}
            onFocus={(event) => {
              if (index > active) return focusCell(active);
              setFocused(index);
              event.currentTarget.select();
            }}
          />
        ))}
      </Group>
      <FieldFormValue name={name} value={value} isDisabled={state.isDisabled} />
    </>
  );
}
