import { useCallback, useRef, type CSSProperties } from 'react';
import { Select as AriaSelect } from '../../primitives/index.js';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
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
import { flattenSelectItems, toSelectKeys, type SelectFieldOption } from './select-options.js';
import type { SelectSearch } from './select-search.js';
import { SelectTrigger } from './select-trigger.js';

export type { SelectConfig, SelectKeysValue } from './select-model.js';

export interface SelectControlProps extends SelectConfig {
  control: FieldControlProps;
  state: FieldState<SelectKeysValue>;
  /** The field's label, which names the chips and the clear button. */
  label: string;
  isMultiple: boolean;
}

/** Lists with more options than this filter by default. */
const FILTER_THRESHOLD = 10;

const hooks = createHooks('select-field', ['select']);

function emptyMessage(search: SelectSearch | null, strings: UiStrings) {
  if (search?.isLoading) return strings.loading;
  if (search?.hasFailed) return strings.searchFailed;
  if (search?.isTooShort) return strings.typeToSearch(search.minSearchLength);
  return strings.noResults;
}

/** The open list's props: its items, how they are drawn, the filter and the search's state. */
function useListProps(
  props: Omit<SelectControlProps, 'control' | 'label'>,
  model: SelectModel,
): Omit<SelectListProps, 'filterText' | 'onFilterTextChange'> {
  const strings = useUiStrings();
  const { search } = model;
  const isFilterable =
    props.filterable ??
    (Boolean(search) || flattenSelectItems(props.options).length > FILTER_THRESHOLD);
  return {
    items: model.listed,
    isMultiple: props.isMultiple,
    blockedKeys: model.blockedKeys,
    renderOption: props.renderOption,
    isVirtualized: Boolean(props.virtualized),
    isFilterable,
    filtersLocally: !search,
    isLoading: Boolean(search?.isLoading),
    emptyMessage: emptyMessage(search, strings),
    more: search?.hasMore ? { isLoading: search.isLoadingMore, onLoadMore: search.loadMore } : null,
  };
}

/**
 * The trigger's ref (read for its font, focused after a clear and published to the field), its
 * placeholder and the measured width of the widest text it can show.
 */
function useTrigger(control: FieldControlProps, config: SelectConfig, model: SelectModel) {
  const strings = useUiStrings();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const ref = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      control.ref(node);
    },
    [control],
  );
  const placeholder = config.placeholder ?? strings.selectPlaceholder;
  const texts = [
    model.empty?.label ?? placeholder,
    ...flattenSelectItems(config.options).map((option) => option.label),
  ];
  const width = useWidestTextWidth(triggerRef, texts);
  const style =
    width === null
      ? undefined
      : (measuredProperty('select-field-label-width', width) as CSSProperties);
  return { ref, placeholder, style, focus: () => triggerRef.current?.focus() };
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
  // React Aria would submit the empty option's generated key; submit an empty entry instead.
  const submitsEmpty = Boolean(props.name) && model.empty !== null && model.single === model.empty;
  return (
    <>
      <AriaSelect<SelectFieldOption, 'single' | 'multiple'>
        className={hooks.slotClass('select')}
        style={trigger.style}
        id={control.id}
        aria-label={control['aria-label']}
        aria-labelledby={control['aria-labelledby']}
        aria-describedby={control['aria-describedby']}
        selectionMode={isMultiple ? 'multiple' : 'single'}
        value={isMultiple ? model.keys : (model.single?.id ?? null)}
        onChange={(value) => actions.commitKeys(toSelectKeys(value))}
        isOpen={actions.isOpen}
        onOpenChange={actions.changeOpen}
        isDisabled={state.isDisabled}
        isRequired={state.isRequired}
        isInvalid={state.validation.status === 'invalid'}
        validationBehavior="aria"
        allowsEmptyCollection
        name={submitsEmpty ? undefined : props.name}
        autoFocus={props.autoFocus}
      >
        <SelectTrigger
          ref={trigger.ref}
          chosen={model.single}
          previous={model.previous}
          placeholder={trigger.placeholder}
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
      {submitsEmpty ? (
        <input type="hidden" name={props.name} value="" disabled={state.isDisabled} />
      ) : null}
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
