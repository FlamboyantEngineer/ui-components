import { useCallback, useMemo, type JSX, type ReactElement, type ReactNode } from 'react';
import {
  Button as AriaButton,
  Collection,
  TreeItem,
  TreeItemContent,
  TreeLoadMoreItem,
  type Key,
  type TreeItemContentRenderProps,
  type TreeItemRenderProps,
  type TreeLoadMoreItemRenderProps,
} from 'react-aria-components';
import type { GlyphName } from '../../core/glyphs.js';
import { measuredProperty } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { DragHandle } from '../drag-handle/drag-handle.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { Icon, toIconProps } from '../icon/icon.js';
import type { TreeExpandGlyph, TreeItemData, TreeItemState, TreeProps } from './tree.js';
import { treeHooks as hooks } from './tree-hooks.js';
import type { TreeKeyDown } from './use-tree-key-down.js';
import type { TreeReorder } from './use-tree-reorder.js';

/** The props and tree state that draw each row. */
export interface TreeRowOptions<T extends TreeItemData> extends Pick<
  TreeProps<T>,
  | 'getTextValue'
  | 'hasChildItems'
  | 'isItemPending'
  | 'getHref'
  | 'isItemCurrent'
  | 'getIcon'
  | 'renderLabel'
  | 'renderMeta'
  | 'renderActions'
> {
  /** Children of an item. */
  getChildren: (item: T) => readonly T[] | undefined;
  /** The expand button's glyphs. */
  expandGlyph: TreeExpandGlyph;
  /** Values that, when they change, redraw every row. */
  dependencies: readonly unknown[];
  /** Reordering, while the tree is reorderable. */
  reordering: TreeReorder<T> | null;
  /** Records which item a row element draws. */
  registerRow: TreeKeyDown<T>['registerRow'];
}

/** What a row element marks on top of React Aria's props. */
interface RowElementOptions {
  isMovable: boolean;
  isCurrent: boolean;
  href: string | undefined;
  keyShortcuts: string | undefined;
}

type RowContentOptions<T extends TreeItemData> = Pick<
  TreeRowOptions<T>,
  'getTextValue' | 'getIcon' | 'renderLabel' | 'renderMeta' | 'renderActions' | 'expandGlyph'
> & { isMovable: (key: Key) => boolean; hasReorder: boolean };

const expandGlyphs: Record<TreeExpandGlyph, { expanded: GlyphName; collapsed: GlyphName }> = {
  chevron: { expanded: 'chevron-down', collapsed: 'chevron-right' },
  'plus-minus': { expanded: 'minus', collapsed: 'plus' },
};

const getLevelStyle = ({ level }: TreeItemRenderProps | TreeLoadMoreItemRenderProps) =>
  measuredProperty('tree-level', String(level));

function toItemState(values: TreeItemContentRenderProps, isCurrent: boolean): TreeItemState {
  const { isExpanded, hasChildItems, level, isSelected, isDisabled, isFocusVisible } = values;
  return { isExpanded, hasChildItems, level, isSelected, isDisabled, isFocusVisible, isCurrent };
}

/**
 * The row element: React Aria's props, without its drag handlers when the row cannot move, plus
 * the current-row marks and the keyboard moves a movable row announces.
 */
function createRowElement({ isMovable, isCurrent, href, keyShortcuts }: RowElementOptions) {
  return (domProps: JSX.IntrinsicElements['div']) => {
    const { draggable, onDragStart, onDrag, onDragEnd, ...others } = domProps;
    return (
      <div
        {...others}
        {...(isMovable ? { draggable, onDragStart, onDrag, onDragEnd } : {})}
        data-current={isCurrent || undefined}
        aria-current={isCurrent ? (href ? 'page' : true) : undefined}
        aria-keyshortcuts={isMovable ? keyShortcuts : undefined}
      />
    );
  };
}

/** The expand button of a row with children, or a spacer holding its place. */
function TreeExpandButton({ state, glyph }: { state: TreeItemState; glyph: TreeExpandGlyph }) {
  const strings = useUiStrings();
  if (!state.hasChildItems) return <span {...hooks.slot('expand-spacer')} aria-hidden="true" />;
  const glyphs = expandGlyphs[glyph];
  return (
    <AriaButton
      slot="chevron"
      className={hooks.slotClass('expand')}
      aria-label={state.isExpanded ? strings.collapse : strings.expand}
    >
      <Icon glyph={state.isExpanded ? glyphs.expanded : glyphs.collapsed} size="sm" />
    </AriaButton>
  );
}

