import { useId, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';

/** `default`: content on the page. `panel`: a chrome region on a muted surface. */
export type CardVariant = 'default' | 'panel';

/** `default` keeps each part's own inset; the others give the card one interior padding. */
export type CardDensity = 'default' | 'comfortable' | 'compact' | 'tight';

export interface CardProps {
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
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  /** Custom header content, in place of the title, description and actions. */
  header?: ReactNode;
  /** The body. */
  children?: ReactNode;
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
  /** The role a surrounding collection gives its items. */
  role?: string | undefined;
  id?: string | undefined;
  hidden?: boolean | undefined;
  className?: string | undefined;
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('card', [
  'header',
  'heading',
  'title',
  'description',
  'actions',
  'body',
  'footer',
]);

function present(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
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
  isSelected = false,
  interactive = false,
  flush = false,
  fill = false,
  fullWidth = false,
  role,
  id,
  hidden,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: CardProps) {
  const titleId = useId();
  const custom = present(header);
  const hasTitle = !custom && present(title);
  const hasDescription = !custom && present(description);
  const hasActions = !custom && present(actions);
  const Heading = `h${headingLevel}` as const;
  const named = ariaLabel !== undefined || ariaLabelledBy !== undefined;

  return (
    <section
      {...hooks.root({
        className,
        props: rest,
        data: { variant, density, selected: isSelected, interactive, flush, fill, fullWidth },
      })}
      id={id}
      hidden={hidden}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy ?? (hasTitle && !named ? titleId : undefined)}
    >
      {custom || hasTitle || hasDescription || hasActions ? (
        <header {...hooks.slot('header')}>
          {custom ? header : null}
          {hasTitle || hasDescription ? (
            <div {...hooks.slot('heading')}>
              {hasTitle ? (
                <Heading {...hooks.slot('title')} id={titleId}>
                  {title}
                </Heading>
              ) : null}
              {hasDescription ? <div {...hooks.slot('description')}>{description}</div> : null}
            </div>
          ) : null}
          {hasActions ? <div {...hooks.slot('actions')}>{actions}</div> : null}
        </header>
      ) : null}
      <div {...hooks.slot('body')}>{children}</div>
      {present(footer) ? <footer {...hooks.slot('footer')}>{footer}</footer> : null}
    </section>
  );
}
