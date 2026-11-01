import { isThenable } from '../../utils/is-thenable.js';
import type { RichMessageComposerProps } from '../message-composer/rich/rich-message-composer.js';
import type { ChatComposerProps } from './chat-composer.js';
import { toDisplayTokens } from './chat-model.js';

/** A message as the composer sends it: Markdown text and its tokens. */
type ComposerMessage = Parameters<NonNullable<RichMessageComposerProps['onSubmit']>>[0];

/** Runs `onAccepted` once the host accepts: at once, or when its promise resolves. */
function whenAccepted(result: void | Promise<unknown>, onAccepted: () => void) {
  if (isThenable(result)) return Promise.resolve(result).then(onAccepted);
  onAccepted();
  return undefined;
}

/** Whether two composer messages hold the same text and tokens. */
function isSameMessage(a: ComposerMessage, b: ComposerMessage): boolean {
  return a.text === b.text && JSON.stringify(a.tokens) === JSON.stringify(b.tokens);
}

/**
 * Sends the composer's message as an edit, a queued message's new text, a reply or a new message.
 * An edit or a reply ends once the host accepts it, and only in the conversation and session it was
 * sent from, while the composer still shows the message sent: a rejection keeps the banner for
 * another try, and words the reader added meanwhile, or an edit or reply they started again, stay.
 * `readShown` reads what the composer shows when the host accepts.
 */
export function submitMessage(
  { options, state }: ChatComposerProps,
  message: ComposerMessage,
  readShown: () => ComposerMessage | undefined,
): void | Promise<unknown> {
  const { editing, replyingId, session } = state;
  const { text, tokens: composerTokens } = message;
  const tokens = toDisplayTokens(composerTokens);
  const scope = options.conversationId;
  const isShown = () => {
    const shown = readShown();
    return shown === undefined || isSameMessage(shown, message);
  };
  if (editing?.kind === 'message') {
    const result = options.onEdit?.(editing.id, text, tokens);
    return whenAccepted(result, () => {
      if (isShown()) state.endEdit(scope, session);
    });
  }
  if (editing) {
    const queue = options.queue ?? [];
    options.onQueueChange?.(
      queue.map((entry) => (entry.id === editing.id ? { ...entry, text, tokens } : entry)),
    );
    state.cancelEdit();
    return undefined;
  }
  if (replyingId !== null && options.onReply) {
    const result = options.onReply(replyingId, text, tokens);
    return whenAccepted(result, () => {
      if (isShown()) state.endReply(scope, session);
    });
  }
  return options.onSend?.(text, tokens);
}

/** Sends the composer's message at once while a reply runs, ahead of the queue. */
export function sendMessageNow(
  { options }: ChatComposerProps,
  { text, tokens }: ComposerMessage,
): void | Promise<unknown> {
  return options.onSendNow?.(text, toDisplayTokens(tokens));
}
