import type { RichMessageComposerProps } from '../message-composer/rich/rich-message-composer.js';
import type { ChatComposerProps } from './chat-composer.js';
/** A message as the composer sends it: Markdown text and its tokens. */
type ComposerMessage = Parameters<NonNullable<RichMessageComposerProps['onSubmit']>>[0];
/**
 * Sends the composer's message as an edit, a queued message's new text, a reply or a new message.
 * An edit or a reply ends once the host accepts it, and only in the conversation it was sent from,
 * so a rejection keeps the banner for another try.
 */
export declare function submitMessage({ options, state }: ChatComposerProps, message: ComposerMessage): void | Promise<unknown>;
export {};
//# sourceMappingURL=chat-submit.d.ts.map