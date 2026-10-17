import { useId, type ReactNode } from 'react';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import { Stack, type LayoutContainmentProps, type LayoutSpace } from '../layout/layout.js';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface SectionHeaderProps {
  title: ReactNode;
  /** Supporting text under the title. Omitted when null, false or empty. */
  description?: ReactNode;
  /** Trailing actions or status, after the text. */
  actions?: ReactNode;
  /** The heading element's level. Defaults to 3. */
  headingLevel?: HeadingLevel | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

export interface SectionProps extends Omit<SectionHeaderProps, 'id'>, LayoutContainmentProps {
  children?: ReactNode;
  /** Gap between the header and the content. Defaults to `md`. */
  space?: LayoutSpace | undefined;
  id?: string | undefined;
}

const headerHooks = createHooks('section-header', ['content', 'title', 'description', 'actions']);
const sectionHooks = createHooks('section');

function hasContent(node: ReactNode): boolean {
  return node !== null && node !== undefined && node !== false && node !== '';
}

interface HeaderContentProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel: HeadingLevel;
  headingId: string;
}

function HeaderContent({
  title,
  description,
  actions,
  headingLevel,
  headingId,
}: HeaderContentProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <>
      <div {...headerHooks.slot('content')}>
        <Heading {...headerHooks.slot('title')} id={headingId}>
          {title}
        </Heading>
        {hasContent(description) ? (
          <div {...headerHooks.slot('description')}>{description}</div>
        ) : null}
      </div>
      {hasContent(actions) ? <div {...headerHooks.slot('actions')}>{actions}</div> : null}
    </>
  );
}

/** A section title with optional supporting text and trailing actions, in a `<header>`. */
export function SectionHeader({
  title,
  description,
  actions,
  headingLevel = 3,
  className,
  id,
  ...rest
}: SectionHeaderProps) {
  const headingId = useId();
  return (
    <header {...headerHooks.root({ className, props: rest })} id={id}>
      <HeaderContent
        title={title}
        description={description}
        actions={actions}
        headingLevel={headingLevel}
        headingId={headingId}
      />
    </header>
  );
}

/**
 * A `<section>` region named by its header's title, followed by its content in a `Stack`. The
 * description and actions stay out of the region's name.
 */
export function Section({
  title,
  description,
  actions,
  headingLevel = 3,
  children,
  space = 'md',
  grow,
  fill,
  clip,
  className,
  id,
  ...rest
}: SectionProps) {
  const headingId = useId();
  const [data] = splitDataAttributes(rest);
  return (
    <Stack
      as="section"
      {...data}
      {...sectionHooks.root({ className })}
      space={space}
      grow={grow ?? false}
      fill={fill}
      clip={clip}
      id={id}
      aria-labelledby={headingId}
    >
      <header {...headerHooks.root()}>
        <HeaderContent
          title={title}
          description={description}
          actions={actions}
          headingLevel={headingLevel}
          headingId={headingId}
        />
      </header>
      {children}
    </Stack>
  );
}
