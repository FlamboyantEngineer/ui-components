import { useId, useState, type ReactNode } from 'react';
import { DEFAULT_SLOT, HeadingContext, Provider } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import {
  HeadingLevelContext,
  useHeadingLevel,
  type HeadingLevel,
} from '../section-header/section-header.js';
import { Skeleton } from '../skeleton/skeleton.js';
import {
  CardActionSlots,
  CardActionTitle,
  useCardAction,
  type CardActionOptions,
} from './card-action.js';

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
   * Custom header content, in place of the title, description and actions. A React Aria `Heading`
   * with `slot="title"` in it becomes the card's title and names the card, and a React Aria `Link`
   * or `Button` with `slot="action"` becomes the card's action.
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
}

type CardHeaderProps = Pick<CardProps, 'title' | 'description' | 'actions' | 'header'> & {
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
};

const hooks = createHooks('card', [
  'media',
  'header',
  'heading',
  'title',
  'action',
  'description',
  'actions',
  'body',
  'skeleton',
  'footer',
]);

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

function CardHeading({
  title,
  description,
  headingLevel,
  titleId,
  action,
}: Omit<CardHeaderProps, 'actions' | 'header' | 'titleRef'>) {
  const Heading = `h${headingLevel}` as const;
  if (isEmptyNode(title) && isEmptyNode(description)) return null;
  return (
    <div {...hooks.slot('heading')}>
      {isEmptyNode(title) ? null : (
        <Heading {...hooks.slot('title')} id={titleId}>
          {action.isActionable ? (
            <CardActionTitle
              options={action.options}
              actionRef={action.ref}
              className={hooks.slotClass('action')}
            >
              {title}
            </CardActionTitle>
          ) : (
            title
          )}
        </Heading>
      )}
      {isEmptyNode(description) ? null : <div {...hooks.slot('description')}>{description}</div>}
    </div>
  );
}

/**
 * The `<header>`: custom content, or the title block and actions; nothing when all are empty. Custom
 * content gets the title's props through React Aria's `HeadingContext` under the `title` slot.
 */
function CardHeader({ header, actions, titleRef, ...heading }: CardHeaderProps) {
  if (!isEmptyNode(header)) {
    const title = { id: heading.titleId, className: hooks.slotClass('title'), ref: titleRef };
    const { action } = heading;
    return (
      <header {...hooks.slot('header')}>
        <Provider values={[[HeadingContext, { slots: { [DEFAULT_SLOT]: {}, title } }]]}>
          <CardActionSlots
            options={action.options}
            actionRef={action.ref}
            className={hooks.slotClass('action')}
          >
            {header}
          </CardActionSlots>
        </Provider>
      </header>
    );
  }
  if ([heading.title, heading.description, actions].every(isEmptyNode)) return null;
  return (
    <header {...hooks.slot('header')}>
      <CardHeading {...heading} />
      {isEmptyNode(actions) ? null : <div {...hooks.slot('actions')}>{actions}</div>}
    </header>
  );
}

/**
 * A framed container for a self-contained group of content: optional media, an optional header, a
 * body and a footer. With `href` or `onAction` the whole card is a link or press target whose title
 * is the action, while the controls inside it keep their own behaviour.
 */
export function Card({
  variant = 'default',
  density = 'default',
  title,
  description,
  actions,
  headingLevel,
  header,
  media,
  children,
  footer,
  isSelected,
  isLoading = false,
  interactive,
  flush,
  fill,
  fullWidth,
  href,
  target,
  rel,
  onAction,
  className,
  ...rest
}: CardProps) {
  const titleId = useId();
  const level = useHeadingLevel(headingLevel);
  const [slottedTitle, setSlottedTitle] = useState<HTMLElement | null>(null);
  const options = { href, target, rel, onAction };
  const { isActionable, actionRef, onClick } = useCardAction(options);
  const data = {
    variant,
    density,
    selected: isSelected,
    loading: isLoading,
    interactive: interactive || isActionable,
    flush,
    fill,
    fullWidth,
  };
  const labelledBy = toLabelledBy(
    { title, header, ...rest },
    { id: titleId, hasSlottedTitle: slottedTitle !== null },
  );

  return (
    <section
      {...rest}
      {...hooks.root({ className, data })}
      aria-labelledby={labelledBy}
      aria-busy={isLoading || undefined}
      onClick={isActionable ? onClick : undefined}
    >
      {isEmptyNode(media) ? null : <div {...hooks.slot('media')}>{media}</div>}
      <CardHeader
        header={header}
        title={title}
        description={description}
        actions={actions}
        headingLevel={level}
        titleId={titleId}
        titleRef={setSlottedTitle}
        action={{ options, isActionable, ref: actionRef }}
      />
      <div {...hooks.slot('body')}>
        {isLoading ? (
          <Skeleton className={hooks.slotClass('skeleton')} />
        ) : isEmptyNode(title) ? (
          children
        ) : (
          <HeadingLevelContext value={level}>{children}</HeadingLevelContext>
        )}
      </div>
      {isEmptyNode(footer) ? null : <footer {...hooks.slot('footer')}>{footer}</footer>}
    </section>
  );
}
