import {
  useCallback,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { Select as AriaSelect, type Key } from 'react-aria-components';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { useWidestTextWidth } from '../../utils/use-widest-text-width.js';
import type { FieldControlProps, FieldState } from '../field/field.js';
import { SelectChips } from './select-chips.js';
import { SelectList } from './select-list.js';
import {
  diffSelectKeys,
  mergeSelectOptions,
  orderSelectKeys,
  resolveSelectOptions,
  toSelectKeys,
  type ChosenSelectOption,
  type SelectFieldOption,
} from './select-options.js';
import { useSelectSearch, type SelectFieldLoader, type SelectSearch } from './select-search.js';
import { SelectTrigger } from './select-trigger.js';

/** A select field's value with its selection mode erased. */
export type SelectKeysValue = Key | Key[] | null;

export interface SelectConfig {
  options: readonly SelectFieldOption[];
  placeholder?: string | undefined;
  emptyLabel?: string | undefined;
  filterable?: boolean | undefined;
  loadOptions?: SelectFieldLoader | undefined;
  minSearchLength?: number | undefined;
  searchDelay?: number | undefined;
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  name?: string | undefined;
  autoFocus?: boolean | undefined;
}

export interface SelectControlProps extends SelectConfig {
  control: FieldControlProps;
  state: FieldState<SelectKeysValue>;
  /** The field's label, which names the chips. */
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

function isSeedKey(event: KeyboardEvent<HTMLElement>): boolean {
  if (event.key.length !== 1 || event.key === ' ') return false;
  if (event.ctrlKey || event.metaKey || event.altKey || event.nativeEvent.isComposing) return false;
  return event.currentTarget.contains(event.target as Node);
}

/**
 * The chosen, committed, listed and known options. A single select with an `emptyLabel` lists an
 * extra first option, under a generated key, that stands for no value.
 */
function useSelectModel(
  state: FieldState<SelectKeysValue>,
  config: SelectConfig,
  isMultiple: boolean,
) {
  const emptyKey = useId();
  const search = useSelectSearch(config);
  const isRemote = Boolean(config.loadOptions);
  const known = mergeSelectOptions(config.options, search.seen);
  const keys = toSelectKeys(state.value);
  const chosen = resolveSelectOptions(keys, known);
  const diff = state.isDirty
    ? diffSelectKeys(keys, toSelectKeys(state.committedValue))
    : { added: new Set<Key>(), removed: [] };
  const empty: ChosenSelectOption | null =
    config.emptyLabel && !isMultiple
      ? { id: emptyKey, label: config.emptyLabel, isMissing: false }
      : null;
  const listed = isRemote ? mergeSelectOptions(chosen, search.results) : config.options;
  const removed = resolveSelectOptions(diff.removed, known);
  return {
    search: isRemote ? search : null,
    known,
    keys,
    chosen,
    empty,
    added: diff.added,
    removed,
    listed: empty ? [empty, ...listed] : listed,
    /** A single select's chosen option, the empty option standing for no value. */
    single: isMultiple ? null : (chosen[0] ?? empty),
    /** The committed option a single select's edit replaced. */
    previous: isMultiple ? null : (removed[0] ?? null),
  };
}

type SelectModel = ReturnType<typeof useSelectModel>;

/** Open state (controlled or held here), the filter text and the actions that commit keys. */
function useSelectActions(
  { state, isMultiple, ...config }: Omit<SelectControlProps, 'control' | 'label'>,
  model: SelectModel,
  isFilterable: boolean,
) {
  const [open, setOwnOpen] = useControllableState(
    config.isOpen,
    Boolean(config.defaultOpen),
    config.onOpenChange,
  );
  const [filterText, setFilterText] = useState('');
  const isOpen = !state.isReadOnly && open;
  const setOpen = (next: boolean) => {
    if (!next || !state.isReadOnly) setOwnOpen(next);
  };
  const changeFilter = (text: string) => {
    setFilterText(text);
    model.search?.search(text);
  };
  const commitKeys = (next: readonly Key[]) => {
    const ordered = orderSelectKeys(next, model.known).filter((key) => key !== model.empty?.id);
    state.setValue(isMultiple ? ordered : (ordered[0] ?? null));
    state.commit();
  };
  return {
    isOpen,
    filterText,
    changeFilter,
    commitKeys,
    changeOpen(next: boolean) {
      if (!next) changeFilter('');
      setOpen(next);
    },
    seedFilter(event: KeyboardEvent<HTMLElement>) {
      const isEditable = !state.isReadOnly && !state.isDisabled;
      if (!isFilterable || isOpen || !isEditable || !isSeedKey(event)) return;
      event.preventDefault();
      event.stopPropagation();
      changeFilter(event.key);
      setOpen(true);
    },
  };
}

/**
 * The trigger's ref (read for its font and published to the field), its placeholder and the
 * measured width of the widest text it can show.
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
    ...config.options.map((option) => option.label),
  ];
  const width = useWidestTextWidth(triggerRef, texts);
  const style =
    width === null
      ? undefined
      : (measuredProperty('select-field-label-width', width) as CSSProperties);
  return { ref, placeholder, style };
}

/**
 * A select field's control: React Aria's `Select` with the framed trigger, the open list and, for a
 * multiple select, the chips. Every pick, chip removal and restore commits at once.
 */
export function SelectControl({ control, label, ...props }: SelectControlProps) {
  const { state, isMultiple, options } = props;
  const strings = useUiStrings();
  const model = useSelectModel(state, props, isMultiple);
  const isFilterable =
    props.filterable ?? (Boolean(model.search) || options.length > FILTER_THRESHOLD);
  const actions = useSelectActions(props, model, isFilterable);
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
          onKeyDownCapture={actions.seedFilter}
        />
        <SelectList
          options={model.listed}
          isMultiple={isMultiple}
          isFilterable={isFilterable}
          filtersLocally={!model.search}
          filterText={actions.filterText}
          onFilterTextChange={actions.changeFilter}
          isLoading={Boolean(model.search?.isLoading)}
          emptyMessage={emptyMessage(model.search, strings)}
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
          onRemove={(keys) => actions.commitKeys(model.keys.filter((key) => !keys.has(key)))}
          onRestore={(key) => actions.commitKeys([...model.keys, key])}
        />
      ) : null}
    </>
  );
}
