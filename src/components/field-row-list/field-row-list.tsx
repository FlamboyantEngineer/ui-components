'use client';

import { type ReactNode, useRef } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { DeleteGlyph, PlusGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { formatOutlineNumber } from '../../utils/outline-number.js';
import { listTabbables } from '../../utils/tabbable.js';
import { useFocusRequest } from '../../utils/use-focus-request.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { Button } from '../button/button.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { Fieldset } from '../field/field.js';

/** What a field row list tells the caller drawing one of its rows. */
export interface FieldRowListRowContext {
  /** The row's position, from 0. */
  index: number;
  /** Whether the list is disabled: the row's fields show their values but refuse changes. */
  isDisabled: boolean;
}

export interface FieldRowListProps<T extends { id: Key }>
  extends RefProps<HTMLFieldSetElement>, BaseProps, AriaLabellingProps {
  /** The rows, in order, each with a stable `id`. The caller owns them. */
  rows: readonly T[];
  /** Draws a row's fields, such as a select and the numeric field it chooses. */
  renderRow: (row: T, context: FieldRowListRowContext) => ReactNode;
  /** Asks the caller to append a row. Without it the list has no add button. */
  onAdd?: (() => void) | undefined;
  /** Asks the caller to remove the row with this id. Without it rows have no remove buttons. */
  onRemove?: ((id: Key) => void) | undefined;
  /** The fewest rows: at this count the remove buttons are disabled. Defaults to 0. */
  minRows?: number | undefined;
  /** The most rows: at this count the add button is disabled. Defaults to no limit. */
  maxRows?: number | undefined;
  /** The add button's text. Defaults to the provider string `addFieldRow`. */
  addLabel?: string | undefined;
  /** A visible caption, drawn in the fieldset's `<legend>`, which names the list. */
  legend?: ReactNode;
  /** Disables the list's buttons and every field in its rows, which keep showing their values. */
  isDisabled?: boolean | undefined;
}

const hooks = createHooks('field-row-list', [
  'rows',
  'row',
  'number',
  'fields',
  'remove',
  'empty',
  'add',
]);

function findRow(root: HTMLElement | null, id: string): HTMLElement | undefined {
  const rows = root?.querySelectorAll<HTMLElement>(`.${hooks.slotClass('row')}`) ?? [];
  return [...rows].find((row) => row.dataset['key'] === id);
}

function findFirstControl(row: HTMLElement | undefined) {
  const fields = row?.querySelector(`.${hooks.slotClass('fields')}`);
  return fields ? listTabbables(fields)[0] : undefined;
}

/**
 * Focus after the caller has applied an add or a remove: the new row's first control, or the first
 * control of the row that took the removed one's place, else of the row before it, else the add
 * button. While the caller has not applied it (or declined it), the request waits, then gives up.
 */
function useRowFocus(ids: readonly string[]) {
  const rootRef = useRef<HTMLFieldSetElement>(null);
  const requestFocus = useFocusRequest();
  const listRowIds = () =>
    [...(rootRef.current?.querySelectorAll<HTMLElement>(`.${hooks.slotClass('row')}`) ?? [])].map(
      (row) => row.dataset['key'] ?? '',
    );
  const afterAdd = () => {
    const before = new Set(ids);
    requestFocus(() => {
      const added = listRowIds().find((id) => !before.has(id));
      return added === undefined ? null : findFirstControl(findRow(rootRef.current, added));
    });
  };
  const afterRemove = (id: string) => {
    const index = ids.indexOf(id);
    const candidates = [...ids.slice(index + 1), ...ids.slice(0, index).reverse()];
    requestFocus(() => {
      const listed = new Set(listRowIds());
      if (listed.has(id)) return null;
      const next = candidates.find((candidate) => listed.has(candidate));
      if (next !== undefined) return findFirstControl(findRow(rootRef.current, next));
      return rootRef.current?.querySelector<HTMLElement>(`.${hooks.slotClass('add')}`);
    });
  };
  return { rootRef, afterAdd, afterRemove };
}

/** One numbered row: its caller fields in a named group, then its remove button. */
function FieldRow(props: {
  id: string;
  number: string;
  canRemove: boolean;
  onRemove: (() => void) | undefined;
  children: ReactNode;
}) {
  const { id, number, canRemove, onRemove, children } = props;
  const strings = useUiStrings();
  return (
    <li {...hooks.slot('row')} data-key={id}>
      <span {...hooks.slot('number')} aria-hidden="true">
        {number}
      </span>
      <div {...hooks.slot('fields')} role="group" aria-label={strings.fieldRowLabel(number)}>
        {children}
      </div>
      {onRemove ? (
        <Button
          icon={DeleteGlyph}
          variant="ghost"
          size="sm"
          label={strings.removeFieldRow(number)}
          className={hooks.slotClass('remove')}
          isDisabled={!canRemove}
          onPress={onRemove}
        />
      ) : null}
    </li>
  );
}

/**
 * An ordered list of rows of caller-drawn fields, such as a select and the numeric field it
 * chooses, with add and remove buttons bounded by `minRows` and `maxRows`. The caller owns the rows
 * and applies every add and remove; the list numbers the rows, names them and moves focus after an
 * edit. Disabling it disables every field inside through its native fieldset.
 */
export function FieldRowList<T extends { id: Key }>({
  ref,
  rows,
  renderRow,
  onAdd,
  onRemove,
  minRows = 0,
  maxRows = Number.POSITIVE_INFINITY,
  addLabel,
  legend,
  isDisabled = false,
  className,
  'aria-label': ariaLabel,
  ...rest
}: FieldRowListProps<T>) {
  const strings = useUiStrings();
  const { rootRef, afterAdd, afterRemove } = useRowFocus(rows.map((row) => String(row.id)));
  const rootRefs = useMergedRefs(rootRef, ref);
  const isNamed = Boolean(ariaLabel ?? rest['aria-labelledby'] ?? legend);
  return (
    <Fieldset
      {...rest}
      ref={rootRefs}
      {...hooks.root({ className, props: rest, data: { disabled: isDisabled } })}
      aria-label={isNamed ? ariaLabel : strings.fieldRows}
      legend={legend}
      isDisabled={isDisabled}
    >
      {rows.length === 0 ? (
        <EmptyState
          size="sm"
          description={strings.noFieldRows}
          className={hooks.slotClass('empty')}
        />
      ) : (
        <ol {...hooks.slot('rows')}>
          {rows.map((row, index) => (
            <FieldRow
              key={String(row.id)}
              number={formatOutlineNumber([index])}
              canRemove={!isDisabled && rows.length > minRows}
              onRemove={
                onRemove
                  ? () => {
                      afterRemove(String(row.id));
                      onRemove(row.id);
                    }
                  : undefined
              }
              id={String(row.id)}
            >
              {renderRow(row, { index, isDisabled })}
            </FieldRow>
          ))}
        </ol>
      )}
      {onAdd ? (
        <Button
          variant="ghost"
          size="sm"
          startIcon={PlusGlyph}
          className={hooks.slotClass('add')}
          isDisabled={isDisabled || rows.length >= maxRows}
          onPress={() => {
            afterAdd();
            onAdd();
          }}
        >
          {addLabel ?? strings.addFieldRow}
        </Button>
      ) : null}
    </Fieldset>
  );
}
