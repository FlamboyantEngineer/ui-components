import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Icon } from '../icon/icon.js';

export interface DragHandleProps
  extends
    Omit<AriaButtonProps, 'className' | 'style' | 'children' | 'render' | 'slot'>,
    BaseProps {}

const hooks = createHooks('drag-handle');

/**
 * The drag button of a row in a React Aria collection that reorders by drag and drop. The collection
 * names it after the row and starts the row's keyboard drag from it; it stays out of the tab
 * sequence, since the collection reaches it with the arrow keys.
 */
export function DragHandle({ className, ...rest }: DragHandleProps) {
  return (
    <AriaButton
      excludeFromTabOrder
      {...rest}
      {...hooks.root({ className, props: rest })}
      slot="drag"
    >
      <Icon glyph="drag-handle" size="sm" />
    </AriaButton>
  );
}
