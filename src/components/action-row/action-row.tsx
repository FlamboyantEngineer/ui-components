import type { ReactNode } from 'react';
import { Tooltip, TooltipTrigger } from 'react-aria-components';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks, pickDataAttributes } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import type { ButtonSize } from '../button/button.js';
import type { IconSource } from '../icon/icon.js';
import { IconButton, type IconButtonProps } from '../icon-button/icon-button.js';
import {
  Menu,
  MenuPopover,
  MenuTrigger,
  type MenuEntry,
  type MenuProps,
  type MenuSize,
} from '../menu/menu.js';

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
    Pick<
      IconButtonProps,
      'isDisabled' | 'isPending' | 'aria-controls' | 'aria-haspopup' | 'onPress'
    > {
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
  extends ActionRowActionBase, Pick<IconButtonProps, 'icon' | 'label' | 'isSelected' | 'ref'> {
  verb: 'custom';
}

export type ActionRowAction = ActionRowVerbAction | ActionRowCustomAction;

export interface ActionRowProps extends BaseProps {
  /** The actions, drawn as icon buttons: custom actions in their order, then the verbs in theirs. */
  actions: readonly ActionRowAction[];
  /** Content at the start of the row, before the actions (a title, a filter, a status line). */
  lead?: ReactNode;
  /** Size of every action button. Defaults to `md`. */
  size?: ButtonSize | undefined;
}

interface ActionContent {
  icon: IconSource;
  label: string;
  pendingLabel?: string | undefined;
}

const verbOrder: readonly string[] = ['custom', ...Object.keys(actionVerbs)];

const hooks = createHooks('action-row', ['lead', 'actions', 'action', 'tooltip']);

/** A custom action's own icon and label, or a verb's glyph and provider strings. */
function useActionContent(action: ActionRowAction): ActionContent {
  const strings = useUiStrings();
  if (action.verb === 'custom') return { icon: action.icon, label: action.label };
  const verb: VerbDefinition = actionVerbs[action.verb];
  return {
    icon: verb.glyph,
    label: action.label ?? strings[verb.label],
    pendingLabel: verb.pendingLabel ? strings[verb.pendingLabel] : undefined,
  };
}

/** An action without a menu presses and states its own popup; a menu trigger leaves both to the menu. */
function toPressProps(action: ActionRowAction, hasMenu: boolean): Partial<IconButtonProps> {
  if (hasMenu) return {};
  return {
    'aria-expanded': action.isExpanded,
    'aria-haspopup': action['aria-haspopup'],
    onPress: action.onPress,
  };
}

/** The action's menu, opened by its button (with the button's tooltip) at the button's end. */
function ActionRowMenu({
  action,
  size,
  children,
}: {
  action: ActionRowAction;
  size: ButtonSize;
  children: ReactNode;
}) {
  const menuSize: MenuSize = size === 'xs' ? 'sm' : size;
  return (
    <MenuTrigger>
      {children}
      <MenuPopover placement="bottom end">
        <Menu items={action.items} onAction={action.onAction} size={menuSize} />
      </MenuPopover>
    </MenuTrigger>
  );
}

/** A custom action's ref and toggle state, which report `aria-pressed` either way once set. */
function toCustomButtonProps(action: ActionRowAction): Partial<IconButtonProps> {
  if (action.verb !== 'custom') return {};
  if (action.isSelected === undefined) return { ref: action.ref };
  return { ref: action.ref, isSelected: action.isSelected, 'aria-pressed': action.isSelected };
}

function ActionRowButton({ action, size }: { action: ActionRowAction; size: ButtonSize }) {
  const { icon, label, pendingLabel } = useActionContent(action);
  const hasMenu = Boolean(action.items?.length);
  const button = (
    <IconButton
      {...pickDataAttributes(action)}
      {...hooks.slot('action', { verb: action.verb })}
      {...toCustomButtonProps(action)}
      {...toPressProps(action, hasMenu)}
      id={action.id}
      icon={icon}
      label={label}
      size={size}
      isDisabled={action.isDisabled}
      // A disabled action that explains itself in its tooltip stays focusable so the reason can be read.
      focusableWhenDisabled={action.tooltip !== undefined}
      isPending={action.isPending}
      pendingLabel={pendingLabel}
      aria-controls={action['aria-controls']}
    />
  );
  const withTooltip = (
    <TooltipTrigger>
      {button}
      <Tooltip className={hooks.slotClass('tooltip')}>{action.tooltip ?? label}</Tooltip>
    </TooltipTrigger>
  );
  if (!hasMenu) return withTooltip;
  return (
    <ActionRowMenu action={action} size={size}>
      {withTooltip}
    </ActionRowMenu>
  );
}

/** Custom actions in their given order, then the standard verbs in their fixed order. */
export function orderActions<A extends ActionRowAction>(actions: readonly A[]): A[] {
  return actions
    .map((action, index) => ({ action, index, rank: verbOrder.indexOf(action.verb) }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ action }) => action);
}

/**
 * A row of icon-button actions described as data: standard verbs with fixed glyphs, labels and
 * places, and custom actions, each with a tooltip. Renders nothing without actions or lead content.
 */
export function ActionRow({ actions, lead, size = 'md', className, ...rest }: ActionRowProps) {
  if (actions.length === 0 && isEmptyNode(lead)) return null;
  return (
    <div {...rest} {...hooks.root({ className, props: rest, data: { size } })}>
      {isEmptyNode(lead) ? null : <div {...hooks.slot('lead')}>{lead}</div>}
      {actions.length > 0 ? (
        <div {...hooks.slot('actions')}>
          {orderActions(actions).map((action, index) => (
            <ActionRowButton
              key={action.id ?? `${action.verb}-${index}`}
              action={action}
              size={size}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
