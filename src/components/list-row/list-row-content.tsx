'use client';

import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, ContainerProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { IconSource } from '../icon/icon.js';
import { Label } from '../label/label.js';

/** `default` media sits as given, `icon` is a small glyph, `image` a cropped square thumbnail. */
export type ListRowLeadingVariant = 'default' | 'icon' | 'image';

export interface ListRowContentProps
  extends Omit<ContainerProps<'span'>, 'title' | 'children'>, BaseProps {
  /** The row's main text. */
  title: ReactNode;
  /** Secondary text below the title, such as a `MetaLine`. */
  meta?: ReactNode;
  /** An imported icon component or rendered element beside the title and meta, drawn through `Label`. */
  icon?: IconSource;
  /** Decorative leading media (an avatar, a thumbnail). Ignored when `icon` is set. */
  leading?: ReactNode;
  /** What the leading media is, for the stylesheet (shadcn/ui's item media variant). Defaults to `default`. */
  leadingVariant?: ListRowLeadingVariant | undefined;
}

const contentHooks = createHooks('list-row-content', ['leading', 'text', 'title', 'meta'], {
  leading: 'item-media',
  text: 'item-content',
  title: 'item-title',
  meta: 'item-description',
});

/**
 * The text of a row without any control: leading media or icon, title and meta. `ListRow` draws it
 * inside its primary control; use it alone inside an element that is itself the link or button.
 */
export function ListRowContent({
  title,
  meta,
  icon,
  leading,
  leadingVariant = 'default',
  className,
  ...rest
}: ListRowContentProps) {
  const text = (
    <span {...contentHooks.slot('text')}>
      <span {...contentHooks.slot('title')}>{title}</span>
      {isEmptyNode(meta) ? null : <span {...contentHooks.slot('meta')}>{meta}</span>}
    </span>
  );
  const media = isEmptyNode(leading) ? null : (
    <span {...contentHooks.slot('leading', { variant: leadingVariant })} aria-hidden="true">
      {leading}
    </span>
  );
  return (
    <span {...rest} {...contentHooks.root({ className, props: rest })}>
      {!icon ? (
        <>
          {media}
          {text}
        </>
      ) : (
        <Label icon={icon} label={text} grow />
      )}
    </span>
  );
}
