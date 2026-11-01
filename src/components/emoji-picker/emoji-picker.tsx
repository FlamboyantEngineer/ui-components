'use client';

import { useContext, useRef, useState, type ReactNode } from 'react';
import { Dialog, DialogTrigger, OverlayTriggerStateContext } from '../../primitives/index.js';
import { PopoverPanel } from '../popover/popover.js';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useCloseWhenLocked } from '../../utils/use-close-when-locked.js';
import { EmojiPickerBody } from './emoji-picker-body.js';
import { EmojiPickerContext, EmojiPickerDismissContext } from './emoji-picker-context.js';
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
import { emojiPickerHooks as hooks } from './emoji-picker-hooks.js';

export interface EmojiPickerProps
  extends
    AriaLabellingProps,
    SkinToneState,
    EmojiSources,
    EmojiChoiceHandlers,
    EmojiChoiceFilters,
    Pick<EmojiPickerStateOptions, 'loadEmoji' | 'renderEmoji' | 'virtualized'>,
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
  /** The button that opens the picker, such as a `Button`. */
  children: ReactNode;
  /**
   * Opens nothing, and closes an open picker for good: re-enabling leaves it closed. Disable the
   * button too, so it reads as unavailable.
   */
  isDisabled?: boolean | undefined;
}

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
  virtualized,
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
    virtualized,
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
      <EmojiPickerContext value={state}>
        {children ?? <EmojiPickerLayout hideSkinTones={hideSkinTones} />}
      </EmojiPickerContext>
    </Dialog>
  );
}

/** The trigger's picker, which closes the trigger's own popover when the reader chooses. */
function TriggeredEmojiPicker(props: EmojiPickerProps) {
  const overlay = useContext(OverlayTriggerStateContext);
  return (
    <EmojiPickerDismissContext value={overlay ? () => overlay.close() : null}>
      <EmojiPicker autoFocus {...props} />
    </EmojiPickerDismissContext>
  );
}

/** Opens an `EmojiPicker` in a popover from the button it wraps; choosing an emoji closes it. */
export function EmojiPickerTrigger({
  children,
  isDisabled = false,
  ...props
}: EmojiPickerTriggerProps) {
  const [isOpen, setOpen] = useState(false);
  useCloseWhenLocked(isOpen, isDisabled, () => setOpen(false));
  return (
    <DialogTrigger
      isOpen={isOpen && !isDisabled}
      onOpenChange={(next) => {
        if (!next || !isDisabled) setOpen(next);
      }}
    >
      {children}
      <PopoverPanel {...hooks.slot('popover', { layer: 'dropdown' })}>
        <TriggeredEmojiPicker {...props} />
      </PopoverPanel>
    </DialogTrigger>
  );
}
