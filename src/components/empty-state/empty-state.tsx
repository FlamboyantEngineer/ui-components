import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { HeadingLevel } from '../section-header/section-header.js';

/** `empty`: loaded with nothing to show. `loading`: being fetched. `error`: could not load. */
export type EmptyStateVariant = 'empty' | 'loading' | 'error';

export type EmptyStateSize = Extract<Size, 'sm' | 'md'>;

export interface EmptyStateProps extends BaseProps, Pick<NativeProps<'section'>, 'hidden'> {
  /** One line on what is missing, what is loading or what the reader can do next. */
  description: ReactNode;
  /** An optional heading over the description. */
  title?: ReactNode;
  /** What the notice stands for. Defaults to `empty`. */
  variant?: EmptyStateVariant | undefined;
  /** `sm` for dense containers, `md` (the default) elsewhere. */
  size?: EmptyStateSize | undefined;
  /** The title's heading level. Defaults to 3. */
  headingLevel?: HeadingLevel | undefined;
}

const hooks = createHooks('empty-state', ['spinner', 'title', 'description']);

const loadingRegion = { role: 'status', 'aria-live': 'polite', 'aria-atomic': true } as const;

function toTypographicEllipsis(node: ReactNode): ReactNode {
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
  className,
  ...rest
}: EmptyStateProps) {
  const isLoading = variant === 'loading';
  const Heading = `h${headingLevel}` as const;

  return (
    <section
      {...rest}
      {...hooks.root({ className, data: { variant, size } })}
      {...(isLoading ? loadingRegion : {})}
    >
      {isLoading ? <span {...hooks.slot('spinner')} aria-hidden="true" /> : null}
      {isEmptyNode(title) ? null : <Heading {...hooks.slot('title')}>{title}</Heading>}
      <p {...hooks.slot('description')}>
        {isLoading ? toTypographicEllipsis(description) : description}
      </p>
    </section>
  );
}
