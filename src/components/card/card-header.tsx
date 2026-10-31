'use client';

// The card's header: the title block, metadata and actions, the expand and collapse control, and
// the More button that reveals what an adaptive card leaves out of a smaller presentation.

import { useId, useMemo, type ReactNode } from 'react';
import { ChevronDownGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import type { HeadingLevel } from '../section-header/section-header.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { CardActionTitle, type CardActionOptions } from './card-action.js';
import { CardHeaderContext, type CardHeaderParts } from './card-parts.js';
import { cardHooks } from './card-hooks.js';
import {
  MoreControl,
  useMoreEscape,
  useRegions,
  type CardMore,
  type MovableRegion,
} from './card-more.js';
import type { CardPresentation } from './card-presentation.js';

const hooks = cardHooks;

/** The expand and collapse control of a collapsible card. */
export interface CardToggle {
  isExpanded: boolean;
  isDisabled: boolean;
  /** The ids of the regions it shows and hides. */
  controls: string | undefined;
  toggle: () => void;
}

export interface CardHeaderProps {
  title: ReactNode;
  description: ReactNode;
  actions: ReactNode;
  header: ReactNode;
  leading: ReactNode;
  meta: ReactNode;
  /** Shown in place of the title in the minimal presentation. */
  abbreviation: string | undefined;
  /** The id of the summary when the minimal presentation moved it, which More also reveals. */
  movedSummaryId: string | null;
  presentation: CardPresentation;
  more: CardMore;
  toggle: CardToggle | null;
  headingLevel: HeadingLevel;
  titleId: string;
  /** Receives the custom header's slotted title element. */
  titleRef: (element: HTMLElement | null) => void;
  /** The whole-card action, if any, and the ref that registers its element. */
  action: {
    options: CardActionOptions;
    isActionable: boolean;
    ref: (node: HTMLElement | null) => void;
  };
}

/** The title's content: the action link or button when the card has one, else the title itself. */
function TitleContent({ title, action }: Pick<CardHeaderProps, 'title' | 'action'>): ReactNode {
  if (!action.isActionable) return title;
  return (
    <CardActionTitle
      options={action.options}
      actionRef={action.ref}
      className={hooks.slotClass('action')}
    >
      {title}
    </CardActionTitle>
  );
}

/**
 * The title heading. Outside the full presentation the stylesheet cuts it to the room left and a
 * tooltip shows it whole; the minimal presentation shows the abbreviation, keeping the whole title
 * as the heading's (and the card's) accessible name.
 */
function CardTitleHeading(
  props: Pick<CardHeaderProps, 'title' | 'abbreviation' | 'presentation' | 'action'> & {
    headingLevel: HeadingLevel;
    titleId: string;
  },
) {
  const { title, abbreviation, presentation, headingLevel, titleId } = props;
  const Heading = `h${headingLevel}` as const;
  const content = <TitleContent title={title} action={props.action} />;
  if (presentation === 'full') {
    return (
      <Heading {...hooks.slot('title')} id={titleId}>
        {content}
      </Heading>
    );
  }
  const isAbbreviated = presentation === 'minimal' && abbreviation !== undefined;
  return (
    <Heading {...hooks.slot('title')} id={titleId}>
      {isAbbreviated ? (
        <>
          <span {...hooks.slot('abbreviation')} aria-hidden="true">
            {abbreviation}
          </span>
          <VisuallyHidden>{content}</VisuallyHidden>
        </>
      ) : (
        <TruncationTooltip>{content}</TruncationTooltip>
      )}
    </Heading>
  );
}

/** The expand and collapse control, named "Details" and the card's title. */
function ToggleButton({ toggle, titleId }: { toggle: CardToggle; titleId: string }) {
  const strings = useUiStrings();
  const id = useId();
  return (
    <Button
      id={id}
      variant="ghost"
      size="sm"
      icon={ChevronDownGlyph}
      label={strings.details}
      aria-labelledby={`${id} ${titleId}`}
      aria-expanded={toggle.isExpanded}
      aria-controls={toggle.controls}
      isDisabled={toggle.isDisabled}
      className={hooks.slotClass('toggle')}
      data-expanded={toggle.isExpanded || undefined}
      onPress={toggle.toggle}
    />
  );
}

/** The toggle, in a wrapper that hides it while a presentation moved it. */
function Toggle({
  toggle,
  titleId,
  regions,
}: {
  toggle: CardToggle;
  titleId: string;
  regions: ReturnType<typeof useRegions>;
}) {
  const button = <ToggleButton toggle={toggle} titleId={titleId} />;
  if (!regions.moved.has('toggle')) return button;
  return <div {...regions.place('toggle')}>{button}</div>;
}

/** What the custom header's `CardTitle` and `CardAction` take from the card. */
function useHeaderParts({
  headingLevel,
  titleId,
  titleRef,
  action,
}: Pick<CardHeaderProps, 'headingLevel' | 'titleId' | 'titleRef' | 'action'>): CardHeaderParts {
  const { options, isActionable, ref } = action;
  const { href, target, rel, onAction } = options;
  return useMemo(
    () => ({
      title: {
        id: titleId,
        className: hooks.slotClass('title'),
        level: headingLevel,
        ref: titleRef,
      },
      action: {
        options: { href, target, rel, onAction },
        isActionable,
        className: hooks.slotClass('action'),
        ref,
      },
    }),
    [titleId, headingLevel, titleRef, href, target, rel, onAction, isActionable, ref],
  );
}

/** A custom header: the caller's content, which names the card through its `CardTitle`. */
function CustomHeader(props: CardHeaderProps) {
  const parts = useHeaderParts(props);
  const regions = useRegions(props);
  const onKeyDown = useMoreEscape(props.more, regions.ids);
  const { abbreviation, toggle, titleId } = props;
  const isAbbreviated = props.presentation === 'minimal' && abbreviation !== undefined;
  // Without an abbreviation the content keeps the title on screen, so it stays in place.
  const heading = isAbbreviated
    ? regions.place('heading')
    : { id: regions.ids.heading, 'data-moved': undefined, hidden: undefined };
  const present: MovableRegion[] = [
    ...(isAbbreviated ? ['heading' as const] : []),
    ...(toggle ? ['toggle' as const] : []),
  ];
  return (
    <header {...hooks.slot('header')} onKeyDown={onKeyDown}>
      {isAbbreviated ? (
        <span {...hooks.slot('abbreviation')} aria-hidden="true">
          {abbreviation}
        </span>
      ) : null}
      {/* The content stays mounted while moved, so its title still names the card. */}
      <div {...hooks.slot('heading')} {...heading}>
        <CardHeaderContext value={parts}>{props.header}</CardHeaderContext>
      </div>
      {toggle ? <Toggle toggle={toggle} titleId={titleId} regions={regions} /> : null}
      <MoreControl header={props} regions={regions} present={present} />
    </header>
  );
}

/**
 * The `<header>`: custom content, or the regions of the title block; nothing when all are empty.
 * Every region keeps its place in every presentation, so its content stays mounted with its state;
 * a smaller presentation hides the regions it moves until the More button opens them. Custom
 * content's `CardTitle` and `CardAction` take the title's and the action's props from the card.
 */
export function CardHeader(props: CardHeaderProps) {
  const regions = useRegions(props);
  const onKeyDown = useMoreEscape(props.more, regions.ids);
  if (!isEmptyNode(props.header)) return <CustomHeader {...props} />;
  const { title, titleId, toggle } = props;
  const has = {
    leading: !isEmptyNode(props.leading),
    description: !isEmptyNode(props.description),
    meta: !isEmptyNode(props.meta),
    actions: !isEmptyNode(props.actions),
    toggle: toggle !== null,
    heading: false,
  };
  const present = (Object.keys(has) as MovableRegion[]).filter((region) => has[region]);
  const hasHeading = !isEmptyNode(title) || has.description || has.meta;
  if (!hasHeading && present.length === 0 && !props.movedSummaryId) return null;
  return (
    <header {...hooks.slot('header')} onKeyDown={onKeyDown}>
      {has.leading ? (
        <div {...hooks.slot('leading')} {...regions.place('leading')}>
          {props.leading}
        </div>
      ) : null}
      {hasHeading ? (
        <div {...hooks.slot('heading')}>
          {isEmptyNode(title) ? null : <CardTitleHeading {...props} />}
          {has.description ? (
            <div {...hooks.slot('description')} {...regions.place('description')}>
              {props.description}
            </div>
          ) : null}
          {has.meta ? (
            <div {...hooks.slot('meta')} {...regions.place('meta')}>
              {props.meta}
            </div>
          ) : null}
        </div>
      ) : null}
      {has.actions ? (
        <div {...hooks.slot('actions')} {...regions.place('actions')}>
          {props.actions}
        </div>
      ) : null}
      {toggle ? <Toggle toggle={toggle} titleId={titleId} regions={regions} /> : null}
      <MoreControl header={props} regions={regions} present={present} />
    </header>
  );
}
