import { isThenable } from '../../utils/is-thenable.js';
import { isSameMessage } from '../message-composer/composer-message.js';
import type { RichMessageComposerProps } from '../message-composer/rich/rich-message-composer.js';
import type { ChatComposerProps } from './chat-composer.js';
import type { ChatQueuedMessage } from './chat-controller.js';
import { toDisplayTokens } from './chat-model.js';
import type { ChatProgress } from './chat-progress.js';

/** A message as the composer sends it: Markdown text and its tokens. */
type ComposerMessage = Parameters<NonNullable<RichMessageComposerProps['onSubmit']>>[0];

type RegularSubmission =
  | { action: 'save'; editing: NonNullable<ChatComposerProps['state']['editing']> }
  | { action: 'send'; replyTo?: string }
  | { action: 'queue' };

type ChatSubmission = RegularSubmission | { action: 'steer' };

/** What a submission reads when it is sent and when the host accepts it. */
interface SubmitReaders {
  /** What the composer shows now. */
  readShown: () => ComposerMessage | undefined;
  /** The queue a saved edit replaces: without the messages the host is still removing. */
  readQueue: () => readonly ChatQueuedMessage[];
}

/** Runs `onAccepted` once the host accepts: at once, or when its promise resolves. */
function whenAccepted(result: void | Promise<unknown>, onAccepted: () => void) {
  if (isThenable(result)) return Promise.resolve(result).then(onAccepted);
  onAccepted();
  return undefined;
}

/**
 * Sends the composer's message as an edit, a queued message's new text, a reply or a new message.
 * An edit, of a message or a queued one, or a reply ends once the host accepts it, and only in the conversation and session it was
 * sent from, while the composer still shows the message sent: a rejection keeps the banner for
 * another try, and words the reader added meanwhile, or an edit or reply they started again, stay.
 * `readShown` reads what the composer shows when the host accepts.
 */
function submitMessage(
  { options, state }: ChatComposerProps,
  message: ComposerMessage,
  { submission, readShown, readQueue }: SubmitReaders & { submission: RegularSubmission },
): void | Promise<unknown> {
  const { session } = state;
  const { text, tokens: composerTokens } = message;
  const tokens = toDisplayTokens(composerTokens);
  const scope = options.conversationId;
  const isShown = () => {
    const shown = readShown();
    return shown === undefined || isSameMessage(shown, message);
  };
  if (submission.action === 'save') {
    const { editing } = submission;
    const result =
      editing.kind === 'message'
        ? options.onEdit?.(editing.id, text, tokens)
        : options.onQueueChange?.(
            readQueue().map((entry) =>
              entry.id === editing.id ? { ...entry, text, tokens } : entry,
            ),
          );
    return whenAccepted(result, () => {
      if (isShown()) state.endEdit(scope, session);
    });
  }
  if (submission.action === 'send' && submission.replyTo !== undefined) {
    const result = options.onReply?.(submission.replyTo, text, tokens);
    return whenAccepted(result, () => {
      if (isShown()) state.endReply(scope, session);
    });
  }
  return options.onSend?.(text, tokens);
}

/** Sends the composer's message at once while a reply runs, ahead of the queue. */
function sendMessageNow(
  { options, state }: ChatComposerProps,
  message: ComposerMessage,
  readShown: () => ComposerMessage | undefined,
): void | Promise<unknown> {
  const { replyingId, session } = state;
  const result = options.onSendNow?.(
    message.text,
    toDisplayTokens(message.tokens),
    replyingId ?? undefined,
  );
  return whenAccepted(result, () => {
    const shown = readShown();
    if (shown === undefined || isSameMessage(shown, message))
      state.endReply(options.conversationId, session);
  });
}

/** Resolves what the usual submission does so dispatch, the hint and progress agree. */
export function resolveChatSubmission(
  {
    options: { isPending, onReply, onQueueChange },
    state: { editing, replyingId },
  }: ChatComposerProps,
  steers: boolean,
): ChatSubmission {
  if (editing) return { action: 'save', editing };
  if (isPending && steers) return { action: 'steer' };
  if (replyingId !== null && onReply) return { action: 'send', replyTo: replyingId };
  return isPending && onQueueChange ? { action: 'queue' } : { action: 'send' };
}

interface SendContext extends SubmitReaders {
  submission: ChatSubmission;
  track: ChatProgress['track'];
}

/** Sends what the composer holds and reports the same action while the host accepts it. */
export function sendFromComposer(
  props: ChatComposerProps,
  message: ComposerMessage,
  { submission, track, ...readers }: SendContext,
): void | Promise<unknown> {
  const result =
    submission.action === 'steer'
      ? sendMessageNow(props, message, readers.readShown)
      : submitMessage(props, message, { ...readers, submission });
  return track(submission.action, result);
}
