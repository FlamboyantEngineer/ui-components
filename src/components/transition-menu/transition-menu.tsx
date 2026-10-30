'use client';

import { ChevronDownGlyph } from '../../core/glyphs.js';
import { useState, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Badge } from '../badge/badge.js';
import { Button } from '../button/button.js';
import { Menu, MenuPopover, MenuTrigger, type MenuItemEntry } from '../menu/menu.js';
import { StatusLight } from '../status-light/status-light.js';
import { TransitionDialog, type TransitionDialogTarget } from './transition-dialog.js';

/** One state a record can be in. */
export interface TransitionMenuState {
  /** Identifies the state. */
  id: Key;
  /** The state's name. */
  label: string;
  /** The state's tone. Defaults to `neutral`. */
  tone?: Tone | undefined;
}

/** A move from the current state to another. */
export interface TransitionMenuTransition {
  /** Identifies the transition. */
  id: Key;
  /** The `id` of the state it leads to. */
  to: Key;
  /** The action's name. Defaults to the target state's label. */
  label?: string | undefined;
  /** What the transition does, under its name. */
  description?: string | undefined;
  /** Why the transition is unavailable: it shows disabled but focusable, with this under its name. */
  disabledReason?: string | undefined;
  /** Asks for confirmation first, in a dialog with this message. */
  confirmMessage?: ReactNode;
  /** Asks for a comment first, in a dialog that refuses a blank one. */
  requiresComment?: boolean | undefined;
}

/** A transition the reader chose. */
export interface TransitionMenuChange {
  /** The transition's `id`. */
  transition: Key;
  /** The `id` of the state it leads to. */
  to: Key;
  /** The comment, when the transition requires one. */
  comment?: string | undefined;
}

export interface TransitionMenuProps extends BaseProps {
  /** Every state, to name and colour the current one and the targets. */
  states: readonly TransitionMenuState[];
  /** The `id` of the current state. */
  value: Key;
  /** The transitions allowed from the current state, in order. Without any, the state only shows. */
  transitions: readonly TransitionMenuTransition[];
  /** Runs a transition. A returned promise keeps the trigger, or the dialog, pending until it settles. */
  onTransition: (change: TransitionMenuChange) => void | Promise<unknown>;
  /** Names what the state is, as in "Status: Open". Defaults to the provider's `status` string. */
  label?: string | undefined;
  /** Refuses every transition. */
  isDisabled?: boolean | undefined;
}

const hooks = createHooks('transition-menu', ['trigger', 'badge', 'transition', 'comment']);

/** The dialog a transition opens, and the transition it is for. */
interface OpenDialog {
  transition: TransitionMenuTransition;
  target: TransitionDialogTarget;
  isOpen: boolean;
}

function findState(states: readonly TransitionMenuState[], key: Key): TransitionMenuState {
  return states.find((state) => state.id === key) ?? { id: key, label: String(key) };
}

/** A transition as a menu item: its name, the target state's light, and a reason or description. */
function toMenuItem(
  transition: TransitionMenuTransition,
  states: readonly TransitionMenuState[],
): MenuItemEntry {
  const target = findState(states, transition.to);
  const tone = target.tone ?? 'neutral';
  return {
    id: transition.id,
    label: transition.label ?? target.label,
    description: transition.disabledReason ?? transition.description,
    // Unavailable transitions stay reachable by arrow keys, so their reason can be read.
    isDisabled: transition.disabledReason !== undefined,
    focusableWhenDisabled: true,
    icon: <StatusLight tone={tone} size="sm" />,
    className: hooks.slotClass('transition'),
    'data-target-tone': tone,
  };
}

/** Runs a transition straight away, publishing the pending state while a returned promise runs. */
function usePendingRun(onTransition: TransitionMenuProps['onTransition']) {
  const [isPending, setPending] = useState(false);
  const run = async (change: TransitionMenuChange) => {
    setPending(true);
    try {
      await onTransition(change);
    } catch {
      // The caller reports a failed transition; the state it passes back stays the current one.
    } finally {
      setPending(false);
    }
  };
  return { isPending, run };
}

/**
 * A record's current state as a badge that opens a menu of the states it may move to: each allowed
 * transition with its target's tone, a description, or the reason it is unavailable. A transition
 * may ask for confirmation or a required comment in a dialog before it runs.
 */
export function TransitionMenu({
  states,
  value,
  transitions,
  onTransition,
  label,
  isDisabled = false,
  className,
  id,
  ...rest
}: TransitionMenuProps) {
  const strings = useUiStrings();
  const current = findState(states, value);
  const { isPending, run } = usePendingRun(onTransition);
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const badge = (
    <Badge tone={current.tone ?? 'neutral'} className={hooks.slotClass('badge')}>
      {current.label}
    </Badge>
  );
  const choose = (key: Key) => {
    const transition = transitions.find((entry) => entry.id === key);
    if (!transition || transition.disabledReason !== undefined) return;
    if (transition.confirmMessage === undefined && !transition.requiresComment) {
      void run({ transition: transition.id, to: transition.to });
      return;
    }
    const state = findState(states, transition.to).label;
    const target = {
      state,
      action: transition.label ?? strings.transitionTo(state),
      message: transition.confirmMessage,
      requiresComment: transition.requiresComment ?? false,
    };
    setDialog({ transition, target, isOpen: true });
  };
  const data = { pending: isPending, disabled: isDisabled, readonly: transitions.length === 0 };
  return (
    <span id={id} {...hooks.root({ className, props: rest, data })}>
      {transitions.length === 0 ? (
        badge
      ) : (
        <MenuTrigger>
          <Button
            variant="bare"
            className={hooks.slotClass('trigger')}
            aria-label={strings.stateTrigger(label ?? strings.status, current.label)}
            endIcon={ChevronDownGlyph}
            isDisabled={isDisabled}
            isPending={isPending}
          >
            {badge}
          </Button>
          <MenuPopover placement="bottom start">
            <Menu
              aria-label={label ?? strings.status}
              items={transitions.map((transition) => toMenuItem(transition, states))}
              onAction={choose}
            />
          </MenuPopover>
        </MenuTrigger>
      )}
      <TransitionDialog
        target={dialog?.target ?? null}
        isOpen={dialog?.isOpen ?? false}
        onClose={() => setDialog((open) => open && { ...open, isOpen: false })}
        onConfirm={(comment) =>
          dialog
            ? onTransition({ transition: dialog.transition.id, to: dialog.transition.to, comment })
            : undefined
        }
        commentClassName={hooks.slotClass('comment')}
      />
    </span>
  );
}
