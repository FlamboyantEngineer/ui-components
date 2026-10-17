import {
  isValidElement,
  useCallback,
  useMemo,
  useRef,
  type JSX,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Button as AriaButton,
  Collection,
  Tree as AriaTree,
  TreeItem,
  TreeItemContent,
  TreeLoadMoreItem,
  useLocale,
  type Key,
  type TreeItemContentRenderProps,
  type TreeItemRenderProps,
  type TreeLoadMoreItemRenderProps,
  type TreeProps as AriaTreeProps,
} from 'react-aria-components';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import { usePersistentState, useUiStrings, type PersistCodec } from '../../core/provider.js';
import { getVisibleTreeRows, type TreeMoveDirection } from '../../utils/tree-reorder.js';
import { Icon } from '../icon/icon.js';
import { useTreeReorder, type TreeReorderOptions } from './use-tree-reorder.js';

/** The minimal shape of a tree item: a key unique in the tree, and optional children. */
export interface TreeItemData {
  id: Key;
  children?: readonly unknown[] | undefined;
}

/** A row's state, passed to the render callbacks. */
export interface TreeItemState {
  isExpanded: boolean;
  hasChildItems: boolean;
  /** Depth, from 1 at the top level. */
  level: number;
  isSelected: boolean;
  isDisabled: boolean;
  isFocusVisible: boolean;
  isCurrent: boolean;
}

/** `chevron` draws chevron-right and chevron-down; `plus-minus` draws plus and minus. */
export type TreeExpandGlyph = 'chevron' | 'plus-minus';
export type TreeDensity = 'compact' | 'normal' | 'spaced';
/** `picker` is a tree the reader chooses one row from; the stylesheet greys out rows that cannot be chosen. */
export type TreeVariant = 'default' | 'picker';

type AriaPassThrough<T> = Omit<
  AriaTreeProps<T>,
  | 'items'
  | 'children'
  | 'className'
  | 'style'
  | 'render'
  | 'slot'
  | 'dragAndDropHooks'
  | 'renderEmptyState'
  | 'expandedKeys'
  | 'defaultExpandedKeys'
  | 'onExpandedChange'
>;

