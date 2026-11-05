'use client';

import type { ReactNode } from 'react';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Tab, TabList, TabPanel, Tabs } from '../tabs/tabs.js';
import { EmojiGrid } from './emoji-grid.js';
import { useEmojiPickerContext } from './emoji-picker-context.js';
import { emojiPickerHooks as hooks } from './emoji-picker-hooks.js';

/** The body part: caller attributes and class go on the element it shows. */
export type EmojiPickerBodyProps = RefProps<HTMLDivElement> & BaseProps;

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

function EmojiMessage({
  children,
  className,
  ...rest
}: EmojiPickerBodyProps & { children: ReactNode }) {
  return (
    <div {...rest} {...hooks.slot('message', undefined, className)} role="status">
      {children}
    </div>
  );
}

function EmojiTabs({ className, ...rest }: EmojiPickerBodyProps) {
  const strings = useUiStrings();
  const { tabs, tab, setTabId, grid } = useEmojiPickerContext();
  return (
    <Tabs
      {...rest}
      size="sm"
      className={hooks.slot('categories', undefined, className).className}
      selectedKey={tab?.id}
      onSelectionChange={(key) => setTabId(String(key))}
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
export function EmojiPickerBody(props: EmojiPickerBodyProps) {
  const strings = useUiStrings();
  const { data, search, grid } = useEmojiPickerContext();
  if (data.failed) return <EmojiMessage {...props}>{strings.emojiLoadFailed}</EmojiMessage>;
  if (!data.emoji) return <EmojiMessage {...props}>{strings.loading}</EmojiMessage>;
  if (!search.isSearching) return <EmojiTabs {...props} />;
  if (search.results.length === 0) {
    return <EmojiMessage {...props}>{strings.noResults}</EmojiMessage>;
  }
  return (
    <EmojiGrid
      {...grid}
      {...props}
      label={strings.emojiCategory('search')}
      entries={search.results}
    />
  );
}
