// Folds the consecutive reasoning and tool calls of a message into groups of steps, and reads
// how a group stands (specs/CHAT-PARTS.md, UIC-CHAT-PARTS-5).

import type { ChatPart, ChatReasoningPart, ChatToolCallPart } from './chat-part.js';

/** A part that can be a step of a group: reasoning or a tool call. */
export type ChatStepPart = ChatReasoningPart | ChatToolCallPart;

/** A part shown on its own, keyed for rendering. */
export interface ChatPartItem {
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

export function isStepPart(part: ChatPart): part is ChatStepPart {
  return part.type === 'reasoning' || part.type === 'tool-call';
}

/** A part's React key: its type and id, or its type and position when it has no id. */
export function toPartKey(part: ChatPart, index: number): string {
  return part.id === undefined ? `${part.type}@${index}` : `${part.type}:${part.id}`;
}

/** The key a group of steps is rendered and expanded under. */
export function toStepsKey(first: ChatStepPart): string {
  return `steps:${first.id}`;
}

/**
 * The parts to render in order. A run of consecutive steps becomes one group when it holds two or
 * more steps, or one step that further parts follow; a single step that ends the message stays alone.
 */
export function groupChatParts(parts: readonly ChatPart[]): ChatPartsItem[] {
  const items: ChatPartsItem[] = [];
  let start = 0;
  while (start < parts.length) {
    let end = start;
    while (end < parts.length && isStepPart(parts[end]!)) end += 1;
    const steps = parts.slice(start, end) as ChatStepPart[];
    const [first] = steps;
    if (first && (steps.length > 1 || end < parts.length)) {
      items.push({ kind: 'steps', key: toStepsKey(first), steps });
    } else if (first) {
      items.push({ kind: 'part', key: toPartKey(first, start), part: first });
    }
    const next = parts[end];
    if (next) items.push({ kind: 'part', key: toPartKey(next, end), part: next });
    start = end + 1;
  }
  return items;
}

/** The sum of the steps' durations, or `undefined` when none has one. */
export function sumStepDurations(steps: readonly ChatStepPart[]): number | undefined {
  const durations = steps.flatMap((step) =>
    step.durationMs === undefined ? [] : [step.durationMs],
  );
  return durations.length === 0 ? undefined : durations.reduce((sum, ms) => sum + ms, 0);
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

/** A tool call that failed. */
export function isFailedCall(step: ChatStepPart): boolean {
  return step.type === 'tool-call' && step.status === 'failed';
}
