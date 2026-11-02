'use client';

import { CheckGlyph, CloseGlyph } from '../../core/glyphs.js';
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { Input } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  formatCellReference,
  parseCellReference,
  type CellCoordinates,
} from '../../utils/cell-reference.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { CodeEditor, type CodeTokenizer } from '../code-editor/code-editor.js';
import type { Completion, Completions } from '../completion-list/completion-list.js';
import { FormulaBarFunctions } from './formula-bar-functions.js';
import { formulaBarHooks as hooks } from './formula-bar-hooks.js';
import { Button } from '../button/button.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';

export interface FormulaBarProps extends BaseProps, AriaLabellingProps {
  /** The active cell, by zero-based row and column; null while no cell is active. */
  cell: CellCoordinates | null;
  /** The active cell's raw content as the caller stores it, such as a formula. */
  value: string;
  /** Called with the edited content and its cell on Enter or the confirm button. */
  onCommit?: ((value: string, cell: CellCoordinates) => void) | undefined;
  /** Called with the cell a reference typed into the reference box names, on Enter. */
  onCellChange?: ((cell: CellCoordinates) => void) | undefined;
  /** The grid's row count; a typed reference below the last row is refused. */
  rowCount?: number | undefined;
  /** The grid's column count; a typed reference beyond the last column is refused. */
  columnCount?: number | undefined;
  /** The formula language: splits the content into tokens for highlighting. */
  tokenize?: CodeTokenizer | undefined;
  /** Function names or other words to complete at the caret, or a source that completes it. */
  completions?: Completions | undefined;
  /**
   * The functions the fₓ button lists. Choosing one inserts its `insertText` (or `label`) with
   * brackets at the caret, around any selected text, and returns focus to the content between the
   * brackets; nothing is committed. Without them the fₓ mark is decorative.
   */
  functions?: readonly Completion[] | undefined;
  /** The caller's evaluation of the content being edited, shown as its result. */
  evaluate?: ((value: string, cell: CellCoordinates) => string) | undefined;
  /** Shown while the content is empty. */
  placeholder?: string | undefined;
  /** Keeps the content readable and selectable but refuses edits. */
  isReadOnly?: boolean | undefined;
  /** Refuses focus and every edit. */
  isDisabled?: boolean | undefined;
  /**
   * Draws the cancel and confirm buttons. Defaults to true; without them, Enter and Escape still
   * commit and cancel, and the content's description says so.
   */
  showActions?: boolean | undefined;
}

/** Space-separated ids for an ARIA id list, or undefined when there are none. */
const joinIds = (...ids: (string | null)[]) => ids.filter(Boolean).join(' ') || undefined;

const describeSource = (cell: CellCoordinates | null, value: string) =>
  cell ? `${cell.row}:${cell.column}:${value}` : '';

/** Whether a cell lies inside the grid's bounds, where they are known. */
function isInGrid(
  cell: CellCoordinates,
  bounds: { rowCount: number | undefined; columnCount: number | undefined },
) {
  return cell.row < (bounds.rowCount ?? Infinity) && cell.column < (bounds.columnCount ?? Infinity);
}

/**
 * State that belongs to one source: a new source drops what was set for the old one, so returning
 * to the old source starts from `initial` again.
 */
function useSourceState<T>(source: string, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<{ source: string; value: T }>({ source, value: initial });
  let current = state;
  if (state.source !== source) {
    // Reset during render, so this render and every later one show the new source's state.
    current = { source, value: initial };
    setState(current);
  }
  return [current.value, (value) => setState({ source, value })];
}

/** The reference box: the active cell's reference, which the reader edits to move to another. */
function FormulaBarReference({
  cell,
  onCellChange,
  rowCount,
  columnCount,
  isDisabled,
}: Pick<FormulaBarProps, 'cell' | 'onCellChange' | 'rowCount' | 'columnCount' | 'isDisabled'>) {
  const strings = useUiStrings();
  const reference = cell ? formatCellReference(cell) : '';
  const [typed, setTyped] = useSourceState<string | null>(reference, null);
  const [refused, setRefused] = useSourceState<string | null>(reference, null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectPending = useRef(false);
  // After Enter or Escape the box selects what it then shows, so typing replaces it.
  useLayoutEffect(() => {
    if (!isSelectPending.current) return;
    isSelectPending.current = false;
    inputRef.current?.select();
  });
  // Escape drops a typed or refused reference; with neither, or while an input method composes,
  // it is not the box's, so a surface around the bar can close on it. Enter is always the box's:
  // it goes to a typed reference, and never submits a form around the bar.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isComposingKey(event.nativeEvent)) return;
    if (event.key === 'Escape') {
      if (typed === null && refused === null) return;
      setTyped(null);
      setRefused(null);
    } else if (event.key === 'Enter') {
      if (typed === null) {
        // Nothing to move to or refuse, so nothing renders: select the reference at once.
        event.preventDefault();
        event.currentTarget.select();
        return;
      }
      const target = parseCellReference(typed);
      if (target && isInGrid(target, { rowCount, columnCount })) {
        setTyped(null);
        onCellChange?.(target);
      } else setRefused(typed);
    } else return;
    event.preventDefault();
    isSelectPending.current = true;
  };
  return (
    <>
      <Input
        ref={inputRef}
        {...hooks.slot('reference', { invalid: refused !== null })}
        aria-label={strings.formulaCellReference}
        aria-invalid={refused !== null || undefined}
        value={typed ?? reference}
        disabled={isDisabled}
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => {
          setTyped(event.target.value);
          setRefused(null);
        }}
        onFocus={(event: FocusEvent<HTMLInputElement>) => event.target.select()}
        onBlur={() => {
          setTyped(null);
          setRefused(null);
        }}
        onKeyDown={onKeyDown}
      />
      <VisuallyHidden elementType="span" className={hooks.slotClass('status')} role="status">
        {refused === null ? '' : strings.formulaInvalidReference(refused)}
      </VisuallyHidden>
    </>
  );
}

