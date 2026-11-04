import { normalizeCount } from '../../utils/count.js';
import type { UiStrings } from '../../core/strings.js';
import type { Key } from '../../core/props.js';
import type { StateMachineState } from './state-machine-view.js';

/** A notification count shows only when positive, and caps at this value as `9+`. */
export const notificationCountMax = 9;

interface StateCount {
  value: number;
  kind: 'structural' | 'notification';
}

/** The count a state shows: its structural count, else a positive notification count. */
export function getStateCount(state: StateMachineState): StateCount | undefined {
  const structural = normalizeCount(state.count);
  if (structural !== undefined) return { value: structural, kind: 'structural' };
  const notification = normalizeCount(state.notificationCount);
  return notification ? { value: notification, kind: 'notification' } : undefined;
}

/**
 * A state's description: the machine status (current, initial, final), then the host's own
 * description, then the shown count, read in both presentations.
 */
export function describeState(
  state: StateMachineState,
  machine: { initial: Key | undefined; current: Key | undefined; withCount: boolean },
  strings: UiStrings,
): string {
  const count = machine.withCount ? getStateCount(state) : undefined;
  return [
    state.id === machine.current ? strings.stateMachineCurrent : '',
    state.id === machine.initial ? strings.stateMachineInitial : '',
    state.isFinal ? strings.stateMachineFinal : '',
    state.description ?? '',
    count ? (state.countLabel ?? strings.itemCount(count.value)) : '',
  ]
    .filter(Boolean)
    .join(' ');
}