/** One row's anatomy: drag handle, expand button or spacer, icon, label, meta and actions. */
function TreeRowContent<T extends TreeItemData>(props: {
  item: T;
  state: TreeItemState;
  options: RowContentOptions<T>;
}) {
  const { item, state, options } = props;
  const icon = options.getIcon?.(item, state);
  const meta = options.renderMeta?.(item, state);
  const actions = options.renderActions?.(item, state);
  const label = options.renderLabel ? options.renderLabel(item, state) : options.getTextValue(item);
  return (
    <>
      {options.hasReorder ? (
        <DragHandle
          className={hooks.slotClass('drag-handle')}
          isDisabled={!options.isMovable(item.id)}
        />
      ) : null}
      <TreeExpandButton state={state} glyph={options.expandGlyph} />
      {isEmptyNode(icon) ? null : (
        <Icon {...toIconProps(icon)} className={hooks.slotClass('icon')} />
      )}
      <span {...hooks.slot('label')}>{label}</span>
      {isEmptyNode(meta) ? null : <span {...hooks.slot('meta')}>{meta}</span>}
      {isEmptyNode(actions) ? null : <span {...hooks.slot('actions')}>{actions}</span>}
    </>
  );
}

/** The loading row below an expanded row whose children are not loaded yet. */
function TreeLoaderRow({ isLoading }: { isLoading: boolean }) {
  const strings = useUiStrings();
  return (
    <TreeLoadMoreItem
      className={hooks.slotClass('loader')}
      style={getLevelStyle}
      isLoading={isLoading}
    >
      <EmptyState variant="loading" size="sm" description={strings.loading} />
    </TreeLoadMoreItem>
  );
}

/** The notice an empty tree shows: a loading notice while pending, else the caller's message. */
export function TreeEmptyState(props: { isPending: boolean; emptyMessage: ReactNode }) {
  const strings = useUiStrings();
  return (
    <EmptyState
      variant={props.isPending ? 'loading' : 'empty'}
      size="sm"
      description={props.isPending ? strings.loading : props.emptyMessage}
      className={hooks.slotClass('empty')}
    />
  );
}

/**
 * Draws an item as a row with its loaded children nested below it, or with a loading row when it
 * has children that are not loaded yet.
 */
export function useTreeItemRenderer<T extends TreeItemData>(
  options: TreeRowOptions<T>,
): (item: T) => ReactElement {
  const { getTextValue, getIcon, renderLabel, renderMeta, renderActions, expandGlyph } = options;
  const { getChildren, hasChildItems, isItemPending, getHref, isItemCurrent } = options;
  const { dependencies, reordering, registerRow } = options;
  const isMovable = reordering?.isMovable;
  const content = useMemo<RowContentOptions<T>>(
    () => ({
      getTextValue,
      getIcon,
      renderLabel,
      renderMeta,
      renderActions,
      expandGlyph,
      isMovable: isMovable ?? (() => false),
      hasReorder: isMovable !== undefined,
    }),
    [getTextValue, getIcon, renderLabel, renderMeta, renderActions, expandGlyph, isMovable],
  );
  const keyShortcuts = reordering?.keyShortcuts;
  return useCallback(
    function renderItem(item: T): ReactElement {
      const children = getChildren(item) ?? [];
      const isLazy = children.length === 0 && (hasChildItems?.(item) ?? false);
      const href = getHref?.(item);
      const isCurrent = isItemCurrent?.(item) ?? false;
      const rowElement = { isMovable: content.isMovable(item.id), isCurrent, href, keyShortcuts };
      return (
        <TreeItem
          id={item.id}
          textValue={getTextValue(item)}
          href={href}
          hasChildItems={isLazy || undefined}
          className={hooks.slotClass('item')}
          style={getLevelStyle}
          render={createRowElement(rowElement)}
          ref={(node: HTMLDivElement | null) => registerRow(node, item)}
        >
          <TreeItemContent>
            {(values) => (
              <TreeRowContent
                item={item}
                state={toItemState(values, isCurrent)}
                options={content}
              />
            )}
          </TreeItemContent>
          {children.length > 0 ? (
            // React Aria caches rendered items until a dependency changes: the render function is one.
            <Collection items={children} dependencies={[renderItem, ...dependencies]}>
              {renderItem}
            </Collection>
          ) : null}
          {isLazy ? <TreeLoaderRow isLoading={isItemPending?.(item) ?? false} /> : null}
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
      content,
      keyShortcuts,
      registerRow,
      dependencies,
    ],
  );
}
