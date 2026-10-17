import { createContext, useContext, type ReactNode } from 'react';
import {
  Group,
  Separator,
  Toolbar,
  type GroupProps,
  type SeparatorProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Orientation } from '../../core/props.js';
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
  /** `vertical` stacks the controls, and a toolbar moves focus with Up and Down. Defaults to `horizontal`. */
  orientation?: Orientation | undefined;
  /** Gap between controls. Defaults to `sm`. */
  space?: LayoutSpace | undefined;
  /** Distribution of controls. Defaults to `end`. */
  justify?: LayoutJustify | undefined;
  /** Whether controls wrap. Defaults to `wrap`. */
  wrap?: LayoutWrap | undefined;
}

export interface ToolbarRowGroupProps
  extends Omit<GroupProps, 'className' | 'style' | 'children' | 'role'>, BaseProps {
  /** The group's controls. Name the group with `aria-label` or `aria-labelledby`. */
  children?: ReactNode;
}

export type ToolbarRowSeparatorProps = Omit<
  SeparatorProps,
  'className' | 'style' | 'orientation' | 'elementType'
> &
  BaseProps;

const hooks = createHooks('toolbar-row', ['group', 'separator']);

/** The orientation of the enclosing row, which its groups follow and its separators cross. */
const ToolbarRowContext = createContext<Orientation>('horizontal');

/** A row of controls, vertically centred, with a gap; or a column of them when vertical. */
export function ToolbarRow({
  children,
  className,
  role = 'toolbar',
  variant = 'plain',
  orientation = 'horizontal',
  space = 'md',
  justify = 'end',
  wrap = 'wrap',
  grow,
  fill,
  clip,
  ...rest
}: ToolbarRowProps) {
  const containment = resolveContainment({ grow, fill, clip });
  const hookProps = hooks.root({
    className,
    data: { variant, orientation, space, justify, wrap, ...containment },
  });
  const content = <ToolbarRowContext value={orientation}>{children}</ToolbarRowContext>;
  if (role === 'toolbar') {
    return (
      <Toolbar {...rest} {...hookProps} orientation={orientation}>
        {content}
      </Toolbar>
    );
  }
  return (
    <div {...rest} {...hookProps} role={role === 'group' ? 'group' : undefined}>
      {content}
    </div>
  );
}

/**
 * A named group of related controls inside a `ToolbarRow` (React Aria `Group`), laid out along the
 * row. In a toolbar, arrow keys still move through every control of the row.
 */
export function ToolbarRowGroup({ children, className, ...rest }: ToolbarRowGroupProps) {
  const orientation = useContext(ToolbarRowContext);
  return (
    <Group {...rest} {...hooks.slot('group', { orientation }, className)}>
      {children}
    </Group>
  );
}

/** A divider between controls or groups of a `ToolbarRow`, across the row (React Aria `Separator`). */
export function ToolbarRowSeparator({ className, ...rest }: ToolbarRowSeparatorProps) {
  const orientation = useContext(ToolbarRowContext) === 'horizontal' ? 'vertical' : 'horizontal';
  return (
    <Separator
      {...rest}
      {...hooks.slot('separator', { orientation }, className)}
      orientation={orientation}
    />
  );
}
