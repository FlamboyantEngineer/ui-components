'use client';

import { useId, useState, type ReactNode } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import {
  HeadingLevelContext,
  useHeadingLevel,
  type HeadingLevel,
} from '../section-header/section-header.js';
import { Skeleton } from '../skeleton/skeleton.js';
import { useCardAction, type CardActionOptions } from './card-action.js';
import { useFocusRescue } from './card-focus.js';
import { CardHeader, type CardToggle } from './card-header.js';
import { cardHooks as hooks } from './card-hooks.js';
import { CardSummary, useCardMore } from './card-more.js';
import {
  useCardPresentation,
  type CardPresentation,
  type CardPresentationSteps,
} from './card-presentation.js';

export type {
  CardBreakpoint,
  CardPresentation,
  CardPresentationSteps,
} from './card-presentation.js';

/** `default`: content on the page. `panel`: a chrome region on a muted surface. */
export type CardVariant = 'default' | 'panel';

/** `default` keeps each part's own inset; the others give the card one interior padding. */
export type CardDensity = 'default' | 'comfortable' | 'compact' | 'tight';

export interface CardProps
  extends
    BaseProps,
    CardActionOptions,
    Pick<NativeProps<'section'>, 'hidden' | 'role' | 'aria-label' | 'aria-labelledby'> {
  /** Surface. Defaults to `default`. */
  variant?: CardVariant | undefined;
  /** Interior padding. Defaults to `default`. */
  density?: CardDensity | undefined;
  /** The heading. A titled card is a region named by its title. */
  title?: ReactNode;
  /** Supporting text under the title. */
  description?: ReactNode;
  /** Trailing controls or status in the header. */
  actions?: ReactNode;
  /** The title's heading level. Defaults to one below the enclosing section's, else 3. */
  headingLevel?: HeadingLevel | undefined;
  /**
   * Custom header content, in place of the title, description and actions. A `CardTitle` in it is
   * the card's title and names the card, and a `CardAction` is the card's action.
   */
  header?: ReactNode;
  /** Full-bleed media before the header, such as a cover image or a preview. */
  media?: ReactNode;
  /** The content is loading: the body shows a decorative skeleton and the card is busy. */
  isLoading?: boolean | undefined;
  /** The body. */
  children?: ReactNode;
  /** Closing content, such as a timestamp or secondary actions, in a `<footer>`. */
  footer?: ReactNode;
  /** The card is the current one, such as a selected record. */
  isSelected?: boolean | undefined;
  /** The card answers to a pointer (it sits inside a link or button); publishes `data-interactive`. */
  interactive?: boolean | undefined;
  /** Set into a surrounding frame rather than on the page. */
  flush?: boolean | undefined;
  /** The body is a canvas that grows to the card's height and owns its interior. */
  fill?: boolean | undefined;
  /** Take the full width of the container. */
  fullWidth?: boolean | undefined;
  /** Leading content in the header, before the title, such as a status icon or a badge. */
  leading?: ReactNode;
  /** Metadata under the title, such as an owner and a date. Secondary: smaller cards move it. */
  meta?: ReactNode;
  /** A short preview shown under the header while the card is collapsed, such as progress. */
  summary?: ReactNode;
  /**
   * A few characters the minimal presentation shows in place of the title, such as `Q3` for a
   * quarterly report. Without it the title is cut to the room left.
   */
  abbreviation?: string | undefined;
  /** Draws an expand and collapse control that shows and hides the media, body and footer. */
  isCollapsible?: boolean | undefined;
  /** Whether a collapsible card shows its media, body and footer (controlled). */
  isExpanded?: boolean | undefined;
  /** Whether a collapsible card starts expanded when uncontrolled. Defaults to true. */
  defaultExpanded?: boolean | undefined;
  /** Receives each requested expanded state, also while controlled. */
  onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
  /** Disables the expand and collapse control; the card keeps its state. */
  isToggleDisabled?: boolean | undefined;
  /**
   * Fits the card to the space its container gives it, at breakpoints the host sets (there are no
   * defaults): below the `compact` breakpoint the header keeps its leading content, title and
   * controls and moves the rest behind a More button; below the `minimal` one only a few
   * characters of the title and the More button remain.
   */
  presentationSteps?: CardPresentationSteps | undefined;
}

/**
 * The card's `aria-labelledby`: the caller's, else its title's (its own, or the slotted title of a
 * custom header) unless the caller names it.
 */
function toLabelledBy(
  props: Pick<CardProps, 'title' | 'header' | 'aria-label' | 'aria-labelledby'>,
  title: { id: string; hasSlottedTitle: boolean },
): string | undefined {
  if (props['aria-labelledby'] !== undefined || props['aria-label'] !== undefined) {
    return props['aria-labelledby'];
  }
  const hasTitle = isEmptyNode(props.header) ? !isEmptyNode(props.title) : title.hasSlottedTitle;
  return hasTitle ? title.id : undefined;
}

interface CardCollapse {
  /** Whether the media, body and footer show. */
  isExpanded: boolean;
  toggle: CardToggle | null;
  ids: { media: string; body: string; footer: string };
}

