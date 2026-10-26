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
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import {
  formatCellReference,
  parseCellReference,
  type CellCoordinates,
} from '../../utils/cell-reference.js';
import { CodeEditor, type CodeTokenizer } from '../code-editor/code-editor.js';
import type { Completions } from '../completion-list/completion-list.js';
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
  /** The caller's evaluation of the content being edited, shown as its result. */
  evaluate?: ((value: string, cell: CellCoordinates) => string) | undefined;
  /** Shown while the content is empty. */
  placeholder?: string | undefined;
  /** Keeps the content readable and selectable but refuses edits. */
  isReadOnly?: boolean | undefined;
  /** Refuses focus and every edit. */
  isDisabled?: boolean | undefined;
}

const hooks = createHooks('formula-bar', [
  'reference',
  'status',
  'cancel',
  'confirm',
  'glyph',
  'editor',
  'result',
]);

const describeSource = (cell: CellCoordinates | null, value: string) =>
  cell ? `${cell.row}:${cell.column}:${value}` : '';

/** Whether a cell lies inside the grid's bounds, where they are known. */
function isInGrid(
  cell: CellCoordinates,
  bounds: { rowCount: number | undefined; columnCount: number | undefined },
) {
  return cell.row < (bounds.rowCount ?? Infinity) && cell.column < (bounds.columnCount ?? Infinity);
}

/** The state of one source: the value set for it, or the initial one. */
function useSourceState<T>(source: string, initial: T): [T, (value: T) => void] {
  const [state, setState] = useState<{ source: string; value: T }>({ source, value: initial });
  return [state.source === source ? state.value : initial, (value) => setState({ source, value })];
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
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setTyped(null);
      setRefused(null);
    } else if (event.key === 'Enter' && typed !== null) {
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

/** The buttons that restore and commit the content, enabled while it differs from the cell's. */
function FormulaBarButtons(props: {
  isDirty: boolean;
  canCommit: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const strings = useUiStrings();
  return (
    <>
      <Button
        icon="close"
        size="sm"
        label={strings.cancel}
        className={hooks.slotClass('cancel')}
        isDisabled={!props.isDirty}
        onPress={props.onCancel}
      />
      <Button
        icon="check"
        size="sm"
        label={strings.confirm}
        className={hooks.slotClass('confirm')}
        isDisabled={!props.canCommit}
        onPress={props.onConfirm}
      />
    </>
  );
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
  evaluate,
  placeholder,
  isReadOnly = false,
  isDisabled = false,
  className,
  ...rest
}: FormulaBarProps) {
  const strings = useUiStrings();
  const resultId = useId();
  const [draft, setDraft] = useSourceState<string | null>(describeSource(cell, value), null);
  const text = draft ?? value;
  const isDirty = draft !== null && draft !== value;
  const isLocked = isDisabled || cell === null;
  const commit = () => {
    if (cell && !isReadOnly) onCommit?.(text, cell);
  };
  const cancel = () => setDraft(null);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.nativeEvent.isComposing) return;
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
        isDirty={isDirty}
        canCommit={isDirty && !isReadOnly}
        onCancel={cancel}
        onConfirm={commit}
      />
      <Glyph name="formula" className={hooks.slotClass('glyph')} />
      <CodeEditor
        variant="surface"
        className={hooks.slotClass('editor')}
        aria-label={strings.formulaCellContent}
        aria-describedby={evaluate && cell ? resultId : undefined}
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
      {evaluate && cell ? (
        <span {...hooks.slot('result')} id={resultId}>
          <VisuallyHidden elementType="span">{strings.formulaResult}</VisuallyHidden>{' '}
          {evaluate(text, cell)}
        </span>
      ) : null}
    </div>
  );
}