/**
 * The buttons that restore and commit the content, enabled while the bar may do so; without them
 * (`hintId` given), the hidden text naming the keys that do it, which describes the content.
 */
function FormulaBarButtons(props: {
  canCancel: boolean;
  canCommit: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  hintId: string | null;
}) {
  const strings = useUiStrings();
  if (props.hintId) {
    return (
      <VisuallyHidden elementType="span" id={props.hintId}>
        {strings.formulaKeysHint}
      </VisuallyHidden>
    );
  }
  return (
    <>
      <Button
        icon={CloseGlyph}
        size="sm"
        label={strings.cancel}
        className={hooks.slotClass('cancel')}
        isDisabled={!props.canCancel}
        onPress={props.onCancel}
      />
      <Button
        icon={CheckGlyph}
        size="sm"
        label={strings.confirm}
        className={hooks.slotClass('confirm')}
        isDisabled={!props.canCommit}
        onPress={props.onConfirm}
      />
    </>
  );
}

/** The caller's evaluation of the draft, after a visually hidden label. */
function FormulaBarResult({ id, result }: { id: string; result: string }) {
  const strings = useUiStrings();
  return (
    <span {...hooks.slot('result')} id={id}>
      <VisuallyHidden elementType="span">{strings.formulaResult}</VisuallyHidden> {result}
    </span>
  );
}

/**
 * The content's draft and what the bar may do with it. A locked bar (disabled, or without a cell)
 * keeps its draft for when it unlocks, but neither commits nor drops it meanwhile.
 */
function useFormulaDraft({
  cell,
  value,
  onCommit,
  isReadOnly,
  isDisabled,
}: Pick<FormulaBarProps, 'cell' | 'value' | 'onCommit'> & {
  isReadOnly: boolean;
  isDisabled: boolean;
}) {
  const [draft, setDraft] = useSourceState<string | null>(describeSource(cell, value), null);
  const text = draft ?? value;
  const isDirty = draft !== null && draft !== value;
  const isLocked = isDisabled || cell === null;
  const canCancel = isDirty && !isLocked;
  const canCommit = canCancel && !isReadOnly;
  return {
    text,
    setDraft,
    isDirty,
    isLocked,
    canCancel,
    canCommit,
    commit: () => {
      if (canCommit && cell) onCommit?.(text, cell);
    },
    cancel: () => {
      if (canCancel) setDraft(null);
    },
  };
}

/**
 * A bar above a spreadsheet grid: the active cell's A1 reference, which the reader edits to move
 * to another cell, and the cell's raw content on one line of `CodeEditor`, highlighted by the
 * caller's tokenizer. Enter or the confirm button commits the content, Escape or the cancel button
 * restores it, and the caller's evaluation shows the result; the library evaluates nothing.
 */
export function FormulaBar({
  cell,
  value,
  onCommit,
  onCellChange,
  rowCount,
  columnCount,
  tokenize,
  completions,
  functions,
  evaluate,
  placeholder,
  isReadOnly = false,
  isDisabled = false,
  showActions = true,
  className,
  ...rest
}: FormulaBarProps) {
  const strings = useUiStrings();
  const resultId = useId();
  const hintId = useId();
  const { text, setDraft, isDirty, isLocked, canCancel, canCommit, commit, cancel } =
    useFormulaDraft({ cell, value, onCommit, isReadOnly, isDisabled });
  const editorRef = useRef<HTMLTextAreaElement>(null);
  // An empty result, such as an empty cell's, takes no room and describes nothing.
  const result = evaluate && cell ? evaluate(text, cell) : '';
  const onKeyDown = (event: KeyboardEvent) => {
    if (isComposingKey(event.nativeEvent)) return;
    if (event.key === 'Enter') commit();
    else if (event.key === 'Escape' && isDirty) cancel();
    else return;
    event.preventDefault();
  };
  const labelledBy = rest['aria-labelledby'];
  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest, data: { dirty: isDirty, disabled: isLocked } })}
      aria-label={rest['aria-label'] ?? (labelledBy ? undefined : strings.formulaBar)}
      role="group"
    >
      <FormulaBarReference
        cell={cell}
        onCellChange={onCellChange}
        rowCount={rowCount}
        columnCount={columnCount}
        isDisabled={isDisabled}
      />
      <FormulaBarButtons
        canCancel={canCancel}
        canCommit={canCommit}
        onCancel={cancel}
        onConfirm={commit}
        hintId={showActions ? null : hintId}
      />
      <FormulaBarFunctions
        functions={functions}
        isDisabled={isLocked || isReadOnly}
        editorRef={editorRef}
        draft={{ text, setDraft }}
      />
      <CodeEditor
        ref={editorRef}
        variant="surface"
        className={hooks.slotClass('editor')}
        aria-label={strings.formulaCellContent}
        aria-describedby={joinIds(result ? resultId : null, showActions ? null : hintId)}
        multiline={false}
        value={text}
        onChange={setDraft}
        tokenize={tokenize}
        completions={completions}
        placeholder={placeholder}
        isReadOnly={isReadOnly}
        isDisabled={isLocked}
        onKeyDown={onKeyDown}
      />
      {result ? <FormulaBarResult id={resultId} result={result} /> : null}
    </div>
  );
}
