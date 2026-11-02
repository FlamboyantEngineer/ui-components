'use client';

import { useContext, useId, type ReactNode, type RefObject } from 'react';
import {
  Collection,
  ComboBoxStateContext,
  Header,
  ListBox,
  ListBoxItem,
  ListBoxLoadMoreItem,
  ListBoxSection,
  ListLayout,
  Virtualizer,
  Popover,
} from '../../primitives/index.js';
import { PopoverPresence } from '../popover/popover.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { useFrameFlag } from '../../utils/use-frame-flag.js';
import type { ControlSize, SelectableState } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  PickerOptionRow,
  flattenPickerItems,
  isPickerSection,
  pickerListLayout,
  usePickerPopoverStyle,
} from '../field/field.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { ComboboxListHeader } from './combobox-list-header.js';
import { useAutoHighlight, useCreatedSelection, useOpenState } from './combobox-effects.js';
import {
  hasOptionLabelled,
  type ComboboxCompletion,
  type ComboboxItem,
  type ComboboxOption,
} from './combobox-options.js';
import { DEFAULT_DROPDOWN_OFFSET, DEFAULT_OVERLAY_GUTTER } from '../../utils/overlay-defaults.js';
import { comboboxHooks as hooks } from './combobox-hooks.js';

/** Draws an option's content in the list, from the option and its row's state. */
export type ComboboxOptionRenderer = (option: ComboboxOption, state: SelectableState) => ReactNode;

/** How the list draws its options. */
interface ComboboxOptionDisplay {
  /** Marks the typed text in option labels. */
  highlightMatches?: boolean | undefined;
  renderOption?: ComboboxOptionRenderer | undefined;
}

interface ComboboxSuggestionsProps extends ComboboxOptionDisplay {
  size: ControlSize;
  /** The suggestions, in display order. */
  items: Iterable<ComboboxItem>;
  /** Renders only the options in view. */
  virtualized?: boolean | undefined;
  /** Ends the list with an action row that adds the typed text, while no option has it as label. */
  onCreateOption?: ((text: string) => void) | undefined;
  /** The loading row at the end of the list, shown when either is set. */
  loading: { onLoadMore?: (() => void) | undefined; isLoading?: boolean | undefined };
  /** Highlight the first enabled option while the list is open. */
  autoHighlight?: boolean | undefined;
  /** The input's text. */
  inputText: string;
  /** The inline completion the input shows, if any. */
  completion: ComboboxCompletion | null;
  /** Holds the text the add row last created until the input shows the selected option. */
  createdRef: RefObject<string | null>;
  /** The content of the list while it holds no option. */
  renderEmpty: () => ReactNode;
  /** Controls drawn above the listbox. */
  listHeader: ReactNode;
  /** The input, which takes focus back after a press in the list header. */
  inputRef: RefObject<HTMLInputElement | null>;
  /** Whether the list is open, as the combobox's open state says. */
  isOpen: boolean;
}

function OptionRow({
  option,
  display,
}: {
  option: ComboboxOption;
  display: ComboboxOptionDisplay;
}) {
  const { renderOption } = display;
  return (
    <PickerOptionRow
      id={option.id}
      option={option}
      hooks={hooks}
      highlightMatches={display.highlightMatches}
      renderOption={
        renderOption
          ? (state) => renderOption({ ...option, id: fromCollectionKey(option.id) }, state)
          : undefined
      }
    />
  );
}

function renderItems(display: ComboboxOptionDisplay) {
  return (item: ComboboxItem) => {
    if (!isPickerSection(item)) return <OptionRow option={item} display={display} />;
    return (
      <ListBoxSection id={item.id} className={hooks.slotClass('section')}>
        {isEmptyNode(item.label) ? null : (
          <Header className={hooks.slotClass('section-header')}>{item.label}</Header>
        )}
        {item.options.map((option) => (
          <OptionRow key={toKeyIdentity(option.id)} option={option} display={display} />
        ))}
      </ListBoxSection>
    );
  };
}

