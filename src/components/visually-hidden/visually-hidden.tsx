'use client';

import { useState, type ReactNode } from 'react';
import { VisuallyHidden as AriaVisuallyHidden, useFocusWithin } from '../../primitives/index.js';
import type { FocusEventProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import { mergeProps } from '../../utils/merge-props.js';

/** The element that hides the content: a `<span>` keeps phrasing content valid. */
export type VisuallyHiddenElement = 'div' | 'span';

export interface VisuallyHiddenProps
  extends BaseProps, Pick<FocusEventProps, 'onFocus' | 'onBlur'>, Pick<NativeProps<'div'>, 'role'> {
  /** The content only assistive technology perceives. */
  children?: ReactNode;
  /** The element to render. Defaults to `div`. */
  elementType?: VisuallyHiddenElement | undefined;
  /** Shows the content while it or a descendant has focus, as a skip link does. */
  isFocusable?: boolean | undefined;
}

const hooks = createHooks('visually-hidden');

/**
 * Content only assistive technology perceives, such as the name of an icon-only control. With
 * `isFocusable` it shows while it or a descendant has focus, as a skip link does.
 */
export function VisuallyHidden({ className, isFocusable = false, ...rest }: VisuallyHiddenProps) {
  const [isFocusWithin, setFocusWithin] = useState(false);
  const { focusWithinProps } = useFocusWithin({
    isDisabled: !isFocusable,
    onFocusWithinChange: setFocusWithin,
  });
  const hookProps = hooks.root({
    className,
    props: rest,
    data: { focusWithin: isFocusable && isFocusWithin },
  });
  return (
    <AriaVisuallyHidden
      {...mergeProps(rest, focusWithinProps)}
      {...hookProps}
      isFocusable={isFocusable}
    />
  );
}
