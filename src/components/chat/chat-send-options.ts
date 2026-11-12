'use client';

import { useCallback, useMemo } from 'react';
import { usePersistentState, useUiStrings } from '../../core/provider.js';
import { booleanCodec } from '../../utils/json-codec.js';
import { useLatest } from '../../utils/use-latest.js';
import type {
  MessageComposerMenuSection,
  MessageComposerShortcuts,
} from '../message-composer/message-composer.js';

/** The reader's sending options: steering during a reply, and sending with Ctrl+Enter. */
export interface ChatSendOptionsProps {
  /**
   * Offers the reader's sending options in the composer's "+" menu: Steer automatically (with
   * `onSendNow` and `onQueueChange`) and Send with Ctrl+Enter. Off by default; the options apply
   * whether or not they are offered.
   */
  showSendOptions?: boolean | undefined;
  /** Sends a message written during a reply at once through `onSendNow`, instead of queuing it (controlled). */
  steersWhilePending?: boolean | undefined;
  /** Whether the chat steers during a reply at first, while the reader has not chosen (uncontrolled). Defaults to `false`. */
  defaultSteersWhilePending?: boolean | undefined;
  /** Called when the reader turns steering during a reply on or off. */
  onSteersWhilePendingChange?: ((steers: boolean) => void) | undefined;
  /** Sends with Ctrl+Enter (Command+Enter on macOS) only, Enter breaking the line (controlled). */
  sendsWithModifier?: boolean | undefined;
  /** Whether the chat sends with Ctrl+Enter only at first, while the reader has not chosen (uncontrolled). Defaults to `false`. */
  defaultSendsWithModifier?: boolean | undefined;
  /** Called when the reader turns sending with Ctrl+Enter on or off. */
  onSendsWithModifierChange?: ((sendsWithModifier: boolean) => void) | undefined;
}

interface ChatSendOptionsInput extends ChatSendOptionsProps {
  shortcuts?: MessageComposerShortcuts | undefined;
  onSendNow?: unknown;
  onQueueChange?: unknown;
}

interface OptionInput {
  /** Where the reader's choice is stored. */
  key: string;
  value: boolean | undefined;
  defaultValue: boolean | undefined;
  onChange: ((value: boolean) => void) | undefined;
}

/** The reader's choice of one option: the host's when controlled, else the one stored. */
function useOption({
  key,
  value,
  defaultValue,
  onChange,
}: OptionInput): [boolean, (value: boolean) => void] {
  const [own, setOwn] = usePersistentState(key, defaultValue ?? false, { codec: booleanCodec });
  const latest = useLatest({ value, onChange });
  const set = useCallback(
    (next: boolean) => {
      if (latest.current.value === undefined) setOwn(next);
      latest.current.onChange?.(next);
    },
    [latest, setOwn],
  );
  return [value ?? own, set];
}

/** The chord that sends while the reader sends with a modifier, during a reply too. */
const modifierSend = 'Ctrl+Enter';

/**
 * The reader's sending options, each the host's when controlled, else stored through the provider's
 * storage adapter: whether a message written during a reply steers, the composer's chords, and the
 * "+" menu section that offers them while `showSendOptions` holds.
 */
export function useChatSendOptions(input: ChatSendOptionsInput) {
  const strings = useUiStrings();
  const canSteer = Boolean(input.onSendNow && input.onQueueChange);
  const [steers, setSteers] = useOption({
    key: 'chat-steers-while-pending',
    value: input.steersWhilePending,
    defaultValue: input.defaultSteersWhilePending,
    onChange: input.onSteersWhilePendingChange,
  });
  const [withModifier, setWithModifier] = useOption({
    key: 'chat-sends-with-modifier',
    value: input.sendsWithModifier,
    defaultValue: input.defaultSendsWithModifier,
    onChange: input.onSendsWithModifierChange,
  });
  const { shortcuts, showSendOptions } = input;
  const composerShortcuts = useMemo(
    () => (withModifier ? { ...shortcuts, send: modifierSend, queue: modifierSend } : shortcuts),
    [shortcuts, withModifier],
  );
  const menuSections = useMemo((): readonly MessageComposerMenuSection[] => {
    if (!showSendOptions) return [];
    const steerItem = {
      id: 'chat-steer-while-pending',
      label: strings.chatSteerWhilePending,
      description: strings.chatSteerWhilePendingNote,
      isSelected: steers,
      onSelectedChange: setSteers,
    };
    const modifierItem = {
      id: 'chat-send-with-modifier',
      label: strings.chatSendWith,
      shortcut: modifierSend,
      isSelected: withModifier,
      onSelectedChange: setWithModifier,
    };
    const items = canSteer ? [steerItem, modifierItem] : [modifierItem];
    return [{ id: 'chat-send-options', title: strings.chatSendOptions, items }];
  }, [showSendOptions, canSteer, steers, withModifier, setSteers, setWithModifier, strings]);
  return { steers: canSteer && steers, shortcuts: composerShortcuts, menuSections };
}
