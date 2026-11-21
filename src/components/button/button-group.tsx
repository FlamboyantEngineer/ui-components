'use client';

import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import type {
  BaseProps,
  ContainerProps,
  Density,
  Orientation,
  RefProps,
} from '../../core/props.js';
import { Group } from '../../primitives/index.js';
import type { ElementRender } from '../../utils/render-element.js';
import { Separator, type SeparatorProps } from '../separator/separator.js';

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

export type ButtonGroupSeparatorProps = Omit<
  SeparatorProps,
  'label' | 'labelPosition' | 'labelPlacement'
>;

export type ButtonGroupTextProps = ContainerProps<'span'> & BaseProps;

const hooks = createHooks('button-group', ['separator', 'text'], {
  root: 'button-group',
  separator: 'button-group-separator',
  text: 'button-group-text',
});

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

/**
 * A rule between buttons of a group (also `ui-separator`), across the group's direction: vertical
 * unless `orientation` says otherwise.
 */
export function ButtonGroupSeparator({
  orientation = 'vertical',
  className,
  ...rest
}: ButtonGroupSeparatorProps) {
  return (
    <Separator
      {...rest}
      orientation={orientation}
      className={mergeClassNames(hooks.slotClass('separator'), className)}
      data-slot={hooks.dataSlot('separator')}
    />
  );
}

/** Text that sits in a group beside its buttons, such as a unit or a prefix. */
export function ButtonGroupText({ className, ...rest }: ButtonGroupTextProps) {
  return <span {...rest} {...hooks.slot('text', undefined, className)} />;
}
