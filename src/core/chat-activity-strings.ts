/** Strings of an assistant's activity in a chat: reasoning, groups of steps and plans. */
export interface ChatActivityStrings {
  /** Labels reasoning while it streams in. */
  chatReasoningStreaming: string;
  /** Labels finished reasoning by how long it took in whole seconds; `0` or none reads as a moment. */
  chatReasoningComplete: (seconds?: number) => string;
  /** Labels a group of steps while its run goes on. */
  chatStepsRunning: string;
  /**
   * Sums up a group of steps once its run ended, by how many tool calls of each kind it made, in
   * order (`Edited files, ran a command`); without any, by its whole seconds.
   */
  chatStepsComplete: (
    actions: readonly {
      kind: 'read' | 'edit' | 'command' | 'search' | 'fetch' | 'other';
      count: number;
    }[],
    seconds?: number,
  ) => string;
  /** Names a plan without a title. */
  chatPlan: string;
  /** A plan's progress: how many of its steps are done. */
  chatPlanProgress: (done: number, total: number) => string;
  /** The status words read after a plan step's label (`Book the hotel, Done`). */
  chatPlanStepStatus: (status: 'pending' | 'in-progress' | 'done' | 'failed' | 'skipped') => string;
  /** Announces the plan steps whose status changed, each by its label and new status (`Book the hotel: done`). */
  chatPlanChanged: (
    changes: readonly {
      label: string;
      status: 'pending' | 'in-progress' | 'done' | 'failed' | 'skipped';
    }[],
  ) => string;
}

const planStepStatusNames = {
  pending: 'Pending',
  'in-progress': 'In progress',
  done: 'Done',
  failed: 'Failed',
  skipped: 'Skipped',
} as const;

const actionPhrases = {
  read: ['read a file', 'read files'],
  edit: ['edited a file', 'edited files'],
  command: ['ran a command', 'ran commands'],
  search: ['ran a search', 'ran searches'],
  fetch: ['fetched a page', 'fetched pages'],
  other: ['used a tool', 'used tools'],
} as const;

/** A duration in whole seconds: seconds under a minute, else minutes and seconds. */
function durationText(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const rest = seconds % 60;
  return rest === 0
    ? `${Math.floor(seconds / 60)} min`
    : `${Math.floor(seconds / 60)} min ${rest} s`;
}

const forText = (seconds: number | undefined) =>
  seconds ? `for ${durationText(seconds)}` : 'for a moment';

export const chatActivityStrings: ChatActivityStrings = {
  chatReasoningStreaming: 'Thinking…',
  chatReasoningComplete: (seconds) => `Thought ${forText(seconds)}`,
  chatStepsRunning: 'Working…',
  chatStepsComplete: (actions, seconds) => {
    if (actions.length === 0) return `Worked ${forText(seconds)}`;
    const text = actions
      .map(({ kind, count }) => actionPhrases[kind][count === 1 ? 0 : 1])
      .join(', ');
    return text.charAt(0).toUpperCase() + text.slice(1);
  },
  chatPlan: 'Plan',
  chatPlanProgress: (done, total) => `${done} of ${total} done`,
  chatPlanStepStatus: (status) => planStepStatusNames[status],
  chatPlanChanged: (changes) =>
    changes
      .map(({ label, status }) => `${label}: ${planStepStatusNames[status].toLowerCase()}`)
      .join('. '),
};
