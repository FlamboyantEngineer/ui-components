import { useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Input,
  OverlayTriggerStateContext,
  Popover,
  SearchField,
  type DialogProps,
  type KeyboardEvent as AriaKeyboardEvent,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Tab, TabList, TabPanel, Tabs } from '../tabs/tabs.js';
import {
  addRecentEmoji,
  getEmojiKey,
  getEmojiLabel,
  loadEmojiData,
  searchEmoji,
  toEmojiSelection,
  type EmojiEntry,
  type EmojiSelection,
  type NativeEmoji,
} from './emoji-catalog.js';
import { EmojiContent, EmojiGrid, type EmojiGridProps } from './emoji-grid.js';
import {
  useEmojiData,
  useEmojiTabs,
  useSkinTone,
  type EmojiData,
  type EmojiSources,
  type EmojiTab,
  type SkinToneState,
} from './emoji-picker-state.js';
import { SkinTonePicker } from './skin-tone-picker.js';

export interface EmojiPickerProps
  extends
    Omit<DialogProps, 'className' | 'style' | 'children' | 'render'>,
    SkinToneState,
    EmojiSources,
    BaseProps {
  /** Called with the chosen emoji. Inside a dialog trigger, choosing also closes the overlay. */
  onSelect?: ((selection: EmojiSelection) => void) | undefined;
  /** Hide the skin tone choice, for a host that sets the tone elsewhere. */
  hideSkinTones?: boolean | undefined;
  /** Called after a choice with the updated recent list, most recent first, for the host to keep. */
  onRecentEmojiChange?: ((recent: string[]) => void) | undefined;
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

type GridOptions = Omit<EmojiGridProps, 'label' | 'entries'>;

interface EmojiBodyProps {
  data: EmojiData;
  query: string;
  results: EmojiEntry[];
  tabs: EmojiTab[];
  tab: EmojiTab | undefined;
  onTabChange: (id: string) => void;
  grid: GridOptions;
}

const hooks = createHooks('emoji-picker', [
  'popover',
  'search',
  'search-input',
  'search-clear',
  'categories',
  'message',
  'footer',
  'preview',
  'preview-emoji',
  'preview-label',
]);
const searchLimit = 60;
const recentLimit = 24;
const categoryIcons: Readonly<Record<string, string>> = {
  recent: '🕘',
  custom: '✨',
  smileys: '😀',
  people: '👋',
  nature: '🐻',
  food: '🍔',
  travel: '🚗',
  activities: '⚽',
  objects: '💡',
  symbols: '🔣',
  flags: '🏁',
};

// Down moves from the search field into the grid. The field's keys stay inside the picker, except
// Escape, which React Aria still stops while it clears a non-empty field.
function moveToGrid(event: AriaKeyboardEvent, gridRef: RefObject<HTMLDivElement | null>) {
  if (event.key === 'Escape') event.continuePropagation();
  if (event.key !== 'ArrowDown') return;
  event.preventDefault();
  gridRef.current?.focus();
}

function EmojiMessage({ children }: { children: ReactNode }) {
  return (
    <div {...hooks.slot('message')} role="status">
      {children}
    </div>
  );
}

function EmojiTabs({ tabs, tab, onTabChange, grid }: EmojiBodyProps) {
  const strings = useUiStrings();
  return (
    <Tabs
      size="sm"
      className={hooks.slotClass('categories')}
      selectedKey={tab?.id}
      onSelectionChange={(key) => onTabChange(String(key))}
    >
      <TabList aria-label={strings.emojiCategories}>
        {tabs.map(({ id }) => (
          <Tab key={id} id={id} icon={<span>{categoryIcons[id]}</span>}>
            {strings.emojiCategory(id)}
          </Tab>
        ))}
      </TabList>
      {tabs.map(({ id, entries }) => (
        <TabPanel key={id} id={id}>
          <EmojiGrid {...grid} label={strings.emojiCategory(id)} entries={entries} />
        </TabPanel>
      ))}
    </Tabs>
  );
}

function EmojiBody(props: EmojiBodyProps) {
  const strings = useUiStrings();
  const { data, query, results, grid } = props;
  if (data.failed) return <EmojiMessage>{strings.emojiLoadFailed}</EmojiMessage>;
  if (!data.emoji) return <EmojiMessage>{strings.loading}</EmojiMessage>;
  if (!query.trim()) return <EmojiTabs {...props} />;
  if (results.length === 0) return <EmojiMessage>{strings.noResults}</EmojiMessage>;
  return <EmojiGrid {...grid} label={strings.emojiCategory('search')} entries={results} />;
}

function EmojiPreview({ entry, grid }: { entry: EmojiEntry | null; grid: GridOptions }) {
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
  recentEmoji = [],
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
  const overlay = useContext(OverlayTriggerStateContext);
  const data = useEmojiData(loadEmoji);
  const [tone, setTone] = useSkinTone({ skinTone, defaultSkinTone, onSkinToneChange });
  const { tabs, all } = useEmojiTabs(data.emoji, { recentEmoji, customEmoji });
  const [query, setQuery] = useState('');
  const [tabId, setTabId] = useState<string>();
  const [active, setActive] = useState<EmojiEntry | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => searchEmoji(all, query, searchLimit), [all, query]);
  const tab = tabs.find((item) => item.id === tabId) ?? tabs[0];
  const shown = query.trim() ? results : (tab?.entries ?? []);
  const loading = !data.emoji && !data.failed;

  const choose = (entry: EmojiEntry) => {
    onSelect?.(toEmojiSelection(entry, tone));
    onRecentEmojiChange?.(addRecentEmoji(recentEmoji, getEmojiKey(entry), recentLimit));
    overlay?.close();
  };
  const grid: GridOptions = {
    skinTone: tone,
    onSelect: choose,
    onActiveChange: setActive,
    renderEmoji,
    gridRef,
  };

  return (
    <Dialog
      {...rest}
      {...hooks.root({ className, props: rest, data: { loading } })}
      aria-label={rest['aria-label'] ?? strings.emojiPicker}
    >
      <SearchField
        className={hooks.slotClass('search')}
        aria-label={strings.searchEmoji}
        value={query}
        autoFocus={autoFocus}
        onChange={(value) => {
          setQuery(value);
          onSearchChange?.(value);
        }}
        onSubmit={() => (shown[0] ? choose(shown[0]) : undefined)}
        onKeyDown={(event) => moveToGrid(event, gridRef)}
      >
        <Input className={hooks.slotClass('search-input')} placeholder={strings.searchEmoji} />
        <AriaButton className={hooks.slotClass('search-clear')}>
          <Glyph name="close" />
        </AriaButton>
      </SearchField>
      <EmojiBody {...{ data, query, results, tabs, tab, grid }} onTabChange={setTabId} />
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
