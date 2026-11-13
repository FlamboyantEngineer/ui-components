'use client';

import { useUiStrings } from '../../core/provider.js';
import { useComposerKeys } from '../message-composer/message-composer.js';
import { useDetectedPlatform } from '../shortcut/shortcut.js';
import { formatShortcutAccessibleText } from '../shortcut/shortcut-format.js';
import type { ChatComposerProps } from './chat-composer.js';
import type { useChatSendOptions } from './chat-send-options.js';

/** The effective submission mode and localized keyboard hint of the shown composer. */
export interface ChatComposerHint {
  action: 'send' | 'queue' | 'steer' | 'save';
  /** The first effective submit chord in localized platform words, absent when there is none. */
  shortcut: string | undefined;
  /** The immediate-send chord, when immediate sending is available. */
  sendNowShortcut: string | undefined;
  /** A localized hint, such as "Enter to queue"; empty when there is no submit chord. */
  text: string;
}

/** Uses the same resolved shortcuts, pointer rules and submission mode as the composer. */
export function useChatComposerHint(
  { options, state }: ChatComposerProps,
  sendOptions: ReturnType<typeof useChatSendOptions>,
): ChatComposerHint {
  const strings = useUiStrings();
  const platform = useDetectedPlatform();
  const isEditing = state.editing !== null;
  const isPending = Boolean(options.isPending);
  const keys = useComposerKeys(sendOptions.shortcuts, { isPending, isEditing });
  const format = (chord: (typeof keys.submit)[number] | undefined) =>
    chord === undefined
      ? undefined
      : formatShortcutAccessibleText(chord, { platform, keyName: strings.shortcutKeyName });
  const action = isEditing
    ? 'save'
    : isPending && sendOptions.steers
      ? 'steer'
      : isPending && options.onQueueChange
        ? 'queue'
        : 'send';
  const isBlocked = options.isDisabled || (isPending && !options.onQueueChange);
  const shortcut = isBlocked ? undefined : format(keys.submit[0]);
  return {
    action,
    shortcut,
    sendNowShortcut:
      options.onSendNow && !options.isDisabled ? format(keys.submitNow[0]) : undefined,
    text: shortcut === undefined ? '' : strings.chatComposerHint(action, shortcut),
  };
}
