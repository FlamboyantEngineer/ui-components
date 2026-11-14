import type { BaseProps, Key } from '../../core/props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { ButtonProps } from '../button/button.js';
import type { MenuEntry, MenuProps } from '../menu/menu.js';

export interface ActionRowAction
  extends
    Omit<BaseProps, 'className' | 'id'>,
    Pick<
      ButtonProps,
      | 'isDisabled'
      | 'isPending'
      | 'aria-controls'
      | 'aria-haspopup'
      | 'onPress'
      | 'onError'
      | 'icon'
      | 'pendingLabel'
      | 'isSelected'
      | 'ref'
    > {
  /** Stable identity within the row. */
  id: Key;
  /** The action's accessible name. */
  label: string;
  /** Tooltip text when it says more than the label (a shortcut, why the action is disabled). */
  tooltip?: string | undefined;
  /** A disclosure's state, published as `aria-expanded`. */
  isExpanded?: boolean | undefined;
  /**
   * The entries of a menu the action opens, as `Menu` takes them: items (with icons, descriptions,
   * shortcuts, tones and submenus), sections and separators. The button then opens the menu
   * instead of calling `onPress`, and the menu owns its popup attributes.
   */
  items?: readonly MenuEntry[] | undefined;
  /** Called with the id of the menu item chosen. */
  onAction?: MenuProps['onAction'];
}

/** The action identity, preserving the distinction between numeric and text ids. */
export function toActionKey(action: ActionRowAction): string {
  return toKeyIdentity(action.id);
}
