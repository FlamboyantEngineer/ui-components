import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import {
  Autocomplete,
  AutocompleteStateContext,
  Input,
  Menu as AriaMenu,
  MenuContext,
  MenuLoadMoreItem,
  SearchField,
  SubmenuTrigger,
  useFilter,
  useSlottedContext,
  type Key,
  type MenuLoadMoreItemProps,
  type MenuProps as AriaMenuProps,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { TextMatch, TextMatchProvider } from '../text-match/text-match.js';
import { MenuSizeContext, type MenuSize } from './menu-context.js';
import {
  MenuItem,
  MenuSection,
  MenuSeparator,
  type MenuItemProps,
  type MenuItemRenderProps,
  type MenuSectionProps,
} from './menu-item.js';
import { MenuPopover } from './menu-popover.js';

/** One action described as data. With `items` it opens a submenu of those entries. */
export interface MenuItemEntry extends Omit<MenuItemProps, 'id' | 'children' | 'textValue'> {
  type?: 'item' | undefined;
  id: Key;
  /** The visible label, also used for type-to-select. */
  label: string;
  items?: readonly MenuEntry[] | undefined;
  /** Custom content, drawn instead of the default layout. */
  renderContent?: ((state: MenuItemRenderProps) => ReactNode) | undefined;
}

/** A group of entries with an optional title and its own selection. */
export interface MenuSectionEntry extends Omit<MenuSectionProps, 'id' | 'children'> {
  type: 'section';
  id: Key;
  items: readonly MenuEntry[];
}

/** A rule between entries. */
export interface MenuSeparatorEntry {
  type: 'separator';
  id: Key;
}

export type MenuEntry = MenuItemEntry | MenuSectionEntry | MenuSeparatorEntry;

export interface MenuProps
  extends
    Omit<
      AriaMenuProps<object>,
      'className' | 'style' | 'children' | 'items' | 'dependencies' | 'render'
    >,
    Pick<MenuLoadMoreItemProps, 'onLoadMore' | 'isLoading'>,
    BaseProps {
  /** Entries as data, used when there are no `children`. */
  items?: readonly MenuEntry[] | undefined;
  /** `MenuItem`, `MenuSection`, `MenuSeparator` and `SubmenuTrigger` elements. */
  children?: ReactNode;
  /** Row density. Submenus inherit it. Defaults to `md`. */
  size?: MenuSize | undefined;
  /** Leads the menu with a search field that narrows the items while focus stays in it. */
  filterable?: boolean | undefined;
  /** Marks the text typed in the enclosing search field (its own, or a command palette's) in the labels. */
  highlightMatches?: boolean | undefined;
}

const hooks = createHooks('menu', [
  'search',
  'search-input',
  'empty',
  'load-more',
  'load-more-spinner',
]);

const MenuActionContext = createContext<MenuProps['onAction']>(undefined);

function renderEntries(entries: readonly MenuEntry[], highlight: boolean): ReactElement[] {
  return entries.map((entry) => renderEntry(entry, highlight));
}

function renderEntry(entry: MenuEntry, highlight: boolean): ReactElement {
  if (entry.type === 'separator') return <MenuSeparator key={entry.id} />;
  if (entry.type === 'section') {
    const { type: _type, items, ...section } = entry;
    return (
      <MenuSection key={entry.id} {...section}>
        {renderEntries(items, highlight)}
      </MenuSection>
    );
  }
  const { type: _type, label, items, renderContent, ...item } = entry;
  const element = (
    <MenuItem key={entry.id} textValue={label} {...item}>
      {renderContent ?? (highlight ? <TextMatch>{label}</TextMatch> : label)}
    </MenuItem>
  );
  if (!items?.length) return element;
  return (
    <SubmenuTrigger key={entry.id}>
      {element}
      <MenuPopover>
        <Menu>{renderEntries(items, highlight)}</Menu>
      </MenuPopover>
    </SubmenuTrigger>
  );
}

/** The loading sentinel: React Aria calls `onLoadMore` as it scrolls into view and shows the row while loading. */
function MenuLoader({ onLoadMore, isLoading }: Pick<MenuProps, 'onLoadMore' | 'isLoading'>) {
  const strings = useUiStrings();
  return (
    <MenuLoadMoreItem
      className={hooks.slotClass('load-more')}
      onLoadMore={onLoadMore}
      isLoading={isLoading}
    >
      <span {...hooks.slot('load-more-spinner')} aria-hidden="true" /> {strings.loading}
    </MenuLoadMoreItem>
  );
}

/**
 * The search field of a filterable menu over the menu (React Aria `Autocomplete`): the arrow keys
 * move through the items while focus stays in the field, which a menu opened from a trigger focuses.
 */
function MenuFilter({
  isOpenedByTrigger,
  children,
}: {
  isOpenedByTrigger: boolean;
  children: ReactNode;
}) {
  const strings = useUiStrings();
  const { contains } = useFilter({ sensitivity: 'base' });
  return (
    <Autocomplete filter={contains}>
      <SearchField
        className={hooks.slotClass('search')}
        aria-label={strings.search}
        autoFocus={isOpenedByTrigger}
      >
        <Input className={hooks.slotClass('search-input')} placeholder={strings.search} />
      </SearchField>
      {children}
    </Autocomplete>
  );
}

/** Hands the text typed in the enclosing React Aria `Autocomplete` to the `TextMatch` labels below. */
function AutocompleteMatches({ children }: { children: ReactNode }) {
  const query = useContext(AutocompleteStateContext)?.inputValue;
  return (
    <TextMatchProvider query={query} ignoreAccents>
      {children}
    </TextMatchProvider>
  );
}

/** While loading, the loading row stands alone; a filtered menu with no match says so. */
function useEmptyState({ renderEmptyState, isLoading, filterable }: MenuProps) {
  const strings = useUiStrings();
  if (isLoading) return undefined;
  if (renderEmptyState || !filterable) return renderEmptyState;
  return () => <span {...hooks.slot('empty')}>{strings.noResults}</span>;
}

/**
 * A list of actions or options (React Aria `Menu`), standalone or in a `MenuPopover`. A submenu's
 * `Menu` without its own `onAction` reports to the menu that opens it. It can lead with a search
 * field that filters its items, mark the typed text in their labels, and end with a sentinel that
 * loads more of them.
 */
export function Menu(props: MenuProps) {
  const {
    items,
    children,
    size,
    className,
    onAction,
    filterable,
    highlightMatches = false,
    onLoadMore,
    isLoading,
    ...rest
  } = props;
  const inheritedSize = useContext(MenuSizeContext);
  const inheritedAction = useContext(MenuActionContext);
  const trigger = useSlottedContext(MenuContext);
  const renderEmptyState = useEmptyState(props);
  const resolvedSize = size ?? inheritedSize;
  const action = onAction ?? inheritedAction;
  let menu = (
    <AriaMenu
      {...rest}
      {...hooks.root({ className, props: rest, data: { size: resolvedSize } })}
      onAction={action}
      renderEmptyState={renderEmptyState}
    >
      {children ?? (items ? renderEntries(items, highlightMatches) : null)}
      {onLoadMore || isLoading ? (
        <MenuLoader onLoadMore={onLoadMore} isLoading={isLoading} />
      ) : null}
    </AriaMenu>
  );
  // An explicit `aria-label` names the menu instead of the trigger that would label it.
  if (rest['aria-label'] && trigger && 'aria-labelledby' in trigger) {
    const { 'aria-labelledby': _labelledBy, ...unlabelled } = trigger;
    menu = <MenuContext.Provider value={unlabelled}>{menu}</MenuContext.Provider>;
  }
  if (highlightMatches) menu = <AutocompleteMatches>{menu}</AutocompleteMatches>;
  if (filterable) menu = <MenuFilter isOpenedByTrigger={Boolean(trigger)}>{menu}</MenuFilter>;
  return (
    <MenuSizeContext.Provider value={resolvedSize}>
      <MenuActionContext.Provider value={action}>{menu}</MenuActionContext.Provider>
    </MenuSizeContext.Provider>
  );
}

export { MenuItem, MenuSection, MenuSeparator } from './menu-item.js';
export type {
  MenuItemProps,
  MenuItemRenderProps,
  MenuItemTone,
  MenuSectionProps,
  MenuSeparatorProps,
} from './menu-item.js';
export { MenuPopover } from './menu-popover.js';
export type { MenuPopoverProps } from './menu-popover.js';
export type { MenuSize } from './menu-context.js';
/** Opens a `MenuPopover` from a pressable trigger such as a `Button` (React Aria). */
export { MenuTrigger, SubmenuTrigger } from '../../primitives/index.js';
export type { MenuTriggerProps, SubmenuTriggerProps } from '../../primitives/index.js';
