import {
  createContext,
  useCallback,
  useContext,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Button as AriaButton } from 'react-aria-components';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { UiLink } from '../../core/provider.js';
import { IconLabel } from '../icon-label/icon-label.js';

const listHooks = createHooks('list');
const rowHooks = createHooks('list-row', ['primary', 'trailing']);
const contentHooks = createHooks('list-row-content', ['leading', 'text', 'title', 'meta']);

const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End']);

type DataProps = { [data: `data-${string}`]: string | number | boolean | undefined };

/** Imperative access to a `List`. */
export interface ListHandle {
  /** Moves focus to the first enabled row. */
  focusFirst(): void;
}

export interface ListProps extends DataProps {
  /** `ListRow` elements, directly or inside wrappers. */
  children?: ReactNode;
  /** Names the list. A list needs `aria-label` or `aria-labelledby`. */
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  /** The rows are being loaded or updated: publishes `aria-busy` and `data-pending`. */
  isPending?: boolean | undefined;
  /** Ask the stylesheet for dividers between rows. */
  divided?: boolean | undefined;
  /** Called on ArrowUp from the first row, e.g. to return focus to an associated search field. */
  onNavigatePastStart?: (() => void) | undefined;
  /** Receives `focusFirst()`, e.g. for a search field that hands focus to the results. */
  handleRef?: Ref<ListHandle> | undefined;
  className?: string | undefined;
  id?: string | undefined;
  ref?: Ref<HTMLUListElement> | undefined;
}

interface ListContextValue {
  register(id: string, node: HTMLElement): () => void;
  subscribe(id: string, listener: () => void): () => void;
  getActiveId(): string | null;
  activate(id: string): void;
}

const ListContext = createContext<ListContextValue | null>(null);

/** Which row holds the single tab stop. Rows subscribe by id, so a move re-renders only two rows. */
function createActiveRowStore() {
  let activeId: string | null = null;
  const listeners = new Map<string, Set<() => void>>();
  const notify = (id: string | null) => {
    if (id === null) return;
    for (const listener of listeners.get(id) ?? []) listener();
  };
  return {
    getActiveId: () => activeId,
    subscribe(id: string, listener: () => void) {
      const set = listeners.get(id) ?? new Set<() => void>();
      listeners.set(id, set);
      set.add(listener);
      return () => {
        set.delete(listener);
        if (set.size === 0) listeners.delete(id);
      };
    },
    setActiveId(next: string | null) {
      if (next === activeId) return;
      const previous = activeId;
      activeId = next;
      notify(previous);
      notify(next);
    },
  };
}

/** Neighbours of `id` in `order`, nearest first, the next one before the previous at equal distance. */
function neighboursOf(order: readonly string[], id: string): string[] {
  const index = order.indexOf(id);
  if (index < 0) return [];
  const result: string[] = [];
  for (let distance = 1; distance < order.length; distance += 1) {
    const after = order[index + distance];
    if (after !== undefined) result.push(after);
    const before = index - distance >= 0 ? order[index - distance] : undefined;
    if (before !== undefined) result.push(before);
  }
  return result;
}

/**
 * A native list of rows with one tab stop: ArrowUp, ArrowDown, Home and End move focus between the
 * rows' primary controls, skipping disabled rows. Links, buttons and trailing controls keep their
 * ordinary roles.
 */
