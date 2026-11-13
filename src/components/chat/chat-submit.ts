import { isThenable } from '../../utils/is-thenable.js';
import type { ChatQueuedMessage } from '../chat-controller/chat-controller.js';
import { isSameMessage } from '../message-composer/composer-message.js';
import type { RichMessageComposerProps } from '../message-composer/rich/rich-message-composer.js';
import type { ChatComposerProps } from './chat-composer.js';
import { toDisplayTokens } from './chat-model.js';
import type { ChatProgress, ChatProgressAction } from './chat-progress.js';

/** A message as the composer sends it: Markdown text and its tokens. */
type ComposerMessage = Parameters<NonNullable<RichMessageComposerProps['onSubmit']>>[0];

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
export function submitMessage(
  { options, state }: ChatComposerProps,
  message: ComposerMessage,
  { readShown, readQueue }: SubmitReaders,
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
    const result = options.onQueueChange?.(
      readQueue().map((entry) => (entry.id === editing.id ? { ...entry, text, tokens } : entry)),
    );
    return whenAccepted(result, () => {
      if (isShown()) state.endEdit(scope, session);
    });
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

/**
 * Whether sending the composer's message steers: a new message (not an edit or a reply) written
 * during a reply while the reader steers automatically.
 */
function steersNow({ options, state }: ChatComposerProps, steers: boolean) {
  return steers && Boolean(options.isPending) && !state.editing && state.replyingId === null;
}

/**
 * What sending the composer's message does: save an edit, send a reply (which goes to `onReply`
 * at once, during a running response too), queue it while a reply runs, or send it.
 */
function toSubmitAction({ options, state }: ChatComposerProps): ChatProgressAction {
  if (state.editing) return 'save';
  if (state.replyingId !== null && options.onReply) return 'send';
  return options.isPending && options.onQueueChange ? 'queue' : 'send';
}

interface SendContext extends SubmitReaders {
  /** The reader steers during a reply instead of queuing. */
  steers: boolean;
  track: ChatProgress['track'];
}

/**
 * Sends what the composer holds: at once ahead of the queue when the reader steers during a reply,
 * else as `submitMessage` does, showing the host's answer under way while it takes time.
 */
export function sendFromComposer(
  props: ChatComposerProps,
  message: ComposerMessage,
  { steers, track, ...readers }: SendContext,
): void | Promise<unknown> {
  if (steersNow(props, steers)) return track('steer', sendMessageNow(props, message));
  return track(toSubmitAction(props), submitMessage(props, message, readers));
}
