'use client';

import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size, RefProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Icon, type IconSource } from '../icon/icon.js';
import { toIconProps } from '../icon/icon.js';
import type { HeadingLevel } from '../section-header/section-header.js';

/** `empty`: loaded with nothing to show. `loading`: being fetched. `error`: could not load. */
export type EmptyStateVariant = 'empty' | 'loading' | 'error';

export type EmptyStateSize = Extract<Size, 'sm' | 'md'>;

export interface EmptyStateProps
  extends BaseProps, RefProps<HTMLElement>, Pick<NativeProps<'section'>, 'hidden'> {
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
  /** A decorative illustration or glyph over the text: a imported icon component or rendered element. */
  icon?: IconSource;
  /** Calls to action under the description, such as a button that adds the first item. */
  actions?: ReactNode;
}

const hooks = createHooks('empty-state', ['spinner', 'icon', 'title', 'description', 'actions']);

const loadingRegion = { role: 'status', 'aria-live': 'polite', 'aria-atomic': true } as const;

/** The decorative lead: the spinner while loading, else the icon, if any. */
function EmptyStateLead({ icon, isLoading }: { icon: IconSource; isLoading: boolean }) {
  if (isLoading) return <span {...hooks.slot('spinner')} aria-hidden="true" />;
  if (!icon) return null;
  return <Icon {...toIconProps(icon)} className={hooks.slotClass('icon')} />;
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
  icon,
  actions,
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
      <EmptyStateLead icon={icon} isLoading={isLoading} />
      {isEmptyNode(title) ? null : <Heading {...hooks.slot('title')}>{title}</Heading>}
      <p {...hooks.slot('description')}>{description}</p>
      {isEmptyNode(actions) ? null : <div {...hooks.slot('actions')}>{actions}</div>}
    </section>
  );
}
