'use client';

import { type MouseEvent, type ReactNode, type RefObject, useId, useMemo, useRef } from 'react';
import type { AriaLabellingProps, ExpansionProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { containsComposed } from '../../utils/composed-focus.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import {
  formatOutlineNumber,
  type FormatOutlineNumberOptions,
} from '../../utils/outline-number.js';
import { getElementByIdFrom } from '../../utils/owner-window.js';
import { scrollToStartWithin } from '../../utils/scroll-geometry.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { ExpandToggle } from '../expand-toggle/expand-toggle.js';
import { useScrollSpy } from '../scroll-region/scroll-region.js';
import {
  flattenOutline,
  nestOutlineHeadings,
  type OutlineEntry,
  type OutlineHeading,
} from './outline-tree.js';
import { useOutlineExpansion } from './use-outline-expansion.js';
import { useOutlineFocusRecovery } from './use-outline-focus.js';

export type { OutlineHeading } from './outline-tree.js';

export interface OutlineProps
  extends BaseProps, AriaLabellingProps, ExpansionProps, RefProps<HTMLElement> {
  /** The document's headings in document order. */
  headings: readonly OutlineHeading[];
  /** The id of the current heading (controlled); `null` marks none. Overrides scroll tracking. */
  currentKey?: string | null | undefined;
  /** The scrolling viewport that holds the headings; the outline marks the heading read there. */
  viewportRef?: RefObject<HTMLElement | null> | undefined;
  /** How far below the viewport's top a heading must reach to become current, in pixels. */
  trackingOffset?: number | undefined;
  /** Called with a heading's id when the reader follows its entry, before it scrolls into view. */
  onNavigate?: ((id: string) => void) | undefined;
  /** Entries at this heading level or deeper start collapsed. Defaults to none. */
  collapseBelowLevel?: number | undefined;
  /** Numbers the entries by their place in the outline (1, 1.1, 1.2). */
  isNumbered?: boolean | undefined;
  /** How numbers are written, for `formatOutlineNumber`. */
  numberOptions?: FormatOutlineNumberOptions | undefined;
  /** Headings are loading: publishes `aria-busy`, and an empty outline shows a loading notice. */
  isPending?: boolean | undefined;
  /** The notice an empty outline shows when it is not loading. Without it the outline shows nothing. */
  emptyMessage?: ReactNode;
}

interface OutlineContext {
  baseId: string;
  currentKey: string | null | undefined;
  currentAncestors: ReadonlySet<string>;
  hasToggles: boolean;
  isNumbered: boolean;
  numberOptions: FormatOutlineNumberOptions | undefined;
  isExpanded: (entry: OutlineEntry) => boolean;
  setExpanded: (entry: OutlineEntry, isExpanded: boolean) => void;
  onFollow: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
}

const hooks = createHooks('outline', ['empty', 'list', 'item', 'row', 'link', 'number', 'label']);

const noViewport: RefObject<HTMLElement | null> = { current: null };

/** A plain primary click; others (a new tab, a download) keep the browser's behaviour. */
function isPlainClick(event: MouseEvent) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/**
 * Scrolls the heading into view and moves focus to it when it can take focus. The heading is looked
 * up in the tree `scope` is in (a shadow root, else its document), as tracking looks it up. Inside
 * the outline's viewport only that viewport, and the scrollers within it, move; the page stays.
 */
function revealHeading(scope: Node, id: string, viewport: HTMLElement | null) {
  const target = getElementByIdFrom(scope, id);
  if (!target) return;
  if (viewport && containsComposed(viewport, target)) scrollToStartWithin(target, viewport);
  else target.scrollIntoView({ block: 'start' });
  if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
}

function OutlineList(props: {
  entries: readonly OutlineEntry[];
  context: OutlineContext;
  id?: string | undefined;
  hidden?: boolean | undefined;
}) {
  return (
    <ol {...hooks.slot('list')} id={props.id} hidden={props.hidden}>
      {props.entries.map((entry) => (
        <OutlineItem key={entry.heading.id} entry={entry} context={props.context} />
      ))}
    </ol>
  );
}

