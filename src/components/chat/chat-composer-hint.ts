'use client';

import { useUiStrings } from '../../core/provider.js';
import {
  type MessageComposerShortcuts,
  useComposerKeys,
} from '../message-composer/message-composer.js';
import { useDetectedPlatform } from '../shortcut/shortcut.js';
import { formatShortcutAccessibleText } from '../shortcut/shortcut-format.js';
import type { ChatComposerOptions } from './chat-composer.js';

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
  options: ChatComposerOptions,
  shortcuts: MessageComposerShortcuts | undefined,
  action: ChatComposerHint['action'],
): ChatComposerHint {
  const strings = useUiStrings();
  const platform = useDetectedPlatform();
  const isPending = Boolean(options.isPending);
  const keys = useComposerKeys(shortcuts, { isPending, isEditing: action === 'save' });
  const format = (chord: (typeof keys.submit)[number] | undefined) =>
    chord === undefined
      ? undefined
      : formatShortcutAccessibleText(chord, { platform, keyName: strings.shortcutKeyName });
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
