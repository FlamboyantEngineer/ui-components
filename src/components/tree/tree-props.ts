import type { KeyboardEvent, ReactNode } from 'react';
import type {
  AriaLabellingProps,
  CollectionSelectionProps,
  ExpansionProps,
} from '../../core/events.js';
import type { BaseProps, Key, RefProps, Size } from '../../core/props.js';
import type { TreeMoveItem } from '../../utils/tree-reorder.js';
import type { IconSource } from '../icon/icon.js';
import type { TreeReorderOptions } from './use-tree-reorder.js';

/** The minimal shape of a tree item: a key unique in the tree, and optional children. */
export type TreeItemData = TreeMoveItem<unknown>;

/** A row's state, passed to the render callbacks. */
export interface TreeItemState {
  /** Whether the row's children are shown. */
  isExpanded: boolean;
  /** Whether the row has children, loaded or not. */
  hasChildItems: boolean;
  /** The row's depth, from 1. */
  level: number;
  isSelected: boolean;
  isDisabled: boolean;
  /** Whether the row has keyboard focus. */
  isFocusVisible: boolean;
  /** Whether the row is the current page or item. */
  isCurrent: boolean;
}

/** `chevron` draws chevron-right and chevron-down; `plus-minus` draws plus and minus. */
export type TreeExpandGlyph = 'chevron' | 'plus-minus';
export type TreeSize = Extract<Size, 'sm' | 'md' | 'lg'>;
/** `picker` is a tree the reader chooses one row from; the stylesheet greys out rows that cannot be chosen. */
export type TreeVariant = 'default' | 'picker';

export interface TreeProps<T extends TreeItemData>
  extends
    BaseProps,
    AriaLabellingProps,
    CollectionSelectionProps,
    ExpansionProps,
    RefProps<HTMLDivElement> {
  /** Top-level items. Each item's `id` must be unique in the whole tree. */
  items: readonly T[];
  /** Called with the key of the row the reader activates. */
  onAction?: ((key: Key) => void) | undefined;
  /** Plain text for an item: its accessible name and the text typeahead matches. */
  getTextValue: (item: T) => string;
  /** Children of an item. Defaults to its `children` property. */
  getChildren?: ((item: T) => readonly T[] | undefined) | undefined;
  /** Whether an item without loaded children has some, so it can be expanded to load them. */
  hasChildItems?: ((item: T) => boolean) | undefined;
  /** Whether an expanded item's children are loading: a loading row shows below it. */
  isItemPending?: ((item: T) => boolean) | undefined;
  /**
   * Loads the children of an expanded item that has some but none loaded, once its loading row is
   * in view. While a returned promise is pending the row shows as loading; a rejection shows its
   * message with a retry in the row.
   */
  onLoadChildren?: ((item: T) => unknown) | undefined;
  /** Makes the row itself a link. Navigation goes through the provider's `navigate` when set. */
  getHref?: ((item: T) => string | undefined) | undefined;
  /** The row that is the current page or item: `aria-current` and `data-current`. */
  currentKey?: Key | null | undefined;
  /** An imported icon component or rendered element before the label. */
  getIcon?: ((item: T, state: TreeItemState) => IconSource) | undefined;
  /** The label. Defaults to the text value. */
  renderLabel?: ((item: T, state: TreeItemState) => ReactNode) | undefined;
  /** Secondary text after the label. */
  renderMeta?: ((item: T, state: TreeItemState) => ReactNode) | undefined;
  /** Trailing controls, such as icon buttons, in the row's actions slot. */
  renderActions?: ((item: T, state: TreeItemState) => ReactNode) | undefined;
  /** Persists the uncontrolled expansion through the provider's storage under this key. */
  persistKey?: string | undefined;
  /** Items are loading: publishes `aria-busy`, and an empty tree shows a loading notice. */
  isPending?: boolean | undefined;
  /** The notice an empty tree shows when it is not loading. Without it the tree shows nothing. */
  emptyMessage?: ReactNode;
  /** The expand button's glyphs. Defaults to `chevron`. */
  expandGlyph?: TreeExpandGlyph | undefined;
  /** Row size. Defaults to `sm`. */
  size?: TreeSize | undefined;
  /** Navigation tree or picker. Defaults to `default`. */
  variant?: TreeVariant | undefined;
  /** Let labels wrap instead of keeping them on one line. */
  wrap?: boolean | undefined;
  /** Opt-in reordering by drag and drop and Alt+Arrow keys. Turning it on or off keeps the rows mounted. */
  reorder?: TreeReorderOptions<T> | undefined;
  /** Renders only the rows in view; the stylesheet must bound the tree's height. */
  virtualized?: boolean | undefined;
  /** Row height in pixels for a virtualized tree. Defaults to 28, 32 or 40 by size. */
  rowHeight?: number | undefined;
  /** Draws a selection checkbox in each row while the tree selects. */
  checkboxSelection?: boolean | undefined;
  /**
   * With multiple selection, a row's selection reaches its loaded descendants and a branch is
   * selected exactly when all its children are; a branch with only some selected is indeterminate.
   */
  selectionPropagation?: boolean | undefined;
  /** Shows the rows whose text value matches, with their ancestors and descendants. */
  filterText?: string | undefined;
  /** Whether a text value matches `filterText`. Defaults to holding each of its terms. */
  filter?: ((textValue: string, filterText: string) => boolean) | undefined;
  /** Renames a row from the name field that F2 opens in it. */
  onRename?: ((item: T, name: string) => void) | undefined;
  /** Whether F2 may rename a row. Defaults to every row. */
  canRename?: ((item: T) => boolean) | undefined;
  /** Sees each keydown in a row before the tree does; return `true` to claim the key. */
  onItemKeyDown?: ((item: T, event: KeyboardEvent<HTMLElement>) => boolean) | undefined;
}
