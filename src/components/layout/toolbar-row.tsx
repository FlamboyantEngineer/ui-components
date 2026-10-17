import type { ComponentPropsWithRef } from 'react';
import { Toolbar } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import {
  layoutGrowValue,
  type LayoutContainmentProps,
  type LayoutJustify,
  type LayoutSpace,
  type LayoutWrap,
} from './layout.js';

export type ToolbarRowRole = 'toolbar' | 'group' | 'none';
export type ToolbarRowVariant = 'plain' | 'band';

export interface ToolbarRowProps
  extends
    Omit<ComponentPropsWithRef<'div'>, 'className' | 'style' | 'role'>,
    LayoutContainmentProps {
  /**
   * `toolbar` (the default) is a React Aria toolbar: arrow keys move focus between its controls and
   * Tab leaves it. `group` keeps every control a tab stop; `none` adds no role.
   */
  role?: ToolbarRowRole | undefined;
  /** `band` asks the stylesheet for a surface behind the row. Defaults to `plain`. */
  variant?: ToolbarRowVariant | undefined;
  /** Gap between controls. Defaults to `sm`. */
  space?: LayoutSpace | undefined;
  /** Distribution of controls. Defaults to `end`. */
  justify?: LayoutJustify | undefined;
  /** Whether controls wrap. Defaults to `wrap`. */
  wrap?: LayoutWrap | undefined;
  className?: string | undefined;
}

const hooks = createHooks('toolbar-row');

/** A row of controls, vertically centred, with a gap. */
export function ToolbarRow({
  children,
  className,
  role = 'toolbar',
  variant = 'plain',
  space = 'sm',
  justify = 'end',
  wrap = 'wrap',
  grow,
  fill = false,
  clip = false,
  ...rest
}: ToolbarRowProps) {
  const hookProps = hooks.root({
    className,
    data: { variant, space, justify, wrap, grow: layoutGrowValue(grow, false), fill, clip },
  });
  if (role === 'toolbar') {
    return (
      <Toolbar {...rest} {...hookProps}>
        {children}
      </Toolbar>
    );
  }
  return (
    <div {...rest} {...hookProps} role={role === 'group' ? 'group' : undefined}>
      {children}
    </div>
  );
}