export interface TreeProps<T extends TreeItemData> extends AriaPassThrough<T> {
  /** Top-level items. Each item's `id` must be unique in the whole tree. */
  items: readonly T[];
  /** Plain text for an item: its accessible name and the text typeahead matches. */
  getTextValue: (item: T) => string;
  /** Children of an item. Defaults to its `children` property. */
  getChildren?: ((item: T) => readonly T[] | undefined) | undefined;
  /** Whether an item without loaded children has some, so it can be expanded to load them. */
  hasChildItems?: ((item: T) => boolean) | undefined;
  /** Whether an expanded item's children are loading: a loading row shows below it. */
  isItemPending?: ((item: T) => boolean) | undefined;
  /** Makes the row itself a link. Navigation goes through the provider's `navigate` when set. */
  getHref?: ((item: T) => string | undefined) | undefined;
  /** Whether the row is the current page or item: `aria-current` and `data-current`. */
  isItemCurrent?: ((item: T) => boolean) | undefined;
  /** A built-in glyph name or icon node before the label. */
  getIcon?: ((item: T, state: TreeItemState) => GlyphName | ReactNode) | undefined;
  /** The label. Defaults to the text value. */
  renderLabel?: ((item: T, state: TreeItemState) => ReactNode) | undefined;
  /** Secondary text after the label. */
  renderMeta?: ((item: T, state: TreeItemState) => ReactNode) | undefined;
  /** Trailing controls, such as icon buttons, in the row's actions slot. */
  renderActions?: ((item: T, state: TreeItemState) => ReactNode) | undefined;
  /** Expanded rows, controlled. */
  expandedKeys?: Iterable<Key> | undefined;
  /** Rows expanded at first, when uncontrolled and nothing is persisted. */
  defaultExpandedKeys?: Iterable<Key> | undefined;
  onExpandedChange?: ((keys: Set<Key>) => void) | undefined;
  /** Persists the uncontrolled expansion through the provider's storage under this key. */
  persistKey?: string | undefined;
  /** Items are loading: publishes `aria-busy`, and an empty tree shows a loading row. */
  isPending?: boolean | undefined;
  /** Content shown when the tree has no items and is not loading. */
  renderEmptyState?: (() => ReactNode) | undefined;
  /** The expand button's glyphs. Defaults to `chevron`. */
  expandGlyph?: TreeExpandGlyph | undefined;
  /** Row spacing. Defaults to `compact`. */
  density?: TreeDensity | undefined;
  /** Defaults to `default`. */
  variant?: TreeVariant | undefined;
  /** Let labels wrap instead of keeping them on one line. */
  wrap?: boolean | undefined;
  /** Opt-in reordering by drag and drop and Alt+Arrow keys. Turning it on or off remounts the rows. */
  reorder?: TreeReorderOptions<T> | undefined;
  /**
   * Sees each keydown in a row before the tree does. Return `true` to claim the key: the tree then
   * does nothing more with it.
   */
  onItemKeyDown?: ((item: T, event: KeyboardEvent<HTMLElement>) => boolean) | undefined;
  className?: string | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('tree', [
  'item',
  'drag-handle',
  'expand',
  'expand-spacer',
  'icon',
  'label',
  'meta',
  'actions',
  'drop-indicator',
  'loader',
  'empty',
  'spinner',
]);

const keyListCodec: PersistCodec<Key[]> = {
  parse(raw) {
    const value: unknown = JSON.parse(raw);
    if (
      !Array.isArray(value) ||
      !value.every((key) => typeof key === 'string' || typeof key === 'number')
    ) {
      throw new Error('Not a list of keys');
    }
    return value as Key[];
  },
  stringify: (keys) => JSON.stringify(keys),
};

const NO_DEPENDENCIES: readonly unknown[] = [];

const EXPAND_GLYPHS: Record<TreeExpandGlyph, { expanded: GlyphName; collapsed: GlyphName }> = {
  chevron: { expanded: 'chevron-down', collapsed: 'chevron-right' },
  'plus-minus': { expanded: 'minus', collapsed: 'plus' },
};

function defaultGetChildren<T extends TreeItemData>(item: T): readonly T[] | undefined {
  return item.children as readonly T[] | undefined;
}

function isGlyphName(icon: unknown): icon is GlyphName {
  return typeof icon === 'string' && !isValidElement(icon);
}

function hasContent(node: ReactNode): boolean {
  return node !== null && node !== undefined && typeof node !== 'boolean' && node !== '';
}

function isEditable(target: EventTarget): boolean {
  if (!(target instanceof Element)) return false;
  return (
    target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') !==
    null
  );
}

function arrowDirection(key: string, rtl: boolean): TreeMoveDirection | null {
  if (key === 'ArrowUp') return 'up';
  if (key === 'ArrowDown') return 'down';
  if (key === 'ArrowRight') return rtl ? 'out' : 'in';
  if (key === 'ArrowLeft') return rtl ? 'in' : 'out';
  return null;
}

const levelStyle = ({ level }: TreeItemRenderProps | TreeLoadMoreItemRenderProps) =>
  measuredProperty('tree-level', String(level));

/**
 * A hierarchy of rows built on React Aria's `Tree`: expand and collapse, selection, keyboard
 * navigation and typeahead, link rows, optional persisted expansion, loading and empty states, an
 * actions slot per row, and opt-in reordering. Items are plain data; render callbacks draw them.
 */
export function Tree<T extends TreeItemData>({
  items,
  getTextValue,
  getChildren = defaultGetChildren,
  hasChildItems,
  isItemPending,
  getHref,
  isItemCurrent,
  getIcon,
  renderLabel,
  renderMeta,
  renderActions,
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  persistKey,
  isPending = false,
  renderEmptyState,
  expandGlyph = 'chevron',
  density = 'compact',
  variant = 'default',
  wrap = false,
  reorder,
  onItemKeyDown,
  className,
  ref,
  dependencies = NO_DEPENDENCIES,
  disabledKeys,
  ...rest
}: TreeProps<T>) {
  const strings = useUiStrings();
  const { direction } = useLocale();
  const isControlled = expandedKeys !== undefined;
  const [storedKeys, setStoredKeys] = usePersistentState<Key[]>(
    persistKey,
    () => (defaultExpandedKeys ? [...defaultExpandedKeys] : []),
    keyListCodec,
  );
  const expanded = useMemo(
    () => new Set<Key>(isControlled ? expandedKeys : storedKeys),
    [isControlled, expandedKeys, storedKeys],
  );

  const setExpanded = useCallback(
    (keys: Set<Key>) => {
      if (!isControlled) setStoredKeys([...keys]);
      onExpandedChange?.(keys);
    },
    [isControlled, setStoredKeys, onExpandedChange],
  );
  const expand = useCallback(
    (key: Key) => {
      if (!expanded.has(key)) setExpanded(new Set([...expanded, key]));
    },
    [expanded, setExpanded],
  );

  const hasReorder = reorder !== undefined;
  const canMove = reorder?.canMove;
  const disabled = useMemo(() => new Set<Key>(disabledKeys ?? []), [disabledKeys]);
  const rows = useMemo(
    () =>
      hasReorder
        ? getVisibleTreeRows(items, {
            expandedKeys: expanded,
            getChildren,
            isMovable: (item) => !disabled.has(item.id) && (canMove?.(item) ?? true),
          })
        : [],
    [hasReorder, canMove, items, expanded, getChildren, disabled],
  );
  const reordering = useTreeReorder({
    rows,
    reorder,
    expand,
    getTextValue,
    dropIndicatorClassName: hooks.slotClass('drop-indicator'),
  });

  const rowItems = useRef(new WeakMap<Element, T>());

  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((!onItemKeyDown && !reorder) || isEditable(event.target)) return;
    const row = event.target instanceof Element ? event.target.closest('[role="row"]') : null;
    const item = row ? rowItems.current.get(row) : undefined;
    if (!item) return;
    if (onItemKeyDown?.(item, event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!reorder || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const moveDirection = arrowDirection(event.key, direction === 'rtl');
    if (moveDirection && reordering.moveByKeyboard(item.id, moveDirection)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const { isMovable, keyShortcuts } = reordering;

  const renderRow = useCallback(
    (item: T, values: TreeItemContentRenderProps, isCurrent: boolean) => {
      const state: TreeItemState = {
        isExpanded: values.isExpanded,
        hasChildItems: values.hasChildItems,
        level: values.level,
        isSelected: values.isSelected,
        isDisabled: values.isDisabled,
        isFocusVisible: values.isFocusVisible,
        isCurrent,
      };
      const icon = getIcon?.(item, state);
      const meta = renderMeta?.(item, state);
      const actions = renderActions?.(item, state);
      const glyphs = EXPAND_GLYPHS[expandGlyph];
      return (
        <>
          {hasReorder ? (
            <AriaButton
              slot="drag"
              className={hooks.slotClass('drag-handle')}
              excludeFromTabOrder
              isDisabled={!isMovable(item.id)}
            >
              <Icon glyph="drag-handle" size="sm" />
            </AriaButton>
          ) : null}
          {state.hasChildItems ? (
            <AriaButton
              slot="chevron"
              className={hooks.slotClass('expand')}
              aria-label={state.isExpanded ? strings.collapse : strings.expand}
            >
              <Icon glyph={state.isExpanded ? glyphs.expanded : glyphs.collapsed} size="sm" />
            </AriaButton>
          ) : (
            <span {...hooks.slot('expand-spacer')} aria-hidden="true" />
          )}
          {hasContent(icon) ? (
            isGlyphName(icon) ? (
              <Icon glyph={icon} className={hooks.slotClass('icon')} />
            ) : (
              <Icon className={hooks.slotClass('icon')}>{icon}</Icon>
            )
          ) : null}
          <span {...hooks.slot('label')}>
            {renderLabel ? renderLabel(item, state) : getTextValue(item)}
          </span>
          {hasContent(meta) ? <span {...hooks.slot('meta')}>{meta}</span> : null}
          {hasContent(actions) ? <span {...hooks.slot('actions')}>{actions}</span> : null}
        </>
      );
    },
    [
      getIcon,
      renderMeta,
      renderActions,
      renderLabel,
      getTextValue,
      expandGlyph,
      strings,
      hasReorder,
      isMovable,
    ],
  );

  const renderItem = useCallback(
    function render(item: T): ReactElement {
      const children = getChildren(item);
      const hasLoadedChildren = Boolean(children && children.length > 0);
      const isLazy = !hasLoadedChildren && (hasChildItems?.(item) ?? false);
      const href = getHref?.(item);
      const isCurrent = isItemCurrent?.(item) ?? false;
      const movable = hasReorder && isMovable(item.id);
      const renderElement = (domProps: JSX.IntrinsicElements['div']) => {
        const { draggable, onDragStart, onDrag, onDragEnd, ...others } = domProps;
        return (
          <div
            {...others}
            {...(movable ? { draggable, onDragStart, onDrag, onDragEnd } : {})}
            data-current={isCurrent || undefined}
            aria-current={isCurrent ? (href ? 'page' : true) : undefined}
            aria-keyshortcuts={movable ? keyShortcuts : undefined}
          />
        );
      };
      return (
        <TreeItem
          id={item.id}
          textValue={getTextValue(item)}
          href={href}
          hasChildItems={isLazy || undefined}
          className={hooks.slotClass('item')}
          style={levelStyle}
          render={renderElement}
          ref={(node: HTMLDivElement | null) => {
            if (node) rowItems.current.set(node, item);
          }}
        >
          <TreeItemContent>{(values) => renderRow(item, values, isCurrent)}</TreeItemContent>
          {children && hasLoadedChildren ? (
            // React Aria caches rendered items until a dependency changes: the render function is one.
            <Collection items={children} dependencies={[render, ...dependencies]}>
              {render}
            </Collection>
          ) : null}
          {isLazy ? (
            // React Aria's loader child makes a row without loaded children expandable.
            <TreeLoadMoreItem
              className={hooks.slotClass('loader')}
              style={levelStyle}
              isLoading={isItemPending?.(item) ?? false}
            >
              <span {...hooks.slot('spinner')} aria-hidden="true" />
              {strings.loading}
            </TreeLoadMoreItem>
          ) : null}
        </TreeItem>
      );
    },
    [
      getChildren,
      hasChildItems,
      isItemPending,
      getHref,
      isItemCurrent,
      getTextValue,
      hasReorder,
      isMovable,
      keyShortcuts,
      renderRow,
      strings,
      dependencies,
    ],
  );

  const rootDependencies = useMemo(() => [renderItem, ...dependencies], [renderItem, dependencies]);

  const emptyState =
    isPending || renderEmptyState
      ? () => (
          <div {...hooks.slot('empty', { pending: isPending })}>
            {isPending ? (
              <>
                <span {...hooks.slot('spinner')} aria-hidden="true" />
                {strings.loading}
              </>
            ) : (
              renderEmptyState?.()
            )}
          </div>
        )
      : undefined;

  return (
    <AriaTree
      // React Aria keeps drag and drop hooks for the tree's lifetime: remount when reordering toggles.
      key={reorder ? 'reorderable' : 'fixed'}
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: { density, variant, expandGlyph, wrap, pending: isPending },
      })}
      ref={ref}
      items={items}
      disabledKeys={disabledKeys}
      dependencies={rootDependencies}
      expandedKeys={expanded}
      onExpandedChange={setExpanded}
      renderEmptyState={emptyState}
      {...(reorder ? { dragAndDropHooks: reordering.dragAndDropHooks } : {})}
      render={(domProps) => (
        <div
          {...domProps}
          aria-busy={isPending || undefined}
          onKeyDownCapture={(event) => {
            onKeyDownCapture(event);
            if (!event.isPropagationStopped()) domProps.onKeyDownCapture?.(event);
          }}
        />
      )}
    >
      {renderItem}
    </AriaTree>
  );
}
