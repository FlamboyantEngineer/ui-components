'use client';

import { readOwn } from '../../utils/read-own.js';
import type { ReactNode } from 'react';
import type { BaseProps, RefProps } from '../../core/props.js';
import { ChatSteps } from '../chat-activity/chat-activity.js';
import type { RecordLabelResolver } from '../record-label/record-label.js';
import type {
  ChatQuestionAnswer,
  ChatQuestionAnsweredMark,
} from '../chat-question/chat-question.js';
import type {
  ChatCodePart,
  ChatCustomPart,
  ChatPart,
  ChatTextFormat,
  ChatToolCallPart,
} from './chat-part.js';
import { ChatPartView, type PartContext } from './chat-part-view.js';
import {
  groupChatParts,
  isAwaitingApproval,
  isStepActive,
  summarizeSteps,
  toPartKey,
  type ChatPartsItem,
  type ChatStepPart,
  type ChatStepsItem,
} from './chat-parts-grouping.js';
import { chatPartsHooks as hooks } from './chat-parts-hooks.js';
import { usePartsRenderNode } from './chat-text-part.js';
import { usePartsExpansion, usePartsReveal, type PartsReveal } from './use-parts-expansion.js';

export type {
  ChatCodePart,
  ChatCustomPart,
  ChatDiffPart,
  ChatFilesPart,
  ChatPart,
  ChatPartType,
  ChatPlanPart,
  ChatQuestionPart,
  ChatReasoningPart,
  ChatSourcesPart,
  ChatTextFormat,
  ChatTextPart,
  ChatTextToken,
  ChatToolCallPart,
} from './chat-part.js';
export type { ChatMessageData, ChatParticipant, ChatParticipantKind } from './chat-conversation.js';

/** A tool call's approval callbacks, bound to the call; each is absent when the host gave none. */
export interface ChatToolCallHandlers {
  onApprove?: (() => void) | undefined;
  onDeny?: ((reason?: string) => void) | undefined;
  onAlwaysAllow?: (() => void) | undefined;
}

/** Draws the calls of one tool in place of the default card's body, or of the whole card. */
export interface ChatToolRenderer {
  /** Draws the call, with its approval callbacks. */
  render: (call: ChatToolCallPart, handlers: ChatToolCallHandlers) => ReactNode;
  /** What the drawing replaces: the card's `body` (the default), or the whole `card`. */
  replaces?: 'body' | 'card' | undefined;
}

export interface ChatPartsProps extends RefProps<HTMLDivElement>, BaseProps {
  /** The message's parts, in the order they were written. */
  parts: readonly ChatPart[];
  /** Prefixes the DOM ids of tool calls and questions, so equal part ids in two messages differ. */
  messageId?: string | undefined;
  /** The message still streams in: a group of steps at its end runs. Defaults to `false`. */
  isStreaming?: boolean | undefined;
  /** How text parts without their own `format` render. Defaults to `markdown`. */
  textFormat?: ChatTextFormat | undefined;
  /** Reasoning and groups of steps open on their own while they run; without it they stay closed. Defaults to `true`. */
  expandsActivity?: boolean | undefined;
  /** Renderers by tool name, which replace the body or the whole card of that tool's calls. */
  toolRenderers?: Readonly<Record<string, ChatToolRenderer>> | undefined;
  /** Approves a tool call; shows Approve while an approval waits. */
  onApprove?: ((callId: string) => void) | undefined;
  /** Denies a tool call, with the reader's reason when they gave one; shows Deny. */
  onDeny?: ((callId: string, reason?: string) => void) | undefined;
  /** Always allows a tool call's tool; shows Always allow. */
  onAlwaysAllow?: ((callId: string) => void) | undefined;
  /** Receives the reader's answers to a question part; a promise is awaited. Without it, read-only. */
  onAnswerQuestion?:
    ((questionId: string, answers: ChatQuestionAnswer[]) => void | Promise<unknown>) | undefined;
  /** Dismisses a question part; shows Dismiss. A returned promise is awaited. */
  onDismissQuestion?: ((questionId: string) => void | Promise<unknown>) | undefined;
  /** How a question part's tabs mark an answered question: `icon` (the default) or `style`. */
  questionAnsweredMark?: ChatQuestionAnsweredMark | undefined;
  /** Retries a failed attachment upload; shows Retry. */
  onRetryAttachment?: ((id: string) => void) | undefined;
  /** Shows Apply on code: a code part, or a fenced block in text (passed as a code part). */
  onApplyCode?: ((code: string, part: ChatCodePart) => void) | undefined;
  /** Draws a custom part; without it custom parts render nothing. */
  renderPart?: ((part: ChatCustomPart) => ReactNode) | undefined;
  /** Looks up how a record reference token's chip shows its record: name, icon, link, preview or unavailability. */
  getReference?: RecordLabelResolver | undefined;
  /** The reader's open and closed choices by part id or group key (controlled). */
  expandedParts?: Readonly<Record<string, boolean>> | undefined;
  /** Receives the choices each time the reader opens or closes a part or group. */
  onExpandedPartsChange?: ((expandedParts: Record<string, boolean>) => void) | undefined;
}

