import type { ReactNode } from 'react';
import type { ToolbarProps as AriaToolbarProps } from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { ButtonSize } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';
import { ActionRowActions, createClearKey } from './action-row-actions.js';
import { orderActions, type ActionRowAction } from './action-verbs.js';

/** `visible` keeps every action in the row; `menu` collapses those that do not fit into a menu. */
export type ActionRowOverflow = 'visible' | 'menu';

export interface ActionRowProps
  extends Pick<AriaToolbarProps, 'aria-label' | 'aria-labelledby'>, BaseProps {
  /** The actions, drawn as icon buttons: custom actions in their order, then the verbs in theirs. */
  actions: readonly ActionRowAction[];
  /** Content at the start of the row, before the actions (a title, a filter, a status line). */
  lead?: ReactNode;
  /** Size of every action button. Defaults to `md`. */
  size?: ButtonSize | undefined;
  /**
   * Draws the actions as one React Aria toolbar, named by `aria-label` or `aria-labelledby`: one tab
   * stop, with the arrow keys moving between the actions.
   */
  toolbar?: boolean | undefined;
  /** What happens to actions that do not fit. Defaults to `visible`. */
  overflow?: ActionRowOverflow | undefined;
  /**
   * Makes the row a selection bar for a collection: it shows this count with a clear button, and
   * renders only while the count is above zero.
   */
  selectedCount?: number | undefined;
  /** Clears the selection: the clear button and Escape inside the row call it. */
  onClearSelection?: (() => void) | undefined;
}

const hooks = createHooks('action-row', ['selection', 'clear', 'count', 'lead']);

/** The selected count and the button that clears the selection. */
function SelectionStatus({
  count,
  onClear,
}: {
  count: number;
  onClear?: (() => void) | undefined;
}) {
  const strings = useUiStrings();
  return (
    <div {...hooks.slot('selection')}>
      {onClear ? (
        <IconButton
          {...hooks.slot('clear')}
          icon="close"
          label={strings.clearSelection}
          tooltip={strings.clearSelection}
          size="sm"
          onPress={onClear}
        />
      ) : null}
      <span {...hooks.slot('count')} role="status">
        {strings.selectedCount(count)}
      </span>
    </div>
  );
}

/**
 * A row of icon-button actions described as data: standard verbs with fixed glyphs, labels and
 * places, and custom actions, each with a tooltip. It can be one toolbar, collapse actions into a
 * menu and serve as a collection's selection bar. Renders nothing without actions or lead content.
 */
export function ActionRow({
  actions,
  lead,
  size = 'md',
  toolbar = false,
  overflow = 'visible',
  selectedCount,
  onClearSelection,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  ...rest
}: ActionRowProps) {
  const isSelection = selectedCount !== undefined;
  if (isSelection && selectedCount <= 0) return null;
  if (actions.length === 0 && isEmptyNode(lead) && !isSelection) return null;
  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest, data: { size, overflow, selection: isSelection } })}
      onKeyDown={isSelection ? createClearKey(onClearSelection) : undefined}
    >
      {isSelection ? <SelectionStatus count={selectedCount} onClear={onClearSelection} /> : null}
      {isEmptyNode(lead) ? null : <div {...hooks.slot('lead')}>{lead}</div>}
      {actions.length > 0 ? (
        <ActionRowActions
          actions={orderActions(actions)}
          size={size}
          isToolbar={toolbar}
          isCollapsing={overflow === 'menu'}
          aria-label={toolbar ? ariaLabel : undefined}
          aria-labelledby={toolbar ? ariaLabelledBy : undefined}
        />
      ) : null}
    </div>
  );
}

export { actionVerbs, orderActions } from './action-verbs.js';
export type {
  ActionRowAction,
  ActionRowCustomAction,
  ActionRowVerbAction,
  ActionVerb,
} from './action-verbs.js';