/** The expanded state of a collapsible card and its control; any other card is always expanded. */
function useCardCollapse(
  props: Pick<
    CardProps,
    | 'isCollapsible'
    | 'isExpanded'
    | 'defaultExpanded'
    | 'onExpandedChange'
    | 'isToggleDisabled'
    | 'media'
    | 'footer'
  >,
): CardCollapse {
  const id = useId();
  const [expanded, setExpanded] = useControllableState(
    props.isExpanded,
    props.defaultExpanded ?? true,
    props.onExpandedChange,
  );
  const ids = { media: `${id}-media`, body: `${id}-body`, footer: `${id}-footer` };
  if (!props.isCollapsible) return { isExpanded: true, toggle: null, ids };
  const controls = [
    isEmptyNode(props.media) ? null : ids.media,
    ids.body,
    isEmptyNode(props.footer) ? null : ids.footer,
  ];
  return {
    isExpanded: expanded,
    ids,
    toggle: {
      isExpanded: expanded,
      isDisabled: Boolean(props.isToggleDisabled),
      controls: controls.filter(Boolean).join(' '),
      toggle: () => setExpanded(!expanded),
    },
  };
}

/** The data attributes of the root. */
function toRootData(
  props: CardProps,
  state: { isActionable: boolean; presentation: CardPresentation; collapse: CardCollapse },
) {
  return {
    variant: props.variant ?? 'default',
    density: props.density ?? 'default',
    selected: props.isSelected,
    loading: props.isLoading,
    interactive: props.interactive || state.isActionable,
    flush: props.flush,
    fill: props.fill,
    fullWidth: props.fullWidth,
    presentation: props.presentationSteps ? state.presentation : undefined,
    collapsible: props.isCollapsible,
    expanded: props.isCollapsible ? state.collapse.isExpanded : undefined,
  };
}

const ownKeys = [
  'variant',
  'density',
  'title',
  'description',
  'actions',
  'headingLevel',
  'header',
  'media',
  'children',
  'footer',
  'isSelected',
  'isLoading',
  'interactive',
  'flush',
  'fill',
  'fullWidth',
  'href',
  'target',
  'rel',
  'onAction',
  'className',
  'leading',
  'meta',
  'summary',
  'abbreviation',
  'isCollapsible',
  'isExpanded',
  'defaultExpanded',
  'onExpandedChange',
  'isToggleDisabled',
  'presentationSteps',
] as const;

/** The caller's attributes for the root: everything the card does not take itself. */
function toRootProps(props: CardProps) {
  const rest: Record<string, unknown> = { ...props };
  for (const key of ownKeys) delete rest[key];
  return rest as Pick<CardProps, 'hidden' | 'role' | 'aria-label' | 'aria-labelledby' | 'id'>;
}

/**
 * A framed container for a self-contained group of content: optional media, an optional header, a
 * body and a footer. With `href` or `onAction` the whole card is a link or press target whose title
 * is the action, while the controls inside it keep their own behaviour. A collapsible card shows
 * and hides its media, body and footer, keeping them mounted; an adaptive card fits its header to
 * the space its container gives it.
 */
export function Card(props: CardProps) {
  const { title, header, media, children, footer, isLoading = false } = props;
  const titleId = useId();
  const level = useHeadingLevel(props.headingLevel);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [slottedTitle, setSlottedTitle] = useState<HTMLElement | null>(null);
  const options = {
    href: props.href,
    target: props.target,
    rel: props.rel,
    onAction: props.onAction,
  };
  const { isActionable, actionRef, onClick } = useCardAction(options);
  const collapse = useCardCollapse(props);
  const presentation = useCardPresentation(root, props.presentationSteps);
  const { more, summary } = useCardMore(presentation, {
    isPresent: !isEmptyNode(props.summary),
    isExpanded: collapse.isExpanded,
  });
  useFocusRescue(root, presentation, collapse.isExpanded);
  const rest = toRootProps(props);
  const labelledBy = toLabelledBy(
    { title, header, ...rest },
    { id: titleId, hasSlottedTitle: slottedTitle !== null },
  );
  const isHidden = !collapse.isExpanded || undefined;

  return (
    <section
      {...rest}
      {...hooks.root({
        className: props.className,
        data: toRootData(props, { isActionable, presentation, collapse }),
      })}
      ref={setRoot}
      aria-labelledby={labelledBy}
      aria-busy={isLoading || undefined}
      onClick={isActionable ? onClick : undefined}
    >
      {isEmptyNode(media) ? null : (
        <div {...hooks.slot('media')} id={collapse.ids.media} hidden={isHidden}>
          {media}
        </div>
      )}
      <CardHeader
        header={header}
        title={title}
        description={props.description}
        actions={props.actions}
        leading={props.leading}
        meta={props.meta}
        abbreviation={props.abbreviation}
        movedSummaryId={summary.movedId}
        presentation={presentation}
        more={more}
        toggle={collapse.toggle}
        headingLevel={level}
        titleId={titleId}
        titleRef={setSlottedTitle}
        action={{ options, isActionable, ref: actionRef }}
      />
      <CardSummary id={summary.id} isMoved={summary.isMoved} isHidden={summary.isHidden}>
        {props.summary}
      </CardSummary>
      <div {...hooks.slot('body')} id={collapse.ids.body} hidden={isHidden}>
        {isLoading ? (
          <Skeleton className={hooks.slotClass('skeleton')} />
        ) : isEmptyNode(title) ? (
          children
        ) : (
          <HeadingLevelContext value={level}>{children}</HeadingLevelContext>
        )}
      </div>
      {isEmptyNode(footer) ? null : (
        <footer {...hooks.slot('footer')} id={collapse.ids.footer} hidden={isHidden}>
          {footer}
        </footer>
      )}
    </section>
  );
}
