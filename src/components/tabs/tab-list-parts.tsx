'use client';

import {
  type ComponentProps,
  createContext,
  Fragment,
  type JSX,
  type ReactNode,
  type RefObject,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import {
  type CollectionRenderer,
  CollectionRendererContext,
  TabList as AriaTabList,
} from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { isElement } from '../../utils/is-element.js';
import { keyCollectionChildren } from '../../utils/key-collection-children.js';
import {
  type TabActions,
  TabActionsContext,
  type TabListModel,
  TabsSharedContext,
} from './tab-actions.js';
import { tabsHooks as hooks } from './tab-hooks.js';
import type { TabListProps } from './tab-list.js';
import { useRemovedTabSuccessor } from './tab-selection.js';

type Part = { id: string; key: Key; kind: 'tab' | 'action'; content?: ReactNode };

export interface TabListPartsModel {
  parts: readonly Part[];
  ids: readonly string[];
  byId: ReadonlyMap<string, Part>;
}

/** Actions have identities separate from selection keys, including typed and whitespace keys. */
export function useTabListParts(
  state: TabListModel | null,
  renderAfterTab: ((key: Key) => ReactNode) | undefined,
): TabListPartsModel | null {
  const collection = state?.collection;
  return useMemo(() => {
    if (!collection || !renderAfterTab) return null;
    const parts: Part[] = [];
    for (const node of collection) {
      parts.push({ id: JSON.stringify(['tab', node.key]), key: node.key, kind: 'tab' });
      const content = renderAfterTab(fromCollectionKey(node.key));
      if (content != null && content !== false)
        parts.push({
          id: JSON.stringify(['action', node.key]),
          key: node.key,
          kind: 'action',
          content,
        });
    }
    if (!parts.some((part) => part.kind === 'action')) return null;
    return {
      parts,
      ids: parts.map((part) => part.id),
      byId: new Map(parts.map((part) => [part.id, part])),
    };
  }, [collection, renderAfterTab]);
}

interface PartsContextValue {
  model: TabListPartsModel | null;
  tabKeys: ReadonlySet<Key> | null;
  visible: ReadonlySet<string> | null;
  outer: CollectionRenderer;
}

const PartsContext = createContext<PartsContextValue | null>(null);
type CollectionRootProps = ComponentProps<CollectionRenderer['CollectionRoot']>;

/** One measured element per part; actions stay independent of whether their tab is rendered. */
function PartsRoot(props: CollectionRootProps) {
  const { collection } = props;
  const value = useContext(PartsContext);
  if (!value) return null;
  if (!value.model) {
    const OuterRoot = value.outer.CollectionRoot;
    return (
      <CollectionRendererContext value={value.outer}>
        {value.tabKeys ? (
          [...collection]
            .filter((node) => value.tabKeys?.has(node.key))
            .map((node) => <Fragment key={String(node.key)}>{node.render?.(node)}</Fragment>)
        ) : (
          <OuterRoot {...props} />
        )}
      </CollectionRendererContext>
    );
  }
  const nodes = new Map([...collection].map((node) => [node.key, node]));
  return (
    <CollectionRendererContext value={value.outer}>
      {value.model.parts.map((part) => {
        if (value.visible && !value.visible.has(part.id)) return null;
        const node = nodes.get(part.key);
        return (
          <Fragment key={part.id}>
            {part.kind === 'tab' ? (
              node?.render?.(node)
            ) : (
              <span {...hooks.slot('action')}>{part.content}</span>
            )}
          </Fragment>
        );
      })}
    </CollectionRendererContext>
  );
}

/** Collection children commit late; update ownership on actual mounted IDs, never guessed IDs. */
function useOwnedTabIds(listRef: RefObject<HTMLElement | null>, enabled: boolean): string {
  const [ids, setIds] = useState('');
  const currentIds = useRef('');
  useLayoutEffect(() => {
    const element = listRef.current;
    if (!enabled || !element) return undefined;
    const sync = () => {
      const next = [...element.querySelectorAll<HTMLElement>('.ui-tabs__tab[role="tab"]')]
        .filter((tab) => tab.id && tab.closest('.ui-tabs__list') === element)
        .map((tab) => tab.id)
        .join(' ');
      if (currentIds.current !== next) {
        currentIds.current = next;
        setIds(next);
      }
    };
    sync();
    const Observer = element.ownerDocument.defaultView?.MutationObserver;
    if (!Observer) return undefined;
    const observer = new Observer(sync);
    observer.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id', 'role'],
    });
    return () => observer.disconnect();
  });
  return ids;
}

interface TabListPartsProps extends BaseProps {
  model: TabListPartsModel | null;
  visible: ReadonlySet<string> | null;
  tabKeys: ReadonlySet<Key> | null;
  listRef: RefObject<HTMLElement | null>;
  label: AriaLabellingProps;
  children: ReactNode;
}

/** Leave ordinary parts to their own keys and let browser Tab order visit their controls. */
export function withTabActionEvents(
  props: JSX.IntrinsicElements['div'],
): JSX.IntrinsicElements['div'] {
  const isAction = (target: EventTarget) =>
    isElement(target) && Boolean(target.closest('.ui-tabs__action'));
  return {
    ...props,
    onFocus: (event) => {
      if (!isAction(event.target)) props.onFocus?.(event);
    },
    onKeyDown: (event) => {
      if (event.key === 'Tab' || isAction(event.target)) return;
      props.onKeyDown?.(event);
    },
    onKeyDownCapture: (event) => {
      if (event.key === 'Tab' || isAction(event.target)) return;
      props.onKeyDownCapture?.(event);
    },
  };
}

/** React Aria builds its collection before mounting the visible list and its action parts. */
export function TabListCollection({ actions, ...props }: TabListProps & { actions: TabActions }) {
  return (
    <TabActionsContext value={actions}>
      <AriaTabList {...props}>{keyCollectionChildren(props.children)}</AriaTabList>
    </TabActionsContext>
  );
}

/**
 * Publish committed collection state before the overlays read it in their layout effects, and
 * select the tab that follows a removed selected one.
 */
export function TabListStateSync({ state }: { state: TabListModel }) {
  const { stateRef } = useContext(TabsSharedContext);
  useRemovedTabSuccessor(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  });
  return null;
}

/** The visual list retains its geometry and handlers; the semantic list owns only native tabs. */
export function TabListParts({
  model,
  visible,
  tabKeys,
  listRef,
  label,
  children,
}: TabListPartsProps) {
  const { orientation } = useContext(TabsSharedContext);
  const outer = useContext(CollectionRendererContext);
  const renderer = useMemo<CollectionRenderer>(
    () => ({ ...outer, CollectionRoot: PartsRoot }),
    [outer],
  );
  const value = useMemo(
    () => ({ model, visible, tabKeys, outer }),
    [model, visible, tabKeys, outer],
  );
  const ids = useOwnedTabIds(listRef, model !== null);
  return (
    <PartsContext value={value}>
      <CollectionRendererContext value={renderer}>
        {model ? (
          <div
            {...hooks.slot('owner')}
            role="tablist"
            aria-label={label['aria-label']}
            aria-labelledby={label['aria-labelledby']}
            aria-describedby={label['aria-describedby']}
            aria-details={label['aria-details']}
            aria-orientation={orientation}
            aria-owns={ids || undefined}
          />
        ) : null}
        {children}
      </CollectionRendererContext>
    </PartsContext>
  );
}
