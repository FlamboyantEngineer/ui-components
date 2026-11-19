'use client';

import type { OverlayPositionProps } from '../../core/events.js';
import { Menu, MenuPopover, type MenuProps, useMenuSelection } from '../menu/menu.js';

export interface DropdownMenuContentProps extends MenuProps, OverlayPositionProps {}

/** An anchored menu. Selection stays here so it survives closing and reopening the popup. */
export function DropdownMenuContent({
  placement,
  offset,
  crossOffset,
  shouldFlip,
  containerPadding,
  ...props
}: DropdownMenuContentProps) {
  const selection = useMenuSelection(props);
  return (
    <MenuPopover
      placement={placement}
      offset={offset}
      crossOffset={crossOffset}
      shouldFlip={shouldFlip}
      containerPadding={containerPadding}
    >
      <Menu {...props} {...selection} />
    </MenuPopover>
  );
}
