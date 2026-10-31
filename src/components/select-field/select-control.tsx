'use client';

import { useMemo, useRef, type CSSProperties } from 'react';
import { Select as AriaSelect } from '../../primitives/index.js';
import { measuredProperty } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { toCollectionKey } from '../../utils/to-collection-key.js';
import { useWidestTextWidth } from '../../utils/use-widest-text-width.js';
import type { FieldControlProps, FieldState } from '../field/field.js';
import { SelectChips } from './select-chips.js';
import { SelectList, type SelectListProps } from './select-list.js';
import {
  useSelectActions,
  useSelectModel,
  type SelectConfig,
  type SelectKeysValue,
  type SelectModel,
} from './select-model.js';
import {
  FieldFormValue,
  flattenPickerItems,
  toAriaControlProps,
  usePickerEmptyContent,
} from '../field/field.js';
import { toSelectKeys, type SelectFieldOption } from './select-options.js';
import { SelectTrigger } from './select-trigger.js';
import { selectFieldHooks as hooks } from './select-field-hooks.js';
import { isFilterableLength } from '../../utils/filterable-list.js';

export type { SelectConfig, SelectKeysValue } from './select-model.js';

interface SelectControlProps extends SelectConfig {
  control: FieldControlProps;
  state: FieldState<SelectKeysValue>;
  /** The field's label, which names the chips and the clear button. */
  label: string;
  isMultiple: boolean;
}

/** The open list's props: its items, how they are drawn, the filter and the search's state. */
function useListProps(
  props: Omit<SelectControlProps, 'control' | 'label'>,
  model: SelectModel,
): Omit<SelectListProps, 'filterText' | 'onFilterTextChange'> {
  const { search } = model;
  const renderEmpty = usePickerEmptyContent(search);
  const isFilterable =
    props.filterable ??
    (Boolean(search) || isFilterableLength(flattenPickerItems(props.options).length));
  return {
    items: model.listed,
    isMultiple: props.isMultiple,
    blockedKeys: model.blockedKeys,
    renderOption: props.renderOption,
    isVirtualized: Boolean(props.virtualized),
    isFilterable,
    filtersLocally: !search,
    isLoading: Boolean(search?.isLoading),
    emptyMessage: renderEmpty(),
    more: search?.hasMore ? { isLoading: search.isLoadingMore, onLoadMore: search.loadMore } : null,
  };
}

/**
 * The trigger's ref (read for its font, focused after a clear and published to the field), its
 * placeholder, a multiple select's count of its choices and the measured width of the widest text
 * it can show.
 */
function useTrigger(
  control: FieldControlProps,
  props: Omit<SelectControlProps, 'control' | 'label'>,
  model: SelectModel,
) {
  const strings = useUiStrings();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const ref = useMemo(
    () => mergeRefs(triggerRef, control.ref, props.triggerRef),
    [control.ref, props.triggerRef],
  );
  const placeholder = props.placeholder ?? strings.selectPlaceholder;
  const options = flattenPickerItems(props.options);
  const count = model.keys.length;
  const texts = [
    model.empty?.label ?? placeholder,
    ...(props.isMultiple ? [strings.selectedCount(options.length)] : []),
    ...options.map((option) => option.label),
  ];
  const width = useWidestTextWidth(triggerRef, texts);
  const style =
    width === null
      ? undefined
      : (measuredProperty('select-field-label-width', width) as CSSProperties);
  return {
    ref,
    placeholder,
    summary: props.isMultiple && count > 0 ? strings.selectedCount(count) : null,
    style,
    focus: () => triggerRef.current?.focus(),
  };
}

/**
 * A select field's control: React Aria's `Select` with the framed trigger, the open list and, for a
 * multiple select, the chips. Every pick, chip removal, clear and restore commits at once.
 */
export function SelectControl({ control, label, ...props }: SelectControlProps) {
  const { state, isMultiple } = props;
  const strings = useUiStrings();
  const model = useSelectModel(props);
  const list = useListProps(props, model);
  const actions = useSelectActions(props, model, list.isFilterable);
  const trigger = useTrigger(control, props, model);
  const submitted = isMultiple ? model.keys : [model.keys[0] ?? ''];
  return (
    <>
      <AriaSelect<SelectFieldOption, 'single' | 'multiple'>
        className={hooks.slotClass('select')}
        style={trigger.style}
        {...toAriaControlProps(control)}
        selectionMode={isMultiple ? 'multiple' : 'single'}
        value={
          isMultiple
            ? model.keys.map(toCollectionKey)
            : model.single
              ? toCollectionKey(model.single.id)
              : null
        }
        onChange={(value) => actions.commitKeys(toSelectKeys(value).map(fromCollectionKey))}
        isOpen={actions.isOpen}
        onOpenChange={actions.changeOpen}
        allowsEmptyCollection
      >
        <SelectTrigger
          ref={trigger.ref}
          chosen={model.single}
          previous={model.previous}
          placeholder={trigger.placeholder}
          summary={trigger.summary}
          clearLabel={props.isClearable && state.canClear ? strings.clearValue(label) : null}
          onClear={() => {
            state.clear();
            trigger.focus();
          }}
          onKeyDownCapture={actions.seedFilter}
        />
        <SelectList
          {...list}
          filterText={actions.filterText}
          onFilterTextChange={actions.changeFilter}
        />
      </AriaSelect>
      <FieldFormValue
        name={props.name}
        value={submitted.map(String)}
        isDisabled={state.isDisabled}
      />
      {isMultiple ? (
        <SelectChips
          label={label}
          chosen={model.chosen}
          added={model.added}
          removed={model.removed}
          isEditable={!state.isReadOnly && !state.isDisabled}
          isFull={model.isFull}
          onRemove={(keys) => actions.commitKeys(model.keys.filter((key) => !keys.has(key)))}
          onRestore={(key) => actions.commitKeys([...model.keys, key])}
        />
      ) : null}
    </>
  );
}
