import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Tab, TabList, TabPanel, Tabs } from '../tabs/tabs.js';
import { EmojiGrid, type EmojiGridOptions } from './emoji-grid.js';
import type { EmojiData, EmojiSearchState, EmojiTab } from './emoji-picker-state.js';

export interface EmojiTabsProps {
  tabs: EmojiTab[];
  tab: EmojiTab | undefined;
  onTabChange(id: string): void;
  grid: EmojiGridOptions;
}

export interface EmojiBodyProps extends EmojiTabsProps {
  data: EmojiData;
  search: EmojiSearchState;
}

const hooks = createHooks('emoji-picker', ['categories', 'message']);
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

function EmojiMessage({ children }: { children: ReactNode }) {
  return (
    <div {...hooks.slot('message')} role="status">
      {children}
    </div>
  );
}

function EmojiTabs({ tabs, tab, onTabChange, grid }: EmojiTabsProps) {
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

/** The loading or failure message, the category tabs, or the search results. */
export function EmojiBody({ data, search, ...tabs }: EmojiBodyProps) {
  const strings = useUiStrings();
  if (data.failed) return <EmojiMessage>{strings.emojiLoadFailed}</EmojiMessage>;
  if (!data.emoji) return <EmojiMessage>{strings.loading}</EmojiMessage>;
  if (!search.isSearching) return <EmojiTabs {...tabs} />;
  if (search.results.length === 0) return <EmojiMessage>{strings.noResults}</EmojiMessage>;
  return (
    <EmojiGrid {...tabs.grid} label={strings.emojiCategory('search')} entries={search.results} />
  );
}
