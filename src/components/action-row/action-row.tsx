import type { ReactElement, ReactNode } from 'react';
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
  /** Wraps the rendered button (with its tooltip), for example in a React Aria `MenuTrigger`. */
  wrap?: ((button: ReactElement) => ReactElement) | undefined;
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

/** A custom action's ref and toggle state, which report `aria-pressed` either way once set. */
function toCustomButtonProps(action: ActionRowAction): Partial<IconButtonProps> {
  if (action.verb !== 'custom') return {};
  if (action.isSelected === undefined) return { ref: action.ref };
  return { ref: action.ref, isSelected: action.isSelected, 'aria-pressed': action.isSelected };
}

function ActionRowButton({ action, size }: { action: ActionRowAction; size: ButtonSize }) {
  const { icon, label, pendingLabel } = useActionContent(action);
  const button = (
    <IconButton
      {...pickDataAttributes(action)}
      {...hooks.slot('action', { verb: action.verb })}
      {...toCustomButtonProps(action)}
      id={action.id}
      icon={icon}
      label={label}
      size={size}
      isDisabled={action.isDisabled}
      // A disabled action that explains itself in its tooltip stays focusable so the reason can be read.
      focusableWhenDisabled={action.tooltip !== undefined}
      isPending={action.isPending}
      pendingLabel={pendingLabel}
      aria-expanded={action.isExpanded}
      aria-controls={action['aria-controls']}
      aria-haspopup={action['aria-haspopup']}
      onPress={action.onPress}
    />
  );
  const withTooltip = (
    <TooltipTrigger>
      {button}
      <Tooltip className={hooks.slotClass('tooltip')}>{action.tooltip ?? label}</Tooltip>
    </TooltipTrigger>
  );
  return action.wrap ? action.wrap(withTooltip) : withTooltip;
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
