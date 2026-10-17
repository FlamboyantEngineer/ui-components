import type { ReactElement, ReactNode, Ref } from 'react';
import { Tooltip, TooltipTrigger } from 'react-aria-components';
import type { GlyphName } from '../../core/glyphs.js';
import { createHooks, pickDataAttributes } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import type { ButtonSize } from '../button/button.js';
import { IconButton } from '../icon-button/icon-button.js';

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

interface ActionRowActionBase {
  /** A stable id for the button, also used as its React key. */
  id?: string | undefined;
  /** Tooltip text when it says more than the label (a shortcut, why the action is disabled). */
  tooltip?: string | undefined;
  isDisabled?: boolean | undefined;
  /** The action is running: the button shows a busy indicator and refuses presses. */
  isPending?: boolean | undefined;
  /** A disclosure's state, published as `aria-expanded`. */
  isExpanded?: boolean | undefined;
  /** The id of the region the action acts on. */
  'aria-controls'?: string | undefined;
  'aria-haspopup'?:
    | boolean
    | 'menu'
    | 'listbox'
    | 'tree'
    | 'grid'
    | 'dialog'
    | 'true'
    | 'false'
    | undefined;
  /** Wraps the rendered button (with its tooltip), for example in a React Aria `MenuTrigger`. */
  wrap?: ((button: ReactElement) => ReactElement) | undefined;
  onPress?: (() => void) | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

/** A standard verb with its fixed glyph, label and place. */
export interface ActionRowVerbAction extends ActionRowActionBase {
  verb: ActionVerb;
  /** Replaces the verb's label, for example to name its subject ("Add comment"). */
  label?: string | undefined;
}

/** An action of the caller's own, drawn before the standard verbs in the order given. */
export interface ActionRowCustomAction extends ActionRowActionBase {
  verb: 'custom';
  /** A built-in glyph name or icon node. */
  icon: GlyphName | ReactNode;
  label: string;
  /** A toggle's state, published as `aria-pressed` and `data-selected`. */
  isSelected?: boolean | undefined;
  ref?: Ref<HTMLButtonElement> | undefined;
}

export type ActionRowAction = ActionRowVerbAction | ActionRowCustomAction;

export interface ActionRowProps {
  /** The actions, drawn as icon buttons: custom actions in their order, then the verbs in theirs. */
  actions: readonly ActionRowAction[];
  /** Content at the start of the row, before the actions (a title, a filter, a status line). */
  lead?: ReactNode;
  /** Size of every action button. Defaults to `md`. */
  size?: ButtonSize | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

const VERB_ORDER: readonly string[] = ['custom', ...Object.keys(actionVerbs)];

const hooks = createHooks('action-row', ['lead', 'actions', 'action', 'tooltip']);

/** Custom actions in their given order, then the standard verbs in their fixed order. */
export function orderActions<A extends ActionRowAction>(actions: readonly A[]): A[] {
  return actions
    .map((action, index) => ({ action, index, rank: VERB_ORDER.indexOf(action.verb) }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ action }) => action);
}

function ActionRowButton({ action, size }: { action: ActionRowAction; size: ButtonSize }) {
  const strings = useUiStrings();
  const custom = action.verb === 'custom' ? action : undefined;
  const verb: VerbDefinition | undefined =
    action.verb === 'custom' ? undefined : actionVerbs[action.verb];
  const label = custom?.label ?? action.label ?? (verb ? strings[verb.label] : '');
  const isDisabled = action.isDisabled ?? false;
  const button = (
    <IconButton
      {...pickDataAttributes(action)}
      {...hooks.slot('action', { verb: action.verb })}
      ref={custom?.ref}
      id={action.id}
      icon={custom ? custom.icon : verb?.glyph}
      label={label}
      size={size}
      isDisabled={isDisabled}
      // A disabled action that explains itself in its tooltip stays focusable so the reason can be read.
      focusableWhenDisabled={isDisabled && action.tooltip !== undefined}
      isPending={action.isPending ?? false}
      pendingLabel={verb?.pendingLabel ? strings[verb.pendingLabel] : undefined}
      {...(custom?.isSelected === undefined
        ? {}
        : { isSelected: custom.isSelected, 'aria-pressed': custom.isSelected })}
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

/**
 * A row of icon-button actions described as data: standard verbs with fixed glyphs, labels and
 * places, and custom actions, each with a tooltip. Renders nothing without actions or lead content.
 */
export function ActionRow({ actions, lead, size = 'md', className, id, ...rest }: ActionRowProps) {
  if (actions.length === 0 && (lead === undefined || lead === null || lead === false)) return null;
  return (
    <div {...hooks.root({ className, props: rest, data: { size } })} id={id}>
      {lead === undefined || lead === null || lead === false ? null : (
        <div {...hooks.slot('lead')}>{lead}</div>
      )}
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
