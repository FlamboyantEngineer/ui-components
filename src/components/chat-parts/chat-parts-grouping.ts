import { requireDefined } from '../../utils/require-defined.js';
import type { ChatStepsAction } from '../chat-activity/chat-activity.js';
import type { ChatPart, ChatReasoningPart, ChatToolCallPart } from './chat-part.js';

/** A part that can be a step of a group: reasoning or a tool call. */
export type ChatStepPart = ChatReasoningPart | ChatToolCallPart;

/** A part shown on its own, keyed for rendering. */
interface ChatPartItem {
  kind: 'part';
  key: string;
  part: ChatPart;
}

/** Consecutive steps shown as one group, keyed (and expanded) by its first step's id. */
export interface ChatStepsItem {
  kind: 'steps';
  key: string;
  steps: ChatStepPart[];
}

export type ChatPartsItem = ChatPartItem | ChatStepsItem;

function isStepPart(part: ChatPart): part is ChatStepPart {
  return part.type === 'reasoning' || (part.type === 'tool-call' && part.grouping !== 'standalone');
}

/** A part's React key: its type and id, or its type and position when it has no id. */
export function toPartKey(part: ChatPart, index: number): string {
  return part.id === undefined ? `${part.type}@${index}` : `${part.type}:${part.id}`;
}

/** The key a group of steps is rendered and expanded under. */
function toStepsKey(first: ChatStepPart): string {
  return `steps:${first.id}`;
}

/**
 * Whether a run of steps folds into a group: it holds a tool call. A lone call is grouped too, so
 * parts streamed after it never move it under a new parent and remount it.
 */
function isGroupedRun(steps: readonly ChatStepPart[]): boolean {
  return steps.some((step) => step.type === 'tool-call');
}

/**
 * The parts to render in order. A run of consecutive steps becomes one group when it holds a tool
 * call, even a lone one; a run of reasoning alone stays ungrouped.
 */
export function groupChatParts(parts: readonly ChatPart[]): ChatPartsItem[] {
  const items: ChatPartsItem[] = [];
  let start = 0;
  while (start < parts.length) {
    let end = start;
    while (end < parts.length && isStepPart(requireDefined(parts[end]))) end += 1;
    const steps = parts.slice(start, end) as ChatStepPart[];
    const [first] = steps;
    if (first && isGroupedRun(steps)) {
      items.push({ kind: 'steps', key: toStepsKey(first), steps });
    } else {
      steps.forEach((step, offset) => {
        items.push({ kind: 'part', key: toPartKey(step, start + offset), part: step });
      });
    }
    const next = parts[end];
    if (next) items.push({ kind: 'part', key: toPartKey(next, end), part: next });
    start = end + 1;
  }
  return items;
}

/** How many tool calls of each kind the steps made, kinds in the order they first appear. */
export function summarizeSteps(steps: readonly ChatStepPart[]): ChatStepsAction[] {
  const actions: ChatStepsAction[] = [];
  for (const step of steps) {
    if (step.type !== 'tool-call') continue;
    const kind = step.kind ?? 'other';
    const action = actions.find((entry) => entry.kind === kind);
    if (action) action.count += 1;
    else actions.push({ kind, count: 1 });
  }
  return actions;
}

/** A step still at work: reasoning that streams, or a tool call that waits to run or runs. */
export function isStepActive(step: ChatStepPart): boolean {
  if (step.type === 'reasoning') return step.status === 'streaming';
  return step.status === 'pending' || step.status === 'running';
}

/** A tool call that waits for the reader's approval. */
export function isAwaitingApproval(step: ChatStepPart): boolean {
  return (
    step.type === 'tool-call' &&
    step.status === 'approval-requested' &&
    step.approval?.decision === undefined
  );
}
