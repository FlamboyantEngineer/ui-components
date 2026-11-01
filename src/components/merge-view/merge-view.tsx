'use client';

import { getElementByIdWithin } from '../../utils/owner-window.js';
import { useId, useMemo, useState } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { requireDefined } from '../../utils/require-defined.js';
import { useSyncedScroll } from '../../utils/use-synced-scroll.js';
import { type ScrollAnchor } from '../../utils/scroll-offset-map.js';
import { ChangeNavigation } from '../text-diff/text-diff.js';
import type { MergeSide } from './merge-blocks.js';
import { mergeViewHooks as hooks } from './merge-view-hooks.js';
import { getConflictId, MergeResultPane, type MergeLabels } from './merge-view-result.js';
import { MergeSidePane } from './merge-view-sides.js';
import { useMergeState, type MergeViewResult } from './use-merge-state.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';

export type { MergeResolution } from './merge-blocks.js';
export type { MergeViewResult } from './use-merge-state.js';

export interface MergeViewProps extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** The common ancestor both sides changed. */
  base: string;
  /** Our side's text. */
  ours: string;
  /** Their side's text. */
  theirs: string;
  /** Our side's title, also on its take action. Defaults to the provider's `mergeViewOurs`. */
  oursLabel?: string | undefined;
  /** The base's title. Defaults to the provider's `mergeViewBase`. */
  baseLabel?: string | undefined;
  /** Their side's title. Defaults to the provider's `mergeViewTheirs`. */
  theirsLabel?: string | undefined;
  /** Draws the base between the two sides. Defaults to true. */
  showBase?: boolean | undefined;
  /** Called with the result after each take action or edit of a conflict's result. */
  onChange?: ((result: MergeViewResult) => void) | undefined;
}

const sideOrder: readonly MergeSide[] = ['ours', 'base', 'theirs'];

type PaneRefs = [HTMLElement | null, HTMLElement | null, HTMLElement | null, HTMLElement | null];

/** Each chunk's first row or block, in order, as anchors the other panes align to. */
function readChunkAnchors(container: HTMLElement): ScrollAnchor[] {
  const origin = container.getBoundingClientRect().top - container.scrollTop;
  const chunks = container.querySelectorAll(
    `.${hooks.slotClass('chunk')}, .${hooks.slotClass('block')}`,
  );
  return Array.from(chunks, (chunk, index) => ({
    key: index,
    offset: chunk.getBoundingClientRect().top - origin,
  }));
}

/** The panes' scrolling viewports, which scroll together through their chunks. */
function usePanes(): (index: number) => (element: HTMLElement | null) => void {
  const [panes, setPanes] = useState<PaneRefs>([null, null, null, null]);
  const setters = useMemo(
    () =>
      [0, 1, 2, 3].map(
        (index) => (element: HTMLElement | null) =>
          setPanes((previous) => {
            if (previous[index] === element) return previous;
            const next = [...previous] as PaneRefs;
            next[index] = element;
            return next;
          }),
      ),
    [],
  );
  useSyncedScroll(panes, { getAnchors: readChunkAnchors });
  return (index) => requireDefined(setters[index]);
}

function MergeViewHeader(props: {
  unresolved: number;
  total: number;
  current: number | null;
  onMove: (conflict: number) => void;
}) {
  const { unresolved, total, current, onMove } = props;
  const strings = useUiStrings();
  const previous = current === null ? -1 : current - 1;
  const next = current === null ? 0 : current + 1;
  return (
    <div {...hooks.slot('header')}>
      <span role="status" {...hooks.slot('status')}>
        {strings.mergeViewConflictCount(unresolved, total)}
      </span>
      <ChangeNavigation
        hooks={hooks}
        previous={{
          label: strings.mergeViewPreviousConflict,
          isDisabled: previous < 0,
          onPress: () => onMove(previous),
        }}
        next={{
          label: strings.mergeViewNextConflict,
          isDisabled: next >= total,
          onPress: () => onMove(next),
        }}
      />
    </div>
  );
}

/**
 * The three-way merge of two texts that changed a common base: our side, the base and their side
 * level with each other, and a result pane where clean changes are merged and each conflict offers
 * take actions and an editable result. A header counts the unresolved conflicts and moves between
 * them; the panes scroll together.
 */
export function MergeView({
  base,
  ours,
  theirs,
  oursLabel,
  baseLabel,
  theirsLabel,
  showBase = true,
  onChange,
  className,
  ref,
  ...rest
}: MergeViewProps) {
  const strings = useUiStrings();
  const baseId = useId();
  const [rootRef, setRootRef] = useForwardedRef(ref);
  const paneRef = usePanes();
  const labels: MergeLabels = {
    ours: oursLabel ?? strings.mergeViewOurs,
    base: baseLabel ?? strings.mergeViewBase,
    theirs: theirsLabel ?? strings.mergeViewTheirs,
  };
  const merge = useMergeState({ base, ours, theirs, markers: labels, onChange });
  const { blocks, current } = merge;
  const moveTo = (conflict: number) => {
    merge.setCurrent(conflict);
    getElementByIdWithin(rootRef.current, getConflictId(baseId, conflict))
      ?.querySelector('textarea')
      ?.focus();
  };
  const sides = showBase ? sideOrder : sideOrder.filter((side) => side !== 'base');

  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest, data: { showBase } })}
      ref={setRootRef}
      role="group"
    >
      <MergeViewHeader
        unresolved={merge.unresolved}
        total={merge.states.length}
        current={current}
        onMove={moveTo}
      />
      <div {...hooks.slot('sides')}>
        {sides.map((side) => (
          <MergeSidePane
            key={side}
            side={side}
            label={labels[side]}
            blocks={blocks}
            current={current}
            paneRef={paneRef(sideOrder.indexOf(side))}
          />
        ))}
      </div>
      <MergeResultPane
        label={strings.mergeViewResult}
        blocks={blocks}
        generation={merge.generation}
        states={merge.states}
        labels={labels}
        current={current}
        baseId={baseId}
        paneRef={paneRef(3)}
        onResolve={merge.resolve}
      />
    </div>
  );
}
