'use client';

// The More disclosure of an adaptive card: the regions a smaller presentation moves keep their
// place and their mounted content, hidden until the More button opens them where they stand.

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { MoreGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { cardHooks as hooks } from './card-hooks.js';
import type { CardHeaderProps } from './card-header.js';
import type { CardPresentation } from './card-presentation.js';

/** The More disclosure: whether the regions a smaller presentation moved show. */
export interface CardMore {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

/** The More button: discloses the regions a smaller presentation moved, where they stand. */
function MoreButton({
  more,
  titleId,
  controls,
  id,
}: {
  more: CardMore;
  titleId: string;
  controls: string;
  id: string;
}) {
  const strings = useUiStrings();
  return (
    <Button
      id={id}
      variant="ghost"
      size="sm"
      icon={MoreGlyph}
      label={strings.more}
      aria-labelledby={`${id} ${titleId}`}
      aria-expanded={more.isOpen}
      aria-controls={controls}
      className={hooks.slotClass('more')}
      data-expanded={more.isOpen || undefined}
      onPress={() => more.setOpen(!more.isOpen)}
    />
  );
}

/** The regions a presentation moves behind More: they stay where they are, hidden until opened. */
const movedRegions = {
  full: [],
  compact: ['description', 'meta', 'actions'],
  minimal: ['leading', 'description', 'meta', 'actions', 'toggle', 'heading'],
} as const satisfies Record<CardPresentation, readonly string[]>;

export type MovableRegion = (typeof movedRegions)['minimal'][number];

/**
 * The ids of a header's regions, and which a presentation moved: a moved region keeps its place
 * and its mounted content, and shows only while More is open.
 */
export function useRegions(props: CardHeaderProps) {
  const id = useId();
  const moved = new Set<string>(movedRegions[props.presentation]);
  const ids: Record<MovableRegion | 'more', string> = {
    leading: `${id}-leading`,
    description: `${id}-description`,
    meta: `${id}-meta`,
    actions: `${id}-actions`,
    toggle: `${id}-toggle`,
    heading: `${id}-heading`,
    more: `${id}-more`,
  };
  /** The attributes of a region: its id, and while moved, `data-moved` and `hidden` unless open. */
  const place = (region: MovableRegion) => {
    const isMoved = moved.has(region);
    return {
      id: ids[region],
      'data-moved': isMoved || undefined,
      hidden: (isMoved && !props.more.isOpen) || undefined,
    };
  };
  return { ids, moved, place };
}

/** Escape in a region More revealed closes it and returns focus to More. */
export function useMoreEscape(more: CardMore, moreId: string) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !more.isOpen) return;
    const target = event.target as HTMLElement;
    if (!target.closest('[data-moved]')) return;
    event.preventDefault();
    event.stopPropagation();
    more.setOpen(false);
    target.ownerDocument.getElementById(moreId)?.focus();
  };
}

/** The More button when the presentation moved any present region, with the ids it reveals. */
export function MoreControl(props: {
  header: CardHeaderProps;
  regions: ReturnType<typeof useRegions>;
  present: MovableRegion[];
}) {
  const { header, regions, present } = props;
  const controls = [
    ...present.filter((region) => regions.moved.has(region)).map((region) => regions.ids[region]),
    ...(header.movedSummaryId ? [header.movedSummaryId] : []),
  ];
  if (controls.length === 0) return null;
  return (
    <MoreButton
      more={header.more}
      titleId={header.titleId}
      controls={controls.join(' ')}
      id={regions.ids.more}
    />
  );
}

/**
 * The More disclosure's state, closed again whenever the presentation changes, and the placement
 * of the summary: the minimal presentation moves a collapsed card's summary behind More.
 */
export function useCardMore(
  presentation: CardPresentation,
  summary: { isPresent: boolean; isExpanded: boolean },
) {
  const summaryId = `${useId()}-summary`;
  const [state, setState] = useState({ presentation, isOpen: false });
  if (state.presentation !== presentation) setState({ presentation, isOpen: false });
  const isOpen = state.presentation === presentation && state.isOpen;
  const more: CardMore = { isOpen, setOpen: (next) => setState({ presentation, isOpen: next }) };
  const isMoved = summary.isPresent && !summary.isExpanded && presentation === 'minimal';
  return {
    more,
    summary: {
      id: summaryId,
      movedId: isMoved ? summaryId : null,
      isMoved,
      isHidden: summary.isExpanded || (isMoved && !isOpen),
    },
  };
}

/**
 * The collapsed card's preview, kept mounted while the card is expanded (hidden) and while the
 * minimal presentation moves it behind More.
 */
export function CardSummary(props: {
  id: string;
  isMoved: boolean;
  isHidden: boolean;
  children: ReactNode;
}) {
  if (isEmptyNode(props.children)) return null;
  return (
    <div
      {...hooks.slot('summary')}
      id={props.id}
      data-moved={props.isMoved || undefined}
      hidden={props.isHidden || undefined}
    >
      {props.children}
    </div>
  );
}