function OutlineItem({ entry, context }: { entry: OutlineEntry; context: OutlineContext }) {
  const strings = useUiStrings();
  const { heading, children } = entry;
  const hasChildren = children.length > 0;
  const isExpanded = hasChildren && context.isExpanded(entry);
  const isCurrent = heading.id === context.currentKey;
  const listId = `${context.baseId}-${entry.path.join('-')}`;
  return (
    <li
      {...hooks.slot('item', {
        level: heading.level,
        current: isCurrent,
        currentWithin: context.currentAncestors.has(heading.id),
        expanded: isExpanded,
      })}
    >
      <div {...hooks.slot('row')}>
        {context.hasToggles ? (
          <ExpandToggle
            size="xs"
            isExpandable={hasChildren}
            isExpanded={isExpanded}
            onExpandedChange={(next) => context.setExpanded(entry, next)}
            label={strings.sectionsIn(heading.label)}
            aria-controls={hasChildren ? listId : undefined}
          />
        ) : null}
        <a
          {...hooks.slot('link')}
          href={`#${heading.id}`}
          aria-current={isCurrent ? 'location' : undefined}
          onClick={(event) => context.onFollow(event, heading.id)}
        >
          {context.isNumbered ? (
            <>
              <span {...hooks.slot('number')}>
                {formatOutlineNumber(entry.path, context.numberOptions)}
              </span>{' '}
            </>
          ) : null}
          <span {...hooks.slot('label')}>{heading.label}</span>
        </a>
      </div>
      {hasChildren ? (
        <OutlineList entries={children} context={context} id={listId} hidden={!isExpanded} />
      ) : null}
    </li>
  );
}

/** The current heading: the controlled one, else the one the viewport's scroll position reaches. */
function useCurrentHeading(
  entries: readonly OutlineEntry[],
  { currentKey, viewportRef, trackingOffset }: OutlineProps,
) {
  const ids = useMemo(() => entries.map((entry) => entry.heading.id), [entries]);
  // A controlled heading is the caller's: the viewport's scrolling is not followed meanwhile.
  const spied = currentKey === undefined ? (viewportRef ?? noViewport) : noViewport;
  const tracked = useScrollSpy(spied, { ids, offset: trackingOffset });
  const current = currentKey === undefined ? tracked : currentKey;
  const ancestors = entries.find((entry) => entry.heading.id === current)?.ancestors ?? [];
  return { current, currentAncestors: new Set(ancestors) };
}

/**
 * A document outline: a navigation landmark with the document's headings as nested links. It marks
 * the heading being read, follows the scroll of a viewport, scrolls to a heading when its entry is
 * followed, collapses and expands sections, and can number its entries.
 */
export function Outline(props: OutlineProps) {
  const { headings, isPending = false, emptyMessage, isNumbered = false } = props;
  const { className, id, ref, numberOptions, onNavigate } = props;
  const { 'aria-label': ariaLabel, 'aria-labelledby': labelledBy } = props;
  const { 'aria-describedby': describedBy, 'aria-details': details } = props;
  const strings = useUiStrings();
  const baseId = useId();
  const roots = useMemo(() => nestOutlineHeadings(headings), [headings]);
  const entries = useMemo(() => flattenOutline(roots), [roots]);
  const parents = useMemo(() => entries.filter((entry) => entry.children.length > 0), [entries]);
  const { isExpanded, setExpanded } = useOutlineExpansion(parents, props);
  const { current, currentAncestors } = useCurrentHeading(entries, props);
  const rootRef = useRef<HTMLElement>(null);
  const mergedRef = useMergedRefs(rootRef, ref);
  useOutlineFocusRecovery(rootRef, entries);
  const context: OutlineContext = {
    baseId,
    currentKey: current,
    currentAncestors,
    hasToggles: parents.length > 0,
    isNumbered,
    numberOptions,
    isExpanded,
    setExpanded,
    onFollow: (event, headingId) => {
      if (!isPlainClick(event)) return;
      event.preventDefault();
      onNavigate?.(headingId);
      const viewport = props.viewportRef?.current ?? null;
      revealHeading(viewport ?? event.currentTarget, headingId, viewport);
    },
  };
  const hasNotice = roots.length === 0 && (isPending || !isEmptyNode(emptyMessage));
  return (
    <nav
      {...hooks.root({ className, props, data: { numbered: isNumbered, pending: isPending } })}
      id={id}
      ref={mergedRef}
      aria-label={ariaLabel ?? (labelledBy ? undefined : strings.outline)}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-details={details}
      aria-busy={isPending || undefined}
    >
      {hasNotice ? (
        <EmptyState
          variant={isPending ? 'loading' : 'empty'}
          size="sm"
          description={isPending ? strings.loading : emptyMessage}
          className={hooks.slotClass('empty')}
        />
      ) : null}
      {roots.length > 0 ? <OutlineList entries={roots} context={context} /> : null}
    </nav>
  );
}
