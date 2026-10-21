import { createContext, useContext, type ReactElement, type ReactNode } from 'react';
import {
  Autocomplete,
  AutocompleteStateContext,
  Input,
  ListLayout,
  Menu as AriaMenu,
  MenuContext,
  MenuLoadMoreItem,
  MenuTrigger as AriaMenuTrigger,
  SearchField,
  SubmenuTrigger as AriaSubmenuTrigger,
  useFilter,
  useSlottedContext,
  Virtualizer,
} from '../../primitives/index.js';
import type { AriaLabellingProps, OpenStateProps, SelectionProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { TextMatch, TextMatchProvider } from '../text-match/text-match.js';
import { MenuSizeContext, type MenuSize } from './menu-context.js';
import {
  MenuItem,
  MenuSection,
  MenuSeparator,
  type MenuItemProps,
  type MenuItemRenderState,
  type MenuSectionProps,
} from './menu-item.js';
import { MenuPopover } from './menu-popover.js';
import { MenuTriggerPress } from './menu-trigger-press.js';

/** One action described as data. With `items` it opens a submenu of those entries. */
export interface MenuItemEntry extends Omit<MenuItemProps, 'id' | 'children' | 'textValue'> {
  type?: 'item' | undefined;
  id: Key;
  /** The visible label, also used for type-to-select. */
  label: string;
  items?: readonly MenuEntry[] | undefined;
  /** Custom content, drawn instead of the default layout. */
  renderContent?: ((state: MenuItemRenderState) => ReactNode) | undefined;
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

export interface MenuProps extends BaseProps, AriaLabellingProps, SelectionProps {
  /** Entries as data, used when there are no `children`. */
  items?: readonly MenuEntry[] | undefined;
  /** `MenuItem`, `MenuSection`, `MenuSeparator` and `SubmenuTrigger` elements. */
  children?: ReactNode;
  /** Called with the `id` of the item activated. A submenu without its own reports here. */
  onAction?: ((key: Key) => void) | undefined;
  /** Whether activating an item closes the menu. Defaults to true, except in multiple selection. */
  shouldCloseOnSelect?: boolean | undefined;
  /** Shown while the menu has no items. */
  renderEmptyState?: (() => ReactNode) | undefined;
  /** Row density. Submenus inherit it. Defaults to `md`. */
  size?: MenuSize | undefined;
  /** Leads the menu with a search field that narrows the items while focus stays in it. */
  filterable?: boolean | undefined;
  /** Marks the text typed in the enclosing search field (its own, or a command palette's) in the labels. */
  highlightMatches?: boolean | undefined;
  /** Renders only the rows in view of the scroll container, for long menus. */
  virtualized?: boolean | undefined;
  /** The height of every row of a virtualized menu, in pixels. Defaults to 24, 28 or 32 by `size`. */
  rowHeight?: number | undefined;
  /** Called when the end of the menu scrolls into view while `isLoading` is false. */
  onLoadMore?: (() => void) | undefined;
  /** More items are loading: the menu ends with a loading row. */
  isLoading?: boolean | undefined;
}

/** A trigger and the `MenuPopover` it opens. */
export interface MenuTriggerProps extends OpenStateProps {
  /** The trigger (a `Button`, an `IconButton` or another pressable), then its `MenuPopover`. */
  children: ReactNode;
}

/** A `MenuItem` and the submenu it opens. */
export interface SubmenuTriggerProps {
  /** The `MenuItem` that opens the submenu, then the submenu's `MenuPopover`. */
  children: ReactElement[];
}

const hooks = createHooks('menu', [
  'search',
  'search-input',
  'empty',
  'load-more',
  'load-more-spinner',
]);

const MenuActionContext = createContext<MenuProps['onAction']>(undefined);

const defaultRowHeights: Record<MenuSize, number> = { sm: 24, md: 28, lg: 32 };

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

/** Renders only the rows in view (React Aria `Virtualizer` with a list layout). */
function MenuVirtualizer({
  rowHeight,
  children,
}: {
  rowHeight: number | undefined;
  children: ReactElement;
}) {
  const size = useContext(MenuSizeContext);
  const height = rowHeight ?? defaultRowHeights[size];
  return (
    <Virtualizer layout={ListLayout} layoutOptions={{ rowHeight: height, loaderHeight: height }}>
      {children}
    </Virtualizer>
  );
}

/**
 * A list of actions or options (React Aria `Menu`), standalone or in a `MenuPopover`. A submenu's
 * `Menu` without its own `onAction` reports to the menu that opens it. It can lead with a search
 * field that filters its items, mark the typed text in their labels, render only the rows in view,
 * and end with a sentinel that loads more of them.
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
    virtualized = false,
    rowHeight,
    onLoadMore,
    isLoading,
    ...rest
  } = props;
  const inheritedSize = useContext(MenuSizeContext);
  const inheritedAction = useContext(MenuActionContext);
  const resolvedSize = size ?? inheritedSize;
  const action = onAction ?? inheritedAction;
  const trigger = useSlottedContext(MenuContext);
  const renderEmptyState = useEmptyState(props);
  let menu = (
    <AriaMenu
      {...rest}
      {...hooks.root({ className, props: rest, data: { size: resolvedSize, virtualized } })}
      onAction={action}
      renderEmptyState={renderEmptyState}
    >
      {children ?? (items ? renderEntries(items, highlightMatches) : null)}
      {onLoadMore || isLoading ? (
        <MenuLoader onLoadMore={onLoadMore} isLoading={isLoading} />
      ) : null}
    </AriaMenu>
  );
  if (virtualized) menu = <MenuVirtualizer rowHeight={rowHeight}>{menu}</MenuVirtualizer>;
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

/**
 * Opens its `MenuPopover` from its trigger (React Aria `MenuTrigger`): on press, Enter or Space,
 * and on Arrow Down or Arrow Up, which focus the first or last item.
 */
export function MenuTrigger({ children, ...openState }: MenuTriggerProps) {
  return (
    <AriaMenuTrigger {...openState}>
      <MenuTriggerPress>{children}</MenuTriggerPress>
    </AriaMenuTrigger>
  );
}

/** Makes its `MenuItem` open the `MenuPopover` beside it (React Aria `SubmenuTrigger`). */
export function SubmenuTrigger({ children }: SubmenuTriggerProps) {
  return <AriaSubmenuTrigger>{children}</AriaSubmenuTrigger>;
}

export { MenuItem, MenuSection, MenuSeparator } from './menu-item.js';
export type {
  MenuItemProps,
  MenuItemRenderState,
  MenuItemTone,
  MenuSectionProps,
  MenuSeparatorProps,
} from './menu-item.js';
export { MenuOverlay, MenuPopover } from './menu-popover.js';
export type { MenuOverlayProps, MenuPopoverProps } from './menu-popover.js';
export type { MenuSize } from './menu-context.js';

export { joinMenuGroups } from './menu-groups.js';
