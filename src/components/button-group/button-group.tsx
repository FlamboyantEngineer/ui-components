import type { ReactNode, Ref } from 'react';
import { Group, type GroupProps } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Orientation } from '../../core/props.js';

/** `regular` and `compact` space the buttons apart; `attached` joins them into one control. */
export type ButtonGroupDensity = 'regular' | 'compact' | 'attached';

// React Aria's group states only mark the group; they would not disable or validate the buttons.
export interface ButtonGroupProps
  extends
    Omit<
      GroupProps,
      'className' | 'style' | 'children' | 'isDisabled' | 'isInvalid' | 'isReadOnly'
    >,
    BaseProps {
  /** The buttons: `Button`, `IconButton` or `DropdownMenu` triggers. */
  children?: ReactNode;
  /** Lays the buttons out in a row or a column. Defaults to `horizontal`. */
  orientation?: Orientation | undefined;
  /** How close the buttons sit. Defaults to `regular`. */
  density?: ButtonGroupDensity | undefined;
  /** The buttons share the group's length equally. */
  justified?: boolean | undefined;
  /** The group element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

const hooks = createHooks('button-group');

/**
 * A labelled cluster of related buttons (React Aria `Group`, `role="group"`): spaced or attached,
 * in a row or a column. Each button keeps its own tab stop; a row that should be one tab stop with
 * arrow-key focus is a toolbar.
 */
export function ButtonGroup({
  orientation = 'horizontal',
  density = 'regular',
  justified = false,
  className,
  ...rest
}: ButtonGroupProps) {
  return (
    <Group
      {...rest}
      {...hooks.root({ className, props: rest, data: { orientation, density, justified } })}
    />
  );
}