export function List({
  children,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  isPending = false,
  divided = false,
  onNavigatePastStart,
  handleRef,
  className,
  id,
  ref,
  ...rest
}: ListProps) {
  const listRef = useRef<HTMLUListElement | null>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const order = useRef<string[]>([]);
  const focusedId = useRef<string | null>(null);
  const [store] = useState(createActiveRowStore);

  /** Registered primaries in document order; also refreshes the order snapshot used for recovery. */
  const ordered = useCallback((): Array<[string, HTMLElement]> => {
    const list = listRef.current;
    if (!list) return [];
    const ids = new Map<HTMLElement, string>();
    for (const [rowId, node] of nodes.current) ids.set(node, rowId);
    const rows: Array<[string, HTMLElement]> = [];
    for (const node of list.querySelectorAll<HTMLElement>(`.${rowHooks.slotClass('primary')}`)) {
      const rowId = ids.get(node);
      if (rowId !== undefined) rows.push([rowId, node]);
    }
    order.current = rows.map(([rowId]) => rowId);
    return rows;
  }, []);

  const register = useCallback(
    (rowId: string, node: HTMLElement) => {
      nodes.current.set(rowId, node);
      if (store.getActiveId() === null) store.setActiveId(rowId);
      queueMicrotask(ordered);
      return () => {
        // The order snapshot still holds the row: compute its neighbours before it is gone.
        const neighbours = neighboursOf(order.current, rowId);
        if (nodes.current.get(rowId) === node) nodes.current.delete(rowId);
        queueMicrotask(() => {
          if (!listRef.current?.isConnected) return;
          // The same row may register a replacement primary (an action becoming a link).
          const nextId =
            [rowId, ...neighbours].find((candidate) => nodes.current.has(candidate)) ??
            ordered()[0]?.[0] ??
            null;
          if (store.getActiveId() === rowId) store.setActiveId(nextId);
          const doc = node.ownerDocument;
          if (focusedId.current !== rowId) return;
          if (doc.activeElement !== null && doc.activeElement !== doc.body) return;
          if (nextId === null) focusedId.current = null;
          else nodes.current.get(nextId)?.focus();
        });
      };
    },
    [store, ordered],
  );

  // Keyed moves and inserts change the order without any registration.
  useLayoutEffect(() => {
    const list = listRef.current;
    const Observer = list?.ownerDocument.defaultView?.MutationObserver;
    if (!list || !Observer) return;
    const observer = new Observer(() => ordered());
    observer.observe(list, { childList: true, subtree: true });
    ordered();
    return () => observer.disconnect();
  }, [ordered]);

  useImperativeHandle(handleRef, () => ({ focusFirst: () => ordered()[0]?.[1].focus() }), [
    ordered,
  ]);

  const activate = useCallback(
    (rowId: string) => {
      focusedId.current = rowId;
      store.setActiveId(rowId);
    },
    [store],
  );

  const context = useMemo<ListContextValue>(
    () => ({ register, subscribe: store.subscribe, getActiveId: store.getActiveId, activate }),
    [register, store, activate],
  );

  const setRef = useCallback(
    (node: HTMLUListElement | null) => {
      listRef.current = node;
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
    },
    [ref],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.defaultPrevented || !NAVIGATION_KEYS.has(event.key)) return;
    const rows = ordered();
    const index = rows.findIndex(([, node]) => node === event.target);
    // Keys typed in trailing controls (inputs, menus) keep their own behaviour.
    if (index < 0) return;
    event.preventDefault();
    if (index === 0 && event.key === 'ArrowUp' && onNavigatePastStart) {
      onNavigatePastStart();
      return;
    }
    const last = rows.length - 1;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : Math.max(0, Math.min(last, index + (event.key === 'ArrowDown' ? 1 : -1)));
    rows[next]?.[1].focus();
  };

  return (
    <ListContext value={context}>
      <ul
        {...listHooks.root({ className, props: rest, data: { divided, pending: isPending } })}
        ref={setRef}
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-busy={isPending || undefined}
        onKeyDown={onKeyDown}
        onBlurCapture={(event) => {
          const next = event.relatedTarget;
          if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
            focusedId.current = null;
          }
        }}
      >
        {children}
      </ul>
    </ListContext>
  );
}

export interface ListRowContentProps extends DataProps {
  /** The row's main text. */
  title: ReactNode;
  /** Secondary text below the title, such as a `MetaLine`. */
  meta?: ReactNode;
  /** A built-in glyph name or icon node beside the title and meta, drawn through `IconLabel`. */
  icon?: GlyphName | ReactNode;
  /** Decorative leading media (an avatar, a thumbnail). Ignored when `icon` is set. */
  leading?: ReactNode;
  className?: string | undefined;
}

function hasContent(node: ReactNode): boolean {
  return node !== null && node !== undefined && typeof node !== 'boolean' && node !== '';
}

/**
 * The text of a row without any control: leading media or icon, title and meta. `ListRow` draws it
 * inside its primary control; use it alone inside an element that is itself the link or button.
 */
export function ListRowContent({
  title,
  meta,
  icon,
  leading,
  className,
  ...rest
}: ListRowContentProps) {
  const text = (
    <span {...contentHooks.slot('text')}>
      <span {...contentHooks.slot('title')}>{title}</span>
      {hasContent(meta) ? <span {...contentHooks.slot('meta')}>{meta}</span> : null}
    </span>
  );
  return (
    <span {...contentHooks.root({ className, props: rest })}>
      {hasContent(icon) ? (
        <IconLabel icon={icon} label={text} grow />
      ) : (
        <>
          {hasContent(leading) ? (
            <span {...contentHooks.slot('leading')} aria-hidden="true">
              {leading}
            </span>
          ) : null}
          {text}
        </>
      )}
    </span>
  );
}

