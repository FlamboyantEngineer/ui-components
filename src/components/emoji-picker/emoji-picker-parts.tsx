'use client';

import { CloseGlyph } from '../../core/glyphs.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import {
  Button as AriaButton,
  Input,
  type KeyboardEvent as AriaKeyboardEvent,
  SearchField,
} from '../../primitives/index.js';
import { isComposingKey, leaveComposingEnter } from '../../utils/is-composing-key.js';
import { useStoreValue } from '../../utils/use-store-value.js';
import { getEmojiLabel } from './emoji-catalog.js';
import { EmojiContent } from './emoji-grid.js';
import { useEmojiPickerContext } from './emoji-picker-context.js';
import { emojiPickerHooks as hooks } from './emoji-picker-hooks.js';

/** The search field part: caller attributes and class go on the field. */
export type EmojiPickerSearchProps = RefProps<HTMLDivElement> & BaseProps;

/** The preview part: caller attributes and class go on the preview. */
export type EmojiPickerPreviewProps = RefProps<HTMLDivElement> & BaseProps;

// Down moves from the search field to the grid's first emoji, even from a field laid out after the
// grid or a virtualized grid scrolled past it. The field's keys stay inside the picker, except
// Escape, which React Aria still stops while it clears a non-empty field. A composing key is the
// input method's: it moves nothing and goes on to it.
function moveToGrid(event: AriaKeyboardEvent, enterGrid: () => void) {
  if (event.key === 'Escape' || isComposingKey(event.nativeEvent)) {
    event.continuePropagation();
    return;
  }
  if (event.key !== 'ArrowDown') return;
  event.preventDefault();
  enterGrid();
}

/** The picker's search field: Down moves to the first emoji and Enter chooses it. */
export function EmojiPickerSearch({ className, ...rest }: EmojiPickerSearchProps) {
  const strings = useUiStrings();
  const { search, chooseFirst, autoFocus, enterGrid } = useEmojiPickerContext();
  return (
    <SearchField
      {...rest}
      {...hooks.slot('search', undefined, className)}
      aria-label={strings.searchEmoji}
      value={search.query}
      autoFocus={autoFocus}
      onChange={search.setQuery}
      onSubmit={chooseFirst}
      onKeyDown={(event) => moveToGrid(event, enterGrid)}
    >
      <Input
        className={hooks.slotClass('search-input')}
        placeholder={strings.searchEmoji}
        onKeyDownCapture={leaveComposingEnter}
      />
      <AriaButton className={hooks.slotClass('search-clear')}>
        <Glyph icon={CloseGlyph} />
      </AriaButton>
    </SearchField>
  );
}

/** The decorative preview of the emoji last hovered or focused, with its label. */
export function EmojiPickerPreview({ className, ...rest }: EmojiPickerPreviewProps) {
  const { activeEmoji, grid } = useEmojiPickerContext();
  const active = useStoreValue(activeEmoji);
  return (
    <div {...rest} {...hooks.slot('preview', undefined, className)} aria-hidden="true">
      {active ? (
        <>
          <span {...hooks.slot('preview-emoji')}>
            <EmojiContent entry={active} skinTone={grid.skinTone} renderEmoji={grid.renderEmoji} />
          </span>
          <span {...hooks.slot('preview-label')}>{getEmojiLabel(active)}</span>
        </>
      ) : null}
    </div>
  );
}
