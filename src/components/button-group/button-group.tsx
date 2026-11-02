'use client';

import type { ReactNode } from 'react';
import { Group } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Density, Orientation, RefProps } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';

/** The states a button group passes to `render` with its root's props. */
export interface ButtonGroupRenderState {
  /** The pointer is over the group. */
  isHovered: boolean;
  /** Focus is inside the group. */
  isFocusWithin: boolean;
  /** Keyboard focus is inside the group. */
  isFocusVisible: boolean;
}

export interface ButtonGroupProps extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** The buttons: `Button` elements or `DropdownMenu` triggers. */
  children?: ReactNode;
  /** Lays the buttons out in a row or a column. Defaults to `horizontal`. */
  orientation?: Orientation | undefined;
  /** How far apart spaced buttons sit. Defaults to `default`. */
  density?: Extract<Density, 'default' | 'compact'> | undefined;
  /** Joins the buttons into one control, with no gap and shared borders. */
  attached?: boolean | undefined;
  /** The buttons share the group's length equally. */
  justified?: boolean | undefined;
  /** Replaces the root `<div>` with the caller's own, given its props and the group's state. */
  render?: ElementRender<'div', ButtonGroupRenderState> | undefined;
}

const hooks = createHooks('button-group');

/**
 * A labelled cluster of related buttons (`role="group"`): spaced or attached,
 * in a row or a column. Each button keeps its own tab stop; a row that should be one tab stop with
 * arrow-key focus is a toolbar.
 */
export function ButtonGroup({
  orientation = 'horizontal',
  density = 'default',
  attached = false,
  justified = false,
  className,
  ...rest
}: ButtonGroupProps) {
  return (
    <Group
      {...rest}
      {...hooks.root({
        className,
        props: rest,
        data: { orientation, density, attached, justified },
      })}
    />
  );
}
