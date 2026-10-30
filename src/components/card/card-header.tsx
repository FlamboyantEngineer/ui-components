'use client';

// The card's header: the title block, metadata and actions, the expand and collapse control, and
// the More button that holds what an adaptive card leaves out of a smaller presentation.

import { Fragment, useId, useMemo, type ReactNode } from 'react';
import { ChevronDownGlyph, MoreGlyph } from '../../core/glyphs.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import type { HeadingLevel } from '../section-header/section-header.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { CardActionTitle, type CardActionOptions } from './card-action.js';
import { CardHeaderContext, type CardHeaderParts } from './card-parts.js';
import type { CardPresentation } from './card-presentation.js';

export const cardHooks = createHooks('card', [
  'media',
  'header',
  'leading',
  'heading',
  'title',
  'abbreviation',
  'action',
  'description',
  'meta',
  'actions',
  'toggle',
  'more',
  'more-panel',
  'summary',
  'body',
  'skeleton',
  'footer',
]);
const hooks = cardHooks;

/** The expand and collapse control of a collapsible card. */
export interface CardToggle {
  isExpanded: boolean;
  isDisabled: boolean;
  /** The ids of the regions it shows and hides. */
  controls: string;
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
  /** The collapsed card's preview, which the minimal presentation moves into the More panel. */
  summary: ReactNode;
  presentation: CardPresentation;
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

/** One region of the header. */
function Region({ slot, children }: { slot: 'leading' | 'meta' | 'summary'; children: ReactNode }) {
  return <div {...hooks.slot(slot)}>{children}</div>;
}

/** The More button and its panel, which hold the regions a smaller presentation leaves out. */
function MoreButton({
  title,
  titleId,
  children,
}: {
  title: ReactNode;
  titleId: string;
  children: ReactNode;
}) {
  const strings = useUiStrings();
  const id = useId();
  return (
    <PopoverTrigger>
      <Button
        id={id}
        variant="ghost"
        size="sm"
        icon={MoreGlyph}
        label={strings.more}
        aria-labelledby={`${id} ${titleId}`}
        className={hooks.slotClass('more')}
      />
      <Popover
        {...(isEmptyNode(title) ? { 'aria-labelledby': titleId } : { title })}
        placement="bottom end"
      >
        <div {...hooks.slot('more-panel')}>{children}</div>
      </Popover>
    </PopoverTrigger>
  );
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

/**
 * The regions of the props header by presentation: `shown` in the header, `moved` into the More
 * panel. The full presentation shows every region; the compact one keeps the leading content and
 * the title and moves the description, metadata and actions; the minimal one keeps the title and
 * moves the rest, the toggle and the summary included.
 */
function placeRegions(props: CardHeaderProps) {
  const { presentation } = props;
  const description = isEmptyNode(props.description) ? null : (
    <div {...hooks.slot('description')}>{props.description}</div>
  );
  const meta = isEmptyNode(props.meta) ? null : <Region slot="meta">{props.meta}</Region>;
  const actions = isEmptyNode(props.actions) ? null : (
    <div {...hooks.slot('actions')}>{props.actions}</div>
  );
  const leading = isEmptyNode(props.leading) ? null : (
    <Region slot="leading">{props.leading}</Region>
  );
  const toggle = props.toggle ? (
    <ToggleButton toggle={props.toggle} titleId={props.titleId} />
  ) : null;
  if (presentation === 'full') {
    return { leading, description, meta, actions, toggle, moved: [] as ReactNode[] };
  }
  const isMinimal = presentation === 'minimal';
  const summary = isEmptyNode(props.summary) ? null : (
    <Region slot="summary">{props.summary}</Region>
  );
  const moved = [
    isMinimal ? leading : null,
    description,
    meta,
    isMinimal ? summary : null,
    actions,
    isMinimal ? toggle : null,
  ].flatMap((node, index) => (node ? [<Fragment key={index}>{node}</Fragment>] : []));
  return {
    leading: isMinimal ? null : leading,
    description: null,
    meta: null,
    actions: null,
    toggle: isMinimal ? null : toggle,
    moved,
  };
}

/** A custom header: the caller's content, which names the card through its `CardTitle`. */
function CustomHeader(props: CardHeaderProps) {
  const parts = useHeaderParts(props);
  const { presentation, abbreviation, toggle, titleId } = props;
  const isMinimal = presentation === 'minimal';
  const isAbbreviated = isMinimal && abbreviation !== undefined;
  const moved = [
    isMinimal && !isEmptyNode(props.summary) ? (
      <Region key="summary" slot="summary">
        {props.summary}
      </Region>
    ) : null,
    isMinimal && toggle ? <ToggleButton key="toggle" toggle={toggle} titleId={titleId} /> : null,
  ].filter(Boolean);
  return (
    <header {...hooks.slot('header')}>
      {isAbbreviated ? (
        <span {...hooks.slot('abbreviation')} aria-hidden="true">
          {abbreviation}
        </span>
      ) : null}
      {/* The content stays mounted while abbreviated, so its title still names the card. */}
      <div {...hooks.slot('heading')} hidden={isAbbreviated || undefined}>
        <CardHeaderContext value={parts}>{props.header}</CardHeaderContext>
      </div>
      {toggle && !isMinimal ? <ToggleButton toggle={toggle} titleId={titleId} /> : null}
      {moved.length > 0 ? (
        <MoreButton title={props.title} titleId={titleId}>
          {moved}
        </MoreButton>
      ) : null}
    </header>
  );
}

/**
 * The `<header>`: custom content, or the regions of the title block; nothing when all are empty.
 * Custom content's `CardTitle` and `CardAction` take the title's and the action's props from the
 * card.
 */
export function CardHeader(props: CardHeaderProps) {
  if (!isEmptyNode(props.header)) return <CustomHeader {...props} />;
  const { title, titleId } = props;
  const regions = placeRegions(props);
  const hasHeading = !isEmptyNode(title) || regions.description || regions.meta;
  if (
    !hasHeading &&
    !regions.leading &&
    !regions.actions &&
    !regions.toggle &&
    regions.moved.length === 0
  ) {
    return null;
  }
  return (
    <header {...hooks.slot('header')}>
      {regions.leading}
      {hasHeading ? (
        <div {...hooks.slot('heading')}>
          {isEmptyNode(title) ? null : <CardTitleHeading {...props} />}
          {regions.description}
          {regions.meta}
        </div>
      ) : null}
      {regions.actions}
      {regions.toggle}
      {regions.moved.length > 0 ? (
        <MoreButton title={title} titleId={titleId}>
          {regions.moved}
        </MoreButton>
      ) : null}
    </header>
  );
}
