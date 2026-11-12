'use client';

import { CloseGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { ChatQuote, type ChatQuoteData } from '../chat-transcript/chat-transcript.js';
import type { ChatComposerProps } from './chat-composer.js';
import { chatHooks as hooks } from './chat-hooks.js';
import { readMessageText, toExcerpt } from './chat-model.js';

/** What the banner above the composer's input says, and how it ends. */
export interface BannerContent {
  label: string;
  quote?: Omit<ChatQuoteData, 'messageId'> | undefined;
  onCancel?: (() => void) | undefined;
}

/** The banner above the input: the message being replied to, or what is being edited. */
export function useBanner(
  props: Pick<ChatComposerProps, 'state' | 'messages' | 'participants'>,
): BannerContent | undefined {
  const strings = useUiStrings();
  const { state, messages, participants } = props;
  if (state.editing) {
    const isQueued = state.editing.kind === 'queued';
    return { label: isQueued ? strings.chatEditingQueued : strings.chatEditingMessage };
  }
  const replied = messages.find((message) => message.id === state.replyingId);
  if (!replied) return undefined;
  const author = participants.get(replied.authorId ?? '');
  return {
    label: strings.chatReplyingTo,
    quote: { authorName: author?.name ?? '', excerpt: toExcerpt(readMessageText(replied)) },
    onCancel: state.cancelReply,
  };
}

export function ComposerBanner({ id, banner }: { id: string; banner: BannerContent }) {
  const strings = useUiStrings();
  return (
    <>
      <div id={id} {...hooks.slot('banner')}>
        <span {...hooks.slot('banner-label')}>{banner.label}</span>
        {banner.quote ? <ChatQuote {...banner.quote} /> : null}
      </div>
      {banner.onCancel ? (
        <Button
          icon={CloseGlyph}
          label={strings.chatCancelReply}
          size="sm"
          className={hooks.slotClass('banner-cancel')}
          onPress={banner.onCancel}
        />
      ) : null}
    </>
  );
}
