'use client';

import { useRef, type ReactNode } from 'react';
import { Dialog, DialogTrigger } from '../../primitives/index.js';
import { PopoverPanel } from '../popover/popover.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { EmojiPickerBody } from './emoji-picker-body.js';
import { EmojiPickerContext } from './emoji-picker-context.js';
import { EmojiPickerPreview, EmojiPickerSearch } from './emoji-picker-parts.js';
import {
  useEmojiPickerState,
  type EmojiChoiceFilters,
  type EmojiChoiceHandlers,
  type EmojiPickerStateOptions,
  type EmojiSources,
  type SkinToneState,
} from './emoji-picker-state.js';
import { EmojiPickerSkinTones } from './skin-tone-picker.js';

export interface EmojiPickerProps
  extends
    AriaLabellingProps,
    SkinToneState,
    EmojiSources,
    EmojiChoiceHandlers,
    EmojiChoiceFilters,
    Pick<EmojiPickerStateOptions, 'loadEmoji' | 'renderEmoji'>,
    BaseProps {
  /** Hide the skin tone choice, for a host that sets the tone elsewhere. */
  hideSkinTones?: boolean | undefined;
  /** Called with the search text as it changes, for a host that fetches custom emoji. */
  onSearchChange?: ((value: string) => void) | undefined;
  /** Focus the search field when the picker mounts. */
  autoFocus?: boolean | undefined;
  /**
   * The picker's parts (`EmojiPickerSearch`, `EmojiPickerBody`, `EmojiPickerPreview`,
   * `EmojiPickerSkinTones`) in a layout of the caller's own, instead of the default one.
   */
  children?: ReactNode;
}

export interface EmojiPickerTriggerProps extends Omit<EmojiPickerProps, 'children'> {
  /** The button that opens the picker, such as a `Button` or `Button`. */
  children: ReactNode;
}

const hooks = createHooks('emoji-picker', ['popover', 'footer']);

/** The search field, the body and a footer with the preview and the skin tones. */
function EmojiPickerLayout({ hideSkinTones }: Pick<EmojiPickerProps, 'hideSkinTones'>) {
  return (
    <>
      <EmojiPickerSearch />
      <EmojiPickerBody />
      <div {...hooks.slot('footer')}>
        <EmojiPickerPreview />
        {hideSkinTones ? null : <EmojiPickerSkinTones />}
      </div>
    </>
  );
}

/**
 * Chooses a standard or custom emoji: search, category tabs, a two-dimensional emoji grid, recently
 * used emoji and a skin tone choice. Data comes in as props and leaves through callbacks.
 */
export function EmojiPicker({
  onSelect,
  skinTone,
  defaultSkinTone,
  onSkinToneChange,
  hideSkinTones,
  recentEmoji,
  onRecentEmojiChange,
  customEmoji,
  onSearchChange,
  autoFocus,
  loadEmoji,
  renderEmoji,
  categories,
  emojiVersion,
  filterEmoji,
  children,
  className,
  ...rest
}: EmojiPickerProps) {
  const strings = useUiStrings();
  const rootRef = useRef<HTMLElement>(null);
  const state = useEmojiPickerState({
    onSelect,
    skinTone,
    defaultSkinTone,
    onSkinToneChange,
    recentEmoji,
    onRecentEmojiChange,
    customEmoji,
    onSearchChange,
    autoFocus,
    loadEmoji,
    renderEmoji,
    categories,
    emojiVersion,
    filterEmoji,
    rootRef,
  });
  return (
    <Dialog
      {...rest}
      ref={rootRef}
      {...hooks.root({ className, data: { loading: !state.data.emoji && !state.data.failed } })}
      aria-label={rest['aria-label'] ?? strings.emojiPicker}
    >
      <EmojiPickerContext.Provider value={state}>
        {children ?? <EmojiPickerLayout hideSkinTones={hideSkinTones} />}
      </EmojiPickerContext.Provider>
    </Dialog>
  );
}

/** Opens an `EmojiPicker` in a popover from the button it wraps; choosing an emoji closes it. */
export function EmojiPickerTrigger({ children, ...props }: EmojiPickerTriggerProps) {
  return (
    <DialogTrigger>
      {children}
      <PopoverPanel {...hooks.slot('popover', { layer: 'dropdown' })}>
        <EmojiPicker autoFocus {...props} />
      </PopoverPanel>
    </DialogTrigger>
  );
}
