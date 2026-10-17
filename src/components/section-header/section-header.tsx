import { useId, type ReactNode } from 'react';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Stack, type LayoutContainmentProps, type LayoutSpace } from '../layout/layout.js';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface SectionHeaderProps extends BaseProps {
  /** The heading text. */
  title: ReactNode;
  /** Supporting text under the title. Omitted when it renders nothing. */
  description?: ReactNode;
  /** Trailing actions or status, after the text. */
  actions?: ReactNode;
  /** The heading element's level. Defaults to 3. */
  headingLevel?: HeadingLevel | undefined;
}

export interface SectionProps extends SectionHeaderProps, LayoutContainmentProps {
  /** The section's content, after its header. */
  children?: ReactNode;
  /** Gap between the header and the content. Defaults to `md`. */
  space?: LayoutSpace | undefined;
}

type HeaderContentProps = Pick<SectionHeaderProps, 'title' | 'description' | 'actions'> & {
  headingLevel: HeadingLevel;
  headingId: string;
};

const headerHooks = createHooks('section-header', ['content', 'title', 'description', 'actions']);
const sectionHooks = createHooks('section');

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
        {isEmptyNode(description) ? null : (
          <div {...headerHooks.slot('description')}>{description}</div>
        )}
      </div>
      {isEmptyNode(actions) ? null : <div {...headerHooks.slot('actions')}>{actions}</div>}
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
  ...rest
}: SectionHeaderProps) {
  const headingId = useId();
  return (
    <header {...rest} {...headerHooks.root({ className })}>
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
  className,
  ...rest
}: SectionProps) {
  const headingId = useId();
  return (
    <Stack
      as="section"
      {...rest}
      className={mergeClassNames(sectionHooks.className, className)}
      space={space}
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
