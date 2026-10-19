import { useId, type CSSProperties, type ReactNode, type RefObject } from 'react';
import {
  Collection,
  Header,
  ListBox,
  ListBoxItem,
  ListBoxLoadMoreItem,
  ListBoxSection,
  ListLayout,
  Popover,
  PopoverContext,
  useSlottedContext,
  Virtualizer,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon, toIconProps } from '../icon/icon.js';
import { triggerWidthProperty, useLayerZIndex } from '../portal/portal.js';
import { TextMatch, TextMatchProvider } from '../text-match/text-match.js';
import { useAutoHighlight, useCreatedSelection, useOpenState } from './combobox-effects.js';
import {
  flattenOptions,
  hasOptionLabelled,
  isSection,
  type ComboboxCompletion,
  type ComboboxItem,
  type ComboboxOption,
} from './combobox-options.js';

/** The state of an option row that `renderOption` draws for. */
export interface ComboboxOptionState {
  /** The option is picked. */
  isSelected: boolean;
  /** The option is highlighted, from the keyboard or the pointer. */
  isFocused: boolean;
  /** The option is highlighted from the keyboard. */
  isFocusVisible: boolean;
  /** The pointer is over the option. */
  isHovered: boolean;
  /** The option is being pressed. */
  isPressed: boolean;
  /** The option cannot be picked. */
  isDisabled: boolean;
}

/** Draws an option's content in the list, from the option and its row's state. */
export type ComboboxOptionRenderer = (
  option: ComboboxOption,
  state: ComboboxOptionState,
) => ReactNode;

/** How the list draws its options. */
export interface ComboboxOptionDisplay {
  /** Marks the typed text in option labels. */
  highlightMatches?: boolean | undefined;
  renderOption?: ComboboxOptionRenderer | undefined;
}

export interface ComboboxSuggestionsProps extends ComboboxOptionDisplay {
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

const hooks = createHooks('combobox', [
  'popover',
  'listbox',
  'section',
  'section-header',
  'option',
  'option-icon',
  'option-label',
  'option-description',
  'create',
  'load-more',
  'empty',
  'list-header',
]);

// Estimates the virtualizer starts from; it measures each row as it renders.
const listLayoutOptions = { estimatedRowSize: 32, estimatedHeadingSize: 26, loaderSize: 32 };

function OptionContent({
  option,
  highlightMatches,
}: {
  option: ComboboxOption;
  highlightMatches: boolean | undefined;
}) {
  return (
    <>
      {option.icon ? (
        <Icon {...toIconProps(option.icon)} className={hooks.slotClass('option-icon')} />
      ) : null}
      <span {...hooks.slot('option-label')}>
        {highlightMatches ? <TextMatch>{option.label}</TextMatch> : option.label}
      </span>
      {option.description ? (
        <>
          {' '}
          <span {...hooks.slot('option-description')}>{option.description}</span>
        </>
      ) : null}
    </>
  );
}

function OptionRow({
  option,
  display,
}: {
  option: ComboboxOption;
  display: ComboboxOptionDisplay;
}) {
  return (
    <ListBoxItem
      id={option.id}
      textValue={option.label}
      isDisabled={option.isDisabled}
      className={hooks.slotClass('option')}
    >
      {(state) =>
        display.renderOption ? (
          display.renderOption(option, {
            isSelected: state.isSelected,
            isFocused: state.isFocused,
            isFocusVisible: state.isFocusVisible,
            isHovered: state.isHovered,
            isPressed: state.isPressed,
            isDisabled: state.isDisabled,
          })
        ) : (
          <OptionContent option={option} highlightMatches={display.highlightMatches} />
        )
      }
    </ListBoxItem>
  );
}

function renderItems(display: ComboboxOptionDisplay) {
  return (item: ComboboxItem) => {
    if (!isSection(item)) return <OptionRow option={item} display={display} />;
    return (
      <ListBoxSection id={item.id} className={hooks.slotClass('section')}>
        <Header className={hooks.slotClass('section-header')}>{item.title}</Header>
        {item.options.map((option) => (
          <OptionRow key={option.id} option={option} display={display} />
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
    !hasOptionLabelled(flattenOptions(items), created);
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
          onLoadMore={loading.onLoadMore}
          isLoading={loading.isLoading}
        >
          {strings.loading}
        </ListBoxLoadMoreItem>
      ) : null}
    </ListBox>
  );
  const content = props.virtualized ? (
    <Virtualizer layout={ListLayout} layoutOptions={listLayoutOptions}>
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
  const zIndex = useLayerZIndex('dropdown');
  const context = useSlottedContext(PopoverContext);
  const contextStyle = typeof context?.style === 'object' ? (context.style as CSSProperties) : {};
  useAutoHighlight({ autoHighlight: Boolean(props.autoHighlight), completion: props.completion });
  useCreatedSelection(props.createdRef);
  useOpenState(props.isOpen);
  const { inputText, completion, listHeader, inputRef } = props;
  const filterText = completion?.text === inputText ? completion.typed : inputText;
  return (
    <Popover
      {...hooks.slot('popover', { layer: 'dropdown' })}
      offset={4}
      containerPadding={8}
      style={{ ...contextStyle, ...triggerWidthProperty, zIndex }}
      // Focus leaving the popover closes it, unless it returns to the input from the list header.
      shouldCloseOnInteractOutside={(element) => element !== inputRef.current}
    >
      {listHeader ? (
        // Focus moved into the popover keeps the list open; giving it back to the input keeps the
        // keyboard on the list after a filter control is pressed. Pressable controls stop the click
        // from bubbling, so it is caught on the way down.
        <div {...hooks.slot('list-header')} onClickCapture={() => inputRef.current?.focus()}>
          {listHeader}
        </div>
      ) : null}
      <OptionList {...props} filterText={filterText} />
    </Popover>
  );
}
