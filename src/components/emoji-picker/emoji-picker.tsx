import { useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Input,
  Popover,
  SearchField,
  type DialogProps,
  type KeyboardEvent as AriaKeyboardEvent,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import {
  getEmojiLabel,
  loadEmojiData,
  type EmojiEntry,
  type NativeEmoji,
} from './emoji-catalog.js';
import { EmojiBody } from './emoji-picker-body.js';
import { EmojiContent, type EmojiGridOptions } from './emoji-grid.js';
import {
  useChooseEmoji,
  useEmojiData,
  useEmojiSearch,
  useEmojiTabs,
  useSkinTone,
  type EmojiChoiceHandlers,
  type EmojiSearchState,
  type EmojiSources,
  type SkinToneState,
} from './emoji-picker-state.js';
import { SkinTonePicker } from './skin-tone-picker.js';

export interface EmojiPickerProps
  extends
    Omit<DialogProps, 'className' | 'style' | 'children' | 'render'>,
    SkinToneState,
    EmojiSources,
    EmojiChoiceHandlers,
    BaseProps {
  /** Hide the skin tone choice, for a host that sets the tone elsewhere. */
  hideSkinTones?: boolean | undefined;
  /** Called with the search text as it changes, for a host that fetches custom emoji. */
  onSearchChange?: ((value: string) => void) | undefined;
  /** Focus the search field when the picker mounts. */
  autoFocus?: boolean | undefined;
  /** Loads the standard emoji. Defaults to the bundled English set, loaded once on first use. */
  loadEmoji?: (() => Promise<readonly NativeEmoji[]>) | undefined;
  /** Draws a standard emoji glyph, for example as an image. Defaults to the text glyph. */
  renderEmoji?: ((unicode: string) => ReactNode) | undefined;
}

export interface EmojiPickerTriggerProps extends EmojiPickerProps {
  /** The button that opens the picker, such as a `Button` or `IconButton`. */
  children: ReactNode;
}

interface EmojiSearchFieldProps {
  search: EmojiSearchState;
  /** Chooses the first emoji shown, for Enter in the field. */
  onSubmit(): void;
  autoFocus: boolean | undefined;
  gridRef: RefObject<HTMLDivElement | null>;
}

const hooks = createHooks('emoji-picker', [
  'popover',
  'search',
  'search-input',
  'search-clear',
  'footer',
  'preview',
  'preview-emoji',
  'preview-label',
]);

// Down moves from the search field into the grid. The field's keys stay inside the picker, except
// Escape, which React Aria still stops while it clears a non-empty field.
function moveToGrid(event: AriaKeyboardEvent, gridRef: RefObject<HTMLDivElement | null>) {
  if (event.key === 'Escape') event.continuePropagation();
  if (event.key !== 'ArrowDown') return;
  event.preventDefault();
  gridRef.current?.focus();
}

function EmojiSearchField({ search, onSubmit, autoFocus, gridRef }: EmojiSearchFieldProps) {
  const strings = useUiStrings();
  return (
    <SearchField
      className={hooks.slotClass('search')}
      aria-label={strings.searchEmoji}
      value={search.query}
      autoFocus={autoFocus}
      onChange={search.setQuery}
      onSubmit={onSubmit}
      onKeyDown={(event) => moveToGrid(event, gridRef)}
    >
      <Input className={hooks.slotClass('search-input')} placeholder={strings.searchEmoji} />
      <AriaButton className={hooks.slotClass('search-clear')}>
        <Glyph name="close" />
      </AriaButton>
    </SearchField>
  );
}

function EmojiPreview({ entry, grid }: { entry: EmojiEntry | null; grid: EmojiGridOptions }) {
  return (
    <div {...hooks.slot('preview')} aria-hidden="true">
      {entry ? (
        <>
          <span {...hooks.slot('preview-emoji')}>
            <EmojiContent entry={entry} skinTone={grid.skinTone} renderEmoji={grid.renderEmoji} />
          </span>
          <span {...hooks.slot('preview-label')}>{getEmojiLabel(entry)}</span>
        </>
      ) : null}
    </div>
  );
}

/**
 * Chooses a standard or custom emoji: search, category tabs, a two-dimensional emoji grid, recently
 * used emoji and a skin tone choice. Data comes in as props and leaves through callbacks.
 */
export function EmojiPicker({
  onSelect,
  skinTone,
  defaultSkinTone,
  onSkinToneChange,
  hideSkinTones,
  recentEmoji,
  onRecentEmojiChange,
  customEmoji,
  onSearchChange,
  autoFocus,
  loadEmoji = loadEmojiData,
  renderEmoji,
  className,
  ...rest
}: EmojiPickerProps) {
  const strings = useUiStrings();
  const data = useEmojiData(loadEmoji);
  const [tone, setTone] = useSkinTone({ skinTone, defaultSkinTone, onSkinToneChange });
  const { tabs, all } = useEmojiTabs(data.emoji, { recentEmoji, customEmoji });
  const search = useEmojiSearch(all, onSearchChange);
  const choose = useChooseEmoji({ tone, recentEmoji, onSelect, onRecentEmojiChange });
  const [tabId, setTabId] = useState<string>();
  const [active, setActive] = useState<EmojiEntry | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tab = tabs.find((item) => item.id === tabId) ?? tabs[0];
  const first = search.isSearching ? search.results[0] : tab?.entries[0];
  const grid: EmojiGridOptions = {
    skinTone: tone,
    onSelect: choose,
    onActiveChange: setActive,
    renderEmoji,
    gridRef,
  };
  return (
    <Dialog
      {...rest}
      {...hooks.root({ className, data: { loading: !data.emoji && !data.failed } })}
      aria-label={rest['aria-label'] ?? strings.emojiPicker}
    >
      <EmojiSearchField
        search={search}
        onSubmit={() => (first ? choose(first) : undefined)}
        autoFocus={autoFocus}
        gridRef={gridRef}
      />
      <EmojiBody
        data={data}
        search={search}
        tabs={tabs}
        tab={tab}
        onTabChange={setTabId}
        grid={grid}
      />
      <div {...hooks.slot('footer')}>
        <EmojiPreview entry={active} grid={grid} />
        {hideSkinTones ? null : <SkinTonePicker value={tone} onChange={setTone} />}
      </div>
    </Dialog>
  );
}

/** Opens an `EmojiPicker` in a popover from the button it wraps; choosing an emoji closes it. */
export function EmojiPickerTrigger({ children, ...props }: EmojiPickerTriggerProps) {
  return (
    <DialogTrigger>
      {children}
      <Popover className={hooks.slotClass('popover')}>
        <EmojiPicker autoFocus {...props} />
      </Popover>
    </DialogTrigger>
  );
}
