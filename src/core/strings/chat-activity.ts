import { defineStrings, toSelectKey } from '../message-format.js';

type ChatPlanStepStatus = 'pending' | 'in-progress' | 'done' | 'failed' | 'skipped';

/** Strings of an assistant's activity in a chat: reasoning, groups of steps and plans. */
export interface ChatActivityStrings {
  /** Labels reasoning while it streams in. */
  chatReasoningStreaming: string;
  /** Labels finished reasoning by how long it took in whole seconds; `0` or none reads as a moment. */
  chatReasoningComplete: (seconds?: number) => string;
  /** Labels a group of steps while its run goes on. */
  chatStepsRunning: string;
  /**
   * Sums up a group of steps once its run ended, from the `chatStepsAction` phrase of each kind of
   * tool call it made, in order (`Edited files and ran a command`); without any, by its whole seconds.
   */
  chatStepsComplete: (actions: readonly string[], seconds?: number) => string;
  /** One kind of tool call a group of steps made, by how many it made (`edited files`). */
  chatStepsAction: (
    kind: 'read' | 'edit' | 'command' | 'search' | 'fetch' | 'other',
    count: number,
  ) => string;
  /** Names a plan without a title. */
  chatPlan: string;
  /** A plan's progress: how many of its steps are done. */
  chatPlanProgress: (done: number, total: number) => string;
  /** The status words read after a plan step's label (`Book the hotel, Done`). */
  chatPlanStepStatus: (status: ChatPlanStepStatus) => string;
  /** One plan step whose status changed, by its label and new status (`Book the hotel: done`). */
  chatPlanChange: (label: string, status: ChatPlanStepStatus) => string;
  /** Announces the plan steps whose status changed, from their `chatPlanChange` texts. */
  chatPlanChanged: (changes: readonly string[]) => string;
}

/** A duration in whole seconds as minutes and the seconds after them; under a minute, seconds only. */
function toDuration(seconds = 0) {
  return seconds < 60
    ? { minutes: 0, seconds }
    : { minutes: Math.floor(seconds / 60), seconds: seconds % 60 };
}

/** The phrases with the first one capitalized, since they start a sentence. */
function capitalizeFirst(phrases: readonly string[]): string[] {
  const [first = '', ...rest] = phrases;
  return [first.charAt(0).toLocaleUpperCase() + first.slice(1), ...rest];
}

/** The module's text, with the message values each text function reads its arguments as. */
export const chatActivityStrings = defineStrings<ChatActivityStrings>({
  chatReasoningComplete: (seconds) => toDuration(seconds),
  chatStepsComplete: (actions, seconds) => ({
    ...toDuration(seconds),
    count: actions.length,
    actions: { items: capitalizeFirst(actions), type: 'unit' },
  }),
  chatStepsAction: (kind, count) => ({ kind, count }),
  chatPlanProgress: (done, total) => ({ done, total }),
  chatPlanStepStatus: (status) => ({ status: toSelectKey(status) }),
  chatPlanChange: (label, status) => ({ label, status: toSelectKey(status) }),
  chatPlanChanged: (changes) => ({ changes: { items: changes, type: 'unit' } }),
});
