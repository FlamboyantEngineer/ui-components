import { useState } from 'react';
import {
  VisuallyHidden as AriaVisuallyHidden,
  type VisuallyHiddenProps as AriaVisuallyHiddenProps,
} from 'react-aria-components';
import { useFocusWithin } from 'react-aria/useFocusWithin';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { mergeProps } from '../../utils/merge-props.js';

export interface VisuallyHiddenProps
  extends Omit<AriaVisuallyHiddenProps, 'className' | 'style'>, BaseProps {}

const hooks = createHooks('visually-hidden');

/**
 * Content only assistive technology perceives, such as the name of an icon-only control. With
 * `isFocusable` it shows while it or a descendant has focus, as a skip link does (React Aria
 * `VisuallyHidden`).
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
