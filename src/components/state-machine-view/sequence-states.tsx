'use client';

// The sequence's state row: one roving tab stop over the enabled states, activation apart from
// selection, counts, hints and context menu requests (specs/STATE-MACHINE-VIEW.md).

import { useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../../primitives/index.js';
import { getComposedActiveElement, isFocusLost } from '../../utils/composed-focus.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { isHiddenOrGone, useFocusRecovery } from '../../utils/use-focus-recovery.js';
import { Badge } from '../badge/badge.js';
import { Tooltip } from '../tooltip/tooltip.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { describeState, getStateCount, notificationCountMax } from './describe-state.js';
import { getContextMenuRequestHandlers, isKeyboardContextMenu } from './sequence-interaction.js';
import type { SequenceLayout } from './sequence-layout.js';
import { hooks } from './state-machine-view-hooks.js';
import type { StateMachineState, StateMachineViewProps } from './state-machine-view.js';

type SequenceViewProps = Omit<StateMachineViewProps, 'presentation'>;

interface SequenceStatesProps {
  props: SequenceViewProps;
  layout: SequenceLayout;
  rootRef: RefObject<HTMLElement | null>;
  focus: SequenceFocusHandlers;
}

const stateSelector = `.${hooks.slotClass('state')}`;

/** The key moving focus from `index` to another enabled state reaches, or none. */
function findNextIndex(key: string, index: number, count: number): number | undefined {
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowRight' || key === 'ArrowDown') return Math.min(count - 1, index + 1);
  if (key === 'ArrowLeft' || key === 'ArrowUp') return Math.max(0, index - 1);
  return undefined;
}

/** The enabled state buttons, in reading order. */
function listEnabledStates(root: Element | null): HTMLElement[] {
  return [...(root?.querySelectorAll<HTMLElement>(stateSelector) ?? [])].filter(
    (button) => !button.hasAttribute('disabled'),
  );
}

/** The state holding the tab stop: the one focused last, else selected, current or first enabled. */
function pickTabStop(
  states: readonly StateMachineState[],
  candidates: readonly (Key | null | undefined)[],
): string | undefined {
  const enabled = new Set(states.filter((state) => !state.isDisabled).map((state) => state.id));
  const chosen = candidates.find((key) => key != null && enabled.has(key));
  const first = states.find((state) => !state.isDisabled);
  if (chosen != null) return toKeyIdentity(chosen);
  return first ? toKeyIdentity(first.id) : undefined;
}

/** The nearest enabled state to `lostKey` in the previous order, the next first, else the empty note. */
function findNeighbour(
  root: HTMLElement | null,
  order: readonly string[],
  lostKey: string | null,
): HTMLElement | null {
  const at = lostKey === null ? -1 : order.indexOf(lostKey);
  const buttons = listEnabledStates(root);
  const byKey = new Map(buttons.map((button) => [button.getAttribute('data-key'), button]));
  const candidates = [...order.slice(at + 1), ...order.slice(0, Math.max(0, at)).reverse()];
  for (const key of candidates) {
    const button = byKey.get(key);
    if (button && !isHiddenOrGone(button)) return button;
  }
  const note = root?.querySelector(`.${hooks.slotClass('empty')}`);
  return buttons[0] ?? (isHTMLElement(note) ? note : null);
}

/** Whether focus fell from a state the commit disabled: still on it, or dropped to the body. */
function hasFallenFromDisabled(root: HTMLElement, identity: string): boolean {
  if (isFocusLost(root)) return true;
  const active = getComposedActiveElement(root);
  return active?.getAttribute('data-key') === identity && active.hasAttribute('disabled');
}

/** What the state buttons report to focus recovery. */
interface SequenceFocusHandlers {
  onStateFocus: (identity: string) => void;
  /** A blur to nowhere may be the state being disabled, which recovery then handles. */
  onStateBlur: (relatedTarget: EventTarget | null) => void;
}

/**
 * When the focused state is removed or disabled, focus moves to its nearest surviving neighbour,
 * the next first, else to the empty note.
 */
export function useStateFocusRecovery(
  rootRef: RefObject<HTMLElement | null>,
  states: readonly StateMachineState[],
): SequenceFocusHandlers {
  const previous = useRef<string[]>([]);
  const held = useRef<string | null>(null);
  useFocusRecovery(rootRef, (lost) =>
    findNeighbour(rootRef.current, previous.current, lost.getAttribute('data-key')),
  );
  useLayoutEffect(() => {
    const root = rootRef.current;
    const key = held.current;
    const isDisabled = states.some((state) => state.isDisabled && toKeyIdentity(state.id) === key);
    if (root && key !== null && isDisabled && hasFallenFromDisabled(root, key)) {
      held.current = null;
      findNeighbour(root, previous.current, key)?.focus();
    }
    previous.current = states.map((state) => toKeyIdentity(state.id));
  }, [rootRef, states]);
  return useMemo(
    () => ({
      onStateFocus: (identity) => {
        held.current = identity;
      },
      onStateBlur: (relatedTarget) => {
        if (relatedTarget) held.current = null;
      },
    }),
    [],
  );
}

function StateCount({ state }: { state: StateMachineState }) {
  const count = getStateCount(state);
  if (!count) return null;
  const isNotification = count.kind === 'notification';
  return (
    <span {...hooks.slot('count', { kind: count.kind })} aria-hidden="true">
      <Badge
        count={count.value}
        max={isNotification ? notificationCountMax : undefined}
        tone={isNotification ? 'danger' : 'neutral'}
        variant={isNotification ? 'solid' : 'subtle'}
        size="sm"
        aria-hidden
      />
    </span>
  );
}

/** A state's hook values: its machine state, host selection and status, and row position. */
function getStateFlags(
  props: SequenceViewProps,
  state: StateMachineState,
  { index, count }: { index: number; count: number },
) {
  return {
    key: toKeyIdentity(state.id),
    current: state.id === props.currentKey,
    initial: state.id === (props.initialState ?? props.states[0]?.id),
    final: state.isFinal,
    selected: state.id === props.selectedKey && !state.isDisabled,
    disabled: state.isDisabled,
    first: index === 0,
    last: index === count - 1,
    status: state.status,
    tone: state.tone,
  };
}

/** The measured content of a state: initial marker, adornment, label and count in one row. */
function StateContent({
  props,
  state,
  isInitial,
}: {
  props: SequenceViewProps;
  state: StateMachineState;
  isInitial: boolean;
}) {
  return (
    <span {...hooks.slot('state-content')} style={{ width: 'max-content' }}>
      {isInitial ? <span {...hooks.slot('initial-marker')} aria-hidden="true" /> : null}
      {props.renderStateAdornment ? (
        <span {...hooks.slot('state-adornment')} aria-hidden="true">
          {props.renderStateAdornment(state)}
        </span>
      ) : null}
      <span {...hooks.slot('state-label')}>{state.label}</span>
      <StateCount state={state} />
    </span>
  );
}

interface SequenceStateProps {
  props: SequenceViewProps;
  position: SequenceLayout['states'][number];
  index: number;
  layout: SequenceLayout;
  descriptionId: string;
  isTabStop: boolean;
  onFocus: () => void;
  onBlur: (relatedTarget: EventTarget | null) => void;
  moveFocus: (event: { key: string; currentTarget: EventTarget | null }) => boolean;
}

function SequenceState({
  props,
  position: { state, x, width },
  index,
  layout,
  descriptionId,
  isTabStop,
  onFocus,
  onBlur,
  moveFocus,
}: SequenceStateProps) {
  const strings = useUiStrings();
  const initial = props.initialState ?? props.states[0]?.id;
  const flags = getStateFlags(props, state, { index, count: layout.states.length });
  const menu = getContextMenuRequestHandlers(
    props.onStateContextMenu && ((event) => props.onStateContextMenu?.(state.id, state, event)),
  );
  const description = describeState(
    state,
    { initial, current: props.currentKey, withCount: true },
    strings,
  );
  const hint = props.getStateTooltip?.(state);
  const isDescribed = Boolean(description) || hint != null;
  const id = `${descriptionId}-${index}`;
  return (
    <div
      {...hooks.slot('state-position', flags)}
      style={{
        position: 'absolute',
        left: x,
        top: layout.rowY,
        width,
        height: layout.rowHeight,
        pointerEvents: 'auto',
      }}
    >
      <Tooltip
        content={hint}
        isDisabled={hint == null}
        placement={props.stateTooltipPlacement ?? 'top'}
      >
        <Button
          {...hooks.slot('state', flags)}
          aria-describedby={isDescribed ? id : undefined}
          aria-current={flags.current ? 'step' : undefined}
          aria-pressed={flags.selected}
          isDisabled={state.isDisabled}
          excludeFromTabOrder={!isTabStop}
          onFocus={onFocus}
          onBlur={(event) => onBlur(event.relatedTarget)}
          onKeyDown={(event) => {
            if (isKeyboardContextMenu(event)) menu.onKeyDown?.(event);
            else if (moveFocus(event)) event.preventDefault();
            else event.continuePropagation();
          }}
          onContextMenu={menu.onContextMenu}
          onPress={(event) => {
            if (state.id !== props.selectedKey) props.onSelectionChange?.(state.id);
            props.onStateAction?.(state.id, state, event);
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <StateContent props={props} state={state} isInitial={flags.initial} />
        </Button>
      </Tooltip>
      {isDescribed ? (
        // The hint is read here too, always, so its own description never repeats it.
        <VisuallyHidden as="span" id={id}>
          {description} {hint}
        </VisuallyHidden>
      ) : null}
    </div>
  );
}

/** The ordered state buttons, positioned on the shared row. */
export function SequenceStates({ props, layout, rootRef, focus }: SequenceStatesProps) {
  const descriptionId = useId();
  const [focusedKey, setFocusedKey] = useState<Key | null>(null);
  const tabStop = pickTabStop(props.states, [focusedKey, props.selectedKey, props.currentKey]);
  const moveFocus = (event: { key: string; currentTarget: EventTarget | null }) => {
    const buttons = listEnabledStates(rootRef.current);
    const index = buttons.findIndex((button) => button === event.currentTarget);
    const next = findNextIndex(event.key, index, buttons.length);
    if (index < 0 || next === undefined) return false;
    buttons[next]?.focus();
    return true;
  };
  return (
    <div
      {...hooks.slot('state-row')}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      {layout.states.map((position, index) => {
        const identity = toKeyIdentity(position.state.id);
        return (
          <SequenceState
            key={identity}
            props={props}
            position={position}
            index={index}
            layout={layout}
            descriptionId={descriptionId}
            isTabStop={identity === tabStop}
            onFocus={() => {
              focus.onStateFocus(identity);
              setFocusedKey(position.state.id);
            }}
            onBlur={focus.onStateBlur}
            moveFocus={moveFocus}
          />
        );
      })}
    </div>
  );
}
