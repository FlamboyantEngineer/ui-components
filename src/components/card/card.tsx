import { useId, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { HeadingLevel } from '../section-header/section-header.js';

/** `default`: content on the page. `panel`: a chrome region on a muted surface. */
export type CardVariant = 'default' | 'panel';

/** `default` keeps each part's own inset; the others give the card one interior padding. */
export type CardDensity = 'default' | 'comfortable' | 'compact' | 'tight';

export interface CardProps
  extends
    BaseProps,
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
  /** The title's heading level. Defaults to 3. */
  headingLevel?: HeadingLevel | undefined;
  /** Custom header content, in place of the title, description and actions. */
  header?: ReactNode;
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
};

const hooks = createHooks('card', [
  'header',
  'heading',
  'title',
  'description',
  'actions',
  'body',
  'footer',
]);

/** The card's `aria-labelledby`: the caller's, else its own title's unless the caller names it. */
function toLabelledBy(
  props: Pick<CardProps, 'title' | 'header' | 'aria-label' | 'aria-labelledby'>,
  titleId: string,
): string | undefined {
  if (props['aria-labelledby'] !== undefined || props['aria-label'] !== undefined) {
    return props['aria-labelledby'];
  }
  return isEmptyNode(props.header) && !isEmptyNode(props.title) ? titleId : undefined;
}

function CardHeading({
  title,
  description,
  headingLevel,
  titleId,
}: Omit<CardHeaderProps, 'actions' | 'header'>) {
  const Heading = `h${headingLevel}` as const;
  if (isEmptyNode(title) && isEmptyNode(description)) return null;
  return (
    <div {...hooks.slot('heading')}>
      {isEmptyNode(title) ? null : (
        <Heading {...hooks.slot('title')} id={titleId}>
          {title}
        </Heading>
      )}
      {isEmptyNode(description) ? null : <div {...hooks.slot('description')}>{description}</div>}
    </div>
  );
}

/** The `<header>`: custom content, or the title block and actions; nothing when all are empty. */
function CardHeader({ header, actions, ...heading }: CardHeaderProps) {
  if (!isEmptyNode(header)) return <header {...hooks.slot('header')}>{header}</header>;
  if ([heading.title, heading.description, actions].every(isEmptyNode)) return null;
  return (
    <header {...hooks.slot('header')}>
      <CardHeading {...heading} />
      {isEmptyNode(actions) ? null : <div {...hooks.slot('actions')}>{actions}</div>}
    </header>
  );
}

/** A framed container for a self-contained group of content: an optional header, a body and a footer. */
export function Card({
  variant = 'default',
  density = 'default',
  title,
  description,
  actions,
  headingLevel = 3,
  header,
  children,
  footer,
  isSelected,
  interactive,
  flush,
  fill,
  fullWidth,
  className,
  ...rest
}: CardProps) {
  const titleId = useId();
  const data = { variant, density, selected: isSelected, interactive, flush, fill, fullWidth };

  return (
    <section
      {...rest}
      {...hooks.root({ className, data })}
      aria-labelledby={toLabelledBy({ title, header, ...rest }, titleId)}
    >
      <CardHeader
        header={header}
        title={title}
        description={description}
        actions={actions}
        headingLevel={headingLevel}
        titleId={titleId}
      />
      <div {...hooks.slot('body')}>{children}</div>
      {isEmptyNode(footer) ? null : <footer {...hooks.slot('footer')}>{footer}</footer>}
    </section>
  );
}