export type ListRowTone = 'default' | 'danger';
export type ListRowKind = 'link' | 'action' | 'static';

export interface ListRowProps extends Omit<ListRowContentProps, 'className'> {
  /** Makes the row's primary control a link, rendered through the provider's link renderer. */
  href?: string | undefined;
  /** Link target. `_blank` adds `rel="noopener noreferrer"` unless `rel` is given. */
  target?: string | undefined;
  rel?: string | undefined;
  /** Without `href`, makes the primary control a button. With `href`, runs when the link is followed. */
  onPress?: (() => void) | undefined;
  /** Runs on a middle-button click of a link row. */
  onAuxPress?: (() => void) | undefined;
  /** Controls after the primary control, such as an action button. They are never inside the link. */
  trailing?: ReactNode;
  /** The row is the current page or item: `aria-current` on its primary control. */
  isCurrent?: boolean | undefined;
  /** The row cannot be activated and is skipped by keyboard navigation. */
  isDisabled?: boolean | undefined;
  /** Semantic emphasis, such as an overdue or failed item. Defaults to `default`. */
  tone?: ListRowTone | undefined;
  className?: string | undefined;
  id?: string | undefined;
}

/**
 * One row of a `List`: a primary control (a link, a button or a focusable read-only body) holding
 * the row text, followed by optional trailing controls as siblings. A link row renders exactly one
 * link and nothing interactive inside it.
 */
export function ListRow({
  title,
  meta,
  icon,
  leading,
  href,
  target,
  rel,
  onPress,
  onAuxPress,
  trailing,
  isCurrent = false,
  isDisabled = false,
  tone = 'default',
  className,
  id,
  ...rest
}: ListRowProps) {
  const rowId = useId();
  const context = useContext(ListContext);
  const subscribe = useCallback(
    (listener: () => void) => context?.subscribe(rowId, listener) ?? (() => {}),
    [context, rowId],
  );
  const getActive = useCallback(
    () => !context || context.getActiveId() === rowId,
    [context, rowId],
  );
  const isActive = useSyncExternalStore(subscribe, getActive, getActive);
  const primaryRef = useRef<HTMLElement | null>(null);
  const kind: ListRowKind = href !== undefined ? 'link' : onPress ? 'action' : 'static';
  const register = context?.register;

  useLayoutEffect(() => {
    if (!register || !primaryRef.current || isDisabled) return;
    return register(rowId, primaryRef.current);
  }, [register, rowId, isDisabled, kind]);

  const setPrimary = (node: HTMLElement | null) => {
    primaryRef.current = node;
  };
  const tabIndex = isDisabled ? undefined : isActive ? 0 : -1;
  const content = <ListRowContent title={title} meta={meta} icon={icon} leading={leading} />;
  const primaryClass = rowHooks.slotClass('primary');

  let primary: ReactNode;
  if (kind === 'link' && href !== undefined && !isDisabled) {
    primary = (
      <UiLink
        ref={setPrimary}
        href={href}
        target={target}
        rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
        className={primaryClass}
        tabIndex={tabIndex}
        aria-current={isCurrent ? 'page' : undefined}
        onClick={() => onPress?.()}
        onAuxClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (event.button === 1) onAuxPress?.();
        }}
      >
        {content}
      </UiLink>
    );
  } else if (kind === 'action') {
    primary = (
      <AriaButton
        ref={setPrimary}
        className={primaryClass}
        isDisabled={isDisabled}
        excludeFromTabOrder={!isActive}
        onPress={onPress}
        {...(isCurrent ? { 'aria-current': true } : {})}
      >
        {content}
      </AriaButton>
    );
  } else {
    primary = (
      <div
        ref={setPrimary}
        className={primaryClass}
        tabIndex={tabIndex}
        aria-current={isCurrent || undefined}
      >
        {content}
      </div>
    );
  }

  return (
    <li
      {...rowHooks.root({
        className,
        props: rest,
        data: { kind, tone, current: isCurrent, disabled: isDisabled },
      })}
      id={id}
      onFocusCapture={() => context?.activate(rowId)}
    >
      {primary}
      {hasContent(trailing) ? <div {...rowHooks.slot('trailing')}>{trailing}</div> : null}
    </li>
  );
}
