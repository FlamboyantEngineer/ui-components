// Pure operations on a reply's parts: adding, updating and settling them.

import type { ChatAttachmentData } from '../chat-attachment/chat-attachment.js';
import type { ChatMessageData, ChatPart } from '../chat-parts/chat-parts.js';
import type { ChatSource } from '../chat-sources/chat-sources.js';

/** What the reducer reads besides the event: the reader's settings and the clock. */
export interface ChatStreamContext {
  /** The tools the reader always allows: their approval requests are approved without asking. */
  alwaysAllowed?: readonly string[] | undefined;
  /** How long the reasoning part or tool call `id` has run, in milliseconds, for those the stream does not time. */
  getElapsed?: ((id: string) => number | undefined) | undefined;
}

/** How a reply ended: complete, stopped by the reader, or failed. */
export type ChatReplyOutcome =
  { status: 'complete' } | { status: 'cancelled' } | { status: 'error'; error: string };

type PartOf<T extends ChatPart['type']> = Extract<ChatPart, { type: T }>;

/**
 * Completes the streaming text and reasoning parts, except those `keep` matches, so a new part
 * starts after them. Unchanged parts keep their identity.
 */
export function closeOpenParts(
  parts: readonly ChatPart[],
  context: ChatStreamContext,
  keep?: (part: ChatPart) => boolean,
): readonly ChatPart[] {
  return parts.map((part) => {
    if (part.type !== 'text' && part.type !== 'reasoning') return part;
    if (part.status !== 'streaming' || keep?.(part)) return part;
    if (part.type === 'text') return { ...part, status: 'complete' };
    return {
      ...part,
      status: 'complete',
      durationMs: part.durationMs ?? context.getElapsed?.(part.id),
    };
  });
}

/** Applies `update` to the part of `type` with `id`; other parts keep their identity. */
export function updatePart<T extends ChatPart['type']>(
  parts: readonly ChatPart[],
  target: { type: T; id: string },
  update: (part: PartOf<T>) => PartOf<T>,
): readonly ChatPart[] {
  return parts.map((part) =>
    part.type === target.type && part.id === target.id ? update(part as PartOf<T>) : part,
  );
}

/**
 * Closes the open parts and adds `part` at the end, or, when a part of its type has its `id`,
 * merges it into that part in place, keeping that part's status and leaving the open parts open.
 */
export function addPart(
  parts: readonly ChatPart[],
  part: ChatPart,
  context: ChatStreamContext,
): readonly ChatPart[] {
  const index =
    part.id === undefined
      ? -1
      : parts.findIndex((entry) => entry.type === part.type && entry.id === part.id);
  const existing = parts[index];
  if (!existing) return [...closeOpenParts(parts, context), part];
  const merged = { ...existing, ...part } as ChatPart;
  if ('status' in existing) Object.assign(merged, { status: existing.status });
  return parts.map((entry, position) => (position === index ? merged : entry));
}

/** Replaces the item with the new one's `id`, or adds it at the end. */
function upsertById<T extends { id: string }>(items: readonly T[], item: T): readonly T[] {
  return items.some((entry) => entry.id === item.id)
    ? items.map((entry) => (entry.id === item.id ? item : entry))
    : [...items, item];
}

/** Adds a source to the reply's sources part, which starts where the first source arrives. */
export function appendSource(parts: readonly ChatPart[], source: ChatSource): readonly ChatPart[] {
  if (!parts.some((part) => part.type === 'sources')) {
    return [...parts, { type: 'sources', sources: [source] }];
  }
  return parts.map((part) =>
    part.type === 'sources' ? { ...part, sources: upsertById(part.sources, source) } : part,
  );
}

/** Adds a file to the files part just before it, or starts a files part. */
export function appendFile(
  parts: readonly ChatPart[],
  attachment: ChatAttachmentData,
): readonly ChatPart[] {
  const last = parts.at(-1);
  if (last?.type !== 'files') return [...parts, { type: 'files', attachments: [attachment] }];
  return [
    ...parts.slice(0, -1),
    { ...last, attachments: upsertById(last.attachments, attachment) },
  ];
}

/** The part once its reply ended: nothing streams or runs any more. */
function settlePart(part: ChatPart, outcome: ChatReplyOutcome): ChatPart {
  const isCut = outcome.status !== 'complete';
  if (part.type === 'tool-call') {
    const isWaiting = part.status === 'approval-requested' && part.approval?.decision === undefined;
    const isUnfinished = part.status === 'pending' || part.status === 'running';
    return isUnfinished || (isCut && isWaiting) ? { ...part, status: 'cancelled' } : part;
  }
  if (part.type === 'question' && isCut && part.status === 'pending') {
    return { ...part, status: 'dismissed' };
  }
  return part;
}

/**
 * The reply once it ended: streaming parts complete, unfinished tool calls cancelled, its status
 * line cleared. A complete reply keeps the approvals and questions that wait for the reader; a
 * stopped or failed one cancels them.
 */
export function endChatReply(
  message: ChatMessageData,
  outcome: ChatReplyOutcome,
  context: ChatStreamContext,
): ChatMessageData {
  const { statusText: _statusText, error: _error, ...rest } = message;
  const parts = closeOpenParts(message.parts, context).map((part) => settlePart(part, outcome));
  return outcome.status === 'error'
    ? { ...rest, parts, status: 'error', error: outcome.error }
    : { ...rest, parts, status: outcome.status };
}
