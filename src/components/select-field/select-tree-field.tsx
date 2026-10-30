'use client';

import type { Ref } from 'react';
import type { OpenStateProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { Field, useFieldControl, type FieldInputProps, type FieldState } from '../field/field.js';
import type { SelectFieldSelectionMode, SelectFieldValue } from './select-field.js';
import type { TreeItemData } from '../tree/tree.js';
import { TreeSelectControl } from './tree-select-control.js';

/** How a chosen node reads: its own label, or its path from the top level. */
export type SelectFieldValueDisplay = 'label' | 'path';

export interface SelectTreeFieldProps<
  T extends TreeItemData,
  M extends SelectFieldSelectionMode = 'single',
>
  extends FieldInputProps<SelectFieldValue<M>>, OpenStateProps {
  mode: 'tree';
  /** The top-level nodes. Each node's `id` must be unique in the whole hierarchy. */
  items: readonly T[];
  /** Plain text for a node: its label, its accessible name and the text the search matches. */
  getTextValue: (item: T) => string;
  /** Children of a node. Defaults to its `children` property. */
  getChildren?: ((item: T) => readonly T[] | undefined) | undefined;
  /** Whether a node without loaded children has some, so expanding it loads them. */
  hasChildItems?: ((item: T) => boolean) | undefined;
  /** Loads the children of an expanded node that has some but none loaded (see `Tree`). */
  onLoadChildren?: ((item: T) => unknown) | undefined;
  /** `single` (the default) or `multiple`, which draws a checkbox in each row and chosen chips. */
  selectionMode?: M | undefined;
  /**
   * With multiple choice, choosing a node chooses its loaded descendants, a node is chosen exactly
   * when all its children are, and each chosen branch shows as one chip. Defaults to true.
   */
  selectionPropagation?: boolean | undefined;
  /** How chosen nodes read in the trigger and the chips. Defaults to `label`. */
  valueDisplay?: SelectFieldValueDisplay | undefined;
  /** The trigger's text while nothing is chosen. Defaults to the provider's `selectPlaceholder`. */
  placeholder?: string | undefined;
  /** Draws a button after the trigger that clears the value in one press. */
  isClearable?: boolean | undefined;
  /** The form name the chosen ids are submitted under, one entry each. */
  name?: string | undefined;
  /** Receives the trigger button, the field's focusable control, while it is on the page. */
  triggerRef?: Ref<HTMLButtonElement> | undefined;
}

const hooks = createHooks('select-field');

/**
 * A field that chooses one node or several from a hierarchy: its trigger opens a popover with a
 * search and a `Tree` (filtered with the matches' ancestors, lazily loaded branches, checkboxes that
 * cascade for multiple choice), and shows the chosen node by label or path, or the chosen nodes as
 * removable chips. It has the field base's label, validation, dirty state, restore, undo and menu.
 */
export function SelectTreeField<
  T extends TreeItemData,
  M extends SelectFieldSelectionMode = 'single',
>(props: SelectTreeFieldProps<T, M>) {
  const isMultiple = props.selectionMode === 'multiple';
  const empty = (isMultiple ? [] : null) as SelectFieldValue<M>;
  const { state, field, rest } = useFieldControl<SelectFieldValue<M>, SelectTreeFieldProps<T, M>>(
    props,
    { initialValue: empty, emptyValue: empty },
  );
  const { mode, selectionMode = 'single', valueDisplay = 'label', ...config } = rest;
  return (
    <Field
      {...field}
      {...hooks.root({
        className: field.className,
        props: field,
        data: { mode, selectionMode, valueDisplay },
      })}
      state={state}
    >
      {(control) => (
        <TreeSelectControl
          {...config}
          control={control}
          state={state as unknown as FieldState<Key | Key[] | null>}
          label={field.label}
          isMultiple={isMultiple}
          valueDisplay={valueDisplay}
        />
      )}
    </Field>
  );
}
