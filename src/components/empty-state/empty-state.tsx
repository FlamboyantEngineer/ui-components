import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';

/** `empty`: loaded with nothing to show. `loading`: being fetched. `error`: could not load. */
export type EmptyStateVariant = 'empty' | 'loading' | 'error';

export type EmptyStateSize = 'sm' | 'md';

export interface EmptyStateProps {
  /** One line on what is missing, what is loading or what the reader can do next. */
  description: ReactNode;
  /** An optional heading over the description. */
  title?: ReactNode;
  /** Defaults to `empty`. */
  variant?: EmptyStateVariant | undefined;
  /** `sm` for dense containers, `md` (the default) elsewhere. */
  size?: EmptyStateSize | undefined;
  /** The title's heading level. Defaults to 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  id?: string | undefined;
  hidden?: boolean | undefined;
  className?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const hooks = createHooks('empty-state', ['spinner', 'title', 'description']);

function typographicEllipsis(node: ReactNode): ReactNode {
  return typeof node === 'string' ? node.replace(/\.{3}/g, '…') : node;
}

/**
 * The notice a collection, panel or section shows in place of its content while it loads, when it
 * has nothing to show, or when it could not load.
 */
export function EmptyState({
  description,
  title,
  variant = 'empty',
  size = 'md',
  headingLevel = 3,
  id,
  hidden,
  className,
  ...rest
}: EmptyStateProps) {
  const loading = variant === 'loading';
  const Heading = `h${headingLevel}` as const;
  const hasTitle = title !== undefined && title !== null && title !== false && title !== '';

  return (
    <section
      {...hooks.root({ className, props: rest, data: { variant, size } })}
      id={id}
      hidden={hidden}
      role={loading ? 'status' : undefined}
      aria-live={loading ? 'polite' : undefined}
      aria-atomic={loading ? 'true' : undefined}
    >
      {loading ? <span {...hooks.slot('spinner')} aria-hidden="true" /> : null}
      {hasTitle ? <Heading {...hooks.slot('title')}>{title}</Heading> : null}
      <p {...hooks.slot('description')}>
        {loading ? typographicEllipsis(description) : description}
      </p>
    </section>
  );
}