/**
 * What a tool call calls for the reader with, shown in its group (`groupKeys`): a wait for approval.
 * A failure does not: it shows as a quiet row whose error waits in its closed body.
 */
function toReveals(part: ChatPart, groupKeys: readonly string[]): PartsReveal[] {
  if (part.type !== 'tool-call' || !isAwaitingApproval(part)) return [];
  return [{ id: `approval:${part.id}`, keys: groupKeys }];
}

/** What the message's tool calls, each in a group of steps, call for the reader with. */
function listReveals(items: readonly ChatPartsItem[]): PartsReveal[] {
  return items.flatMap((item) =>
    item.kind === 'steps' ? item.steps.flatMap((step) => toReveals(step, [item.key])) : [],
  );
}

/** The heading of the group's latest step when it is reasoning that streams. */
function findStepsTitle(steps: readonly ChatStepPart[]): string | undefined {
  const last = steps.at(-1);
  return last?.type === 'reasoning' && last.status === 'streaming' ? last.title : undefined;
}

interface StepsViewProps {
  item: ChatStepsItem;
  isRunning: boolean;
  context: PartContext;
}

/**
 * A group of steps: open while it runs or a tool call in it waits for approval, unless the reader
 * chose otherwise, and collapsed afterwards.
 */
function StepsView({ item, isRunning, context }: StepsViewProps) {
  const { expansion } = context;
  const isCallingReader = item.steps.some(isAwaitingApproval);
  return (
    <ChatSteps
      isRunning={isRunning}
      title={findStepsTitle(item.steps)}
      actions={summarizeSteps(item.steps)}
      isExpanded={readOwn(expansion.expanded, item.key) ?? (isCallingReader || undefined)}
      onExpandedChange={(isExpanded) => expansion.setExpanded(item.key, isExpanded)}
      expandsAutomatically={context.expandsActivity}
    >
      {item.steps.map((step, index) => (
        <ChatPartView key={toPartKey(step, index)} part={step} context={context} />
      ))}
    </ChatSteps>
  );
}

/**
 * A part's DOM id within its message: the message id, percent-encoded with its hyphens too so it
 * holds none, then a hyphen and the part id. The first hyphen ends the message id, so two
 * messages' ids never meet in one DOM id (`m-1` and `p` against `m` and `1-p`).
 */
export function toPartDomId(messageId: string, partId: string): string {
  return `${encodeURIComponent(messageId).replace(/-/g, '%2D')}-${partId}`;
}

/**
 * The parts of one message, each drawn by the component for its type: text as Markdown (or plain
 * text) with code blocks, citations and token pills, reasoning, tool calls with their approvals and
 * renderers, questions, plans, sources, attachments, code, diffs and custom parts. Consecutive
 * reasoning and tool calls fold into a group of steps that runs while the message streams, even a
 * lone tool call, so parts streamed after a call never remount it; both
 * open on their own while they run, unless `expandsActivity` is false.
 */
export function ChatParts({
  ref,
  parts,
  messageId,
  isStreaming = false,
  textFormat = 'markdown',
  expandedParts,
  onExpandedPartsChange,
  className,
  id,
  ...rest
}: ChatPartsProps) {
  const renderNode = usePartsRenderNode(parts, rest.onApplyCode);
  const expansion = usePartsExpansion({ expandedParts, onExpandedPartsChange });
  const items = groupChatParts(parts);
  usePartsReveal(listReveals(items), expansion);
  const context: PartContext = {
    ...rest,
    textFormat,
    renderNode,
    toDomId: (partId) => (messageId === undefined ? partId : toPartDomId(messageId, partId)),
    expansion,
  };
  return (
    <div ref={ref} {...hooks.root({ className, props: rest })} id={id}>
      {items.map((item, index) =>
        item.kind === 'steps' ? (
          <StepsView
            key={item.key}
            item={item}
            isRunning={isStreaming && (index === items.length - 1 || item.steps.some(isStepActive))}
            context={context}
          />
        ) : (
          <ChatPartView key={item.key} part={item.part} context={context} />
        ),
      )}
    </div>
  );
}
