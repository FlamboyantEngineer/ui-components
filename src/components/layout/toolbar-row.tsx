import { Toolbar } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps } from '../../core/props.js';
import {
  resolveContainment,
  type LayoutContainmentProps,
  type LayoutJustify,
  type LayoutSpace,
  type LayoutWrap,
} from './layout.js';

export type ToolbarRowRole = 'toolbar' | 'group' | 'none';
export type ToolbarRowVariant = 'plain' | 'surface';

export interface ToolbarRowProps
  extends Omit<NativeProps<'div'>, 'role'>, BaseProps, LayoutContainmentProps {
  /** `toolbar` (default) moves focus by arrow keys, `group` keeps tab stops, `none` has no role. */
  role?: ToolbarRowRole | undefined;
  /** `surface` asks the stylesheet for a surface behind the row. Defaults to `plain`. */
  variant?: ToolbarRowVariant | undefined;
  /** Gap between controls. Defaults to `sm`. */
  space?: LayoutSpace | undefined;
  /** Distribution of controls. Defaults to `end`. */
  justify?: LayoutJustify | undefined;
  /** Whether controls wrap. Defaults to `wrap`. */
  wrap?: LayoutWrap | undefined;
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
  fill,
  clip,
  ...rest
}: ToolbarRowProps) {
  const hookProps = hooks.root({
    className,
    data: { variant, space, justify, wrap, ...resolveContainment({ grow, fill, clip }) },
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
