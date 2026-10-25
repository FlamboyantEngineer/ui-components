import type { GlyphName } from '../../core/glyphs.js';
import type { BaseProps } from '../../core/props.js';
import type { UiStrings } from '../../core/strings.js';
import type { IconSource } from '../icon/icon.js';
import type { ButtonProps } from '../button/button.js';
import type { MenuEntry, MenuProps } from '../menu/menu.js';

type StringKey = {
  [K in keyof UiStrings]: UiStrings[K] extends string ? K : never;
}[keyof UiStrings];

interface VerbDefinition {
  /** The built-in glyph the verb draws. */
  glyph: GlyphName;
  /** The provider string that names the verb. */
  label: StringKey;
  /** The provider string that names the busy indicator while the verb is pending. */
  pendingLabel?: StringKey;
}

/**
 * The standard verbs, in the order an action row draws them after its custom actions. Each verb has a
 * fixed glyph and a provider string for its label.
 */
export const actionVerbs = {
  add: { glyph: 'plus', label: 'add' },
  refresh: { glyph: 'refresh', label: 'refresh' },
  more: { glyph: 'more', label: 'more' },
  edit: { glyph: 'edit', label: 'edit' },
  delete: { glyph: 'delete', label: 'delete' },
  save: { glyph: 'save', label: 'save', pendingLabel: 'saving' },
  cancel: { glyph: 'close', label: 'cancel' },
  close: { glyph: 'close', label: 'close' },
} as const satisfies Record<string, VerbDefinition>;

export type ActionVerb = keyof typeof actionVerbs;

// An action describes its button, which carries the row's slot class, so it takes no class name.
interface ActionRowActionBase
  extends
    Omit<BaseProps, 'className'>,
    Pick<ButtonProps, 'isDisabled' | 'isPending' | 'aria-controls' | 'aria-haspopup' | 'onPress'> {
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

/** A standard verb with its fixed glyph, label and place. */
export interface ActionRowVerbAction extends ActionRowActionBase {
  verb: ActionVerb;
  /** Replaces the verb's label, for example to name its subject ("Add comment"). */
  label?: string | undefined;
}

/** An action of the caller's own, drawn before the standard verbs in the order given. */
export interface ActionRowCustomAction
  extends ActionRowActionBase, Pick<ButtonProps, 'icon' | 'label' | 'isSelected' | 'ref'> {
  verb: 'custom';
  label: string;
}

export type ActionRowAction = ActionRowVerbAction | ActionRowCustomAction;

export interface ActionContent {
  icon: IconSource;
  label: string;
  pendingLabel?: string | undefined;
}

const verbOrder: readonly string[] = ['custom', ...Object.keys(actionVerbs)];

/** A custom action's own icon and label, or a verb's glyph and provider strings. */
export function toActionContent(action: ActionRowAction, strings: UiStrings): ActionContent {
  if (action.verb === 'custom') return { icon: action.icon, label: action.label };
  const verb: VerbDefinition = actionVerbs[action.verb];
  return {
    icon: verb.glyph,
    label: action.label ?? strings[verb.label],
    pendingLabel: verb.pendingLabel ? strings[verb.pendingLabel] : undefined,
  };
}

/** Custom actions in their given order, then the standard verbs in their fixed order. */
export function orderActions<A extends ActionRowAction>(actions: readonly A[]): A[] {
  return actions
    .map((action) => ({ action, rank: verbOrder.indexOf(action.verb) }))
    .sort((left, right) => left.rank - right.rank)
    .map(({ action }) => action);
}