/** The action row that adds the typed text; its text value is the typed text, so filters keep it. */
function CreateRow({
  text,
  onCreate,
  createdRef,
}: {
  text: string;
  onCreate: (text: string) => void;
  createdRef: RefObject<string | null>;
}) {
  const strings = useUiStrings();
  const id = useId();
  return (
    <ListBoxItem
      id={id}
      textValue={text}
      className={hooks.slotClass('create')}
      // React Aria commits the field as the row closes the list, which reports the old selection;
      // adding after that commit keeps the selection and text the caller sets for the new option.
      onAction={() => {
        createdRef.current = text;
        queueMicrotask(() => onCreate(text));
      }}
    >
      {strings.createOption(text)}
    </ListBoxItem>
  );
}

function OptionList(props: ComboboxSuggestionsProps & { filterText: string }) {
  const strings = useUiStrings();
  const { items, onCreateOption, loading, inputText, renderEmpty } = props;
  const created = inputText.trim();
  const canCreate =
    onCreateOption !== undefined &&
    created !== '' &&
    !hasOptionLabelled(flattenPickerItems(items), created);
  const list = (
    <ListBox<ComboboxItem>
      className={hooks.slotClass('listbox')}
      renderEmptyState={
        loading.isLoading ? undefined : () => <span {...hooks.slot('empty')}>{renderEmpty()}</span>
      }
    >
      <Collection items={items}>{renderItems(props)}</Collection>
      {canCreate ? (
        <CreateRow text={created} onCreate={onCreateOption} createdRef={props.createdRef} />
      ) : null}
      {loading.onLoadMore || loading.isLoading ? (
        <ListBoxLoadMoreItem
          className={hooks.slotClass('load-more')}
          // React Aria calls it whenever the end is in view; a request already loading waits.
          onLoadMore={() => {
            if (!loading.isLoading) loading.onLoadMore?.();
          }}
          isLoading={loading.isLoading}
        >
          {strings.loading}
        </ListBoxLoadMoreItem>
      ) : null}
    </ListBox>
  );
  const content = props.virtualized ? (
    <Virtualizer layout={ListLayout} layoutOptions={pickerListLayout}>
      {list}
    </Virtualizer>
  ) : (
    list
  );
  if (!props.highlightMatches) return content;
  return (
    <TextMatchProvider query={props.filterText} ignoreAccents>
      {content}
    </TextMatchProvider>
  );
}

/**
 * The suggestion list: the list header, then a listbox of options and sections, then the add row and
 * the loading row, or the empty content, in a popover on the `dropdown` layer that publishes the
 * field's width as `--ui-trigger-width`. It also keeps an option highlighted when asked and holds the building
 * block's open state to the combobox's.
 */
export function ComboboxSuggestions(props: ComboboxSuggestionsProps) {
  const style = usePickerPopoverStyle();
  const state = useContext(ComboBoxStateContext);
  const isShown = useFrameFlag(props.isOpen, props.inputRef);
  useAutoHighlight({ autoHighlight: Boolean(props.autoHighlight), completion: props.completion });
  useCreatedSelection(props.createdRef);
  useOpenState(props.isOpen);
  const { inputText, completion, listHeader, inputRef } = props;
  const filterText = completion?.text === inputText ? completion.typed : inputText;
  return (
    <>
      <PopoverPresence
        isOpen={isShown}
        triggerRef={props.inputRef}
        onClose={() => state?.close()}
      />
      <Popover
        {...hooks.slot('popover', { layer: 'dropdown', size: props.size })}
        isOpen={isShown}
        onOpenChange={(open) => {
          if (!open) state?.close();
        }}
        offset={DEFAULT_DROPDOWN_OFFSET}
        containerPadding={DEFAULT_OVERLAY_GUTTER}
        style={style}
        // Focus leaving the popover closes it, unless it returns to the input from the list header.
        shouldCloseOnInteractOutside={(element) => element !== inputRef.current}
      >
        {listHeader ? (
          <ComboboxListHeader slot={hooks.slot('list-header')} inputRef={inputRef}>
            {listHeader}
          </ComboboxListHeader>
        ) : null}
        <OptionList {...props} filterText={filterText} />
      </Popover>
    </>
  );
}
