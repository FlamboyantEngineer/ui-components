import type { RefObject } from 'react';
import {
  Button as AriaButton,
  Input,
  SearchField,
  type KeyboardEvent as AriaKeyboardEvent,
} from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { getEmojiLabel } from './emoji-catalog.js';
import { useEmojiPickerContext } from './emoji-picker-context.js';
import { EmojiContent } from './emoji-grid.js';

/** The search field part: caller attributes and class go on the field. */
export type EmojiPickerSearchProps = BaseProps;

/** The preview part: caller attributes and class go on the preview. */
export type EmojiPickerPreviewProps = BaseProps;

const hooks = createHooks('emoji-picker', [
  'search',
  'search-input',
  'search-clear',
  'preview',
  'preview-emoji',
  'preview-label',
]);

// Down moves from the search field to the grid's first emoji, even from a field laid out after the
// grid, where focusing the grid itself would pick its last. The field's keys stay inside the picker,
// except Escape, which React Aria still stops while it clears a non-empty field.
function moveToGrid(event: AriaKeyboardEvent, gridRef: RefObject<HTMLDivElement | null>) {
  if (event.key === 'Escape') event.continuePropagation();
  if (event.key !== 'ArrowDown') return;
  event.preventDefault();
  gridRef.current?.querySelector<HTMLElement>('[role="row"]')?.focus();
}

/** The picker's search field: Down moves to the first emoji and Enter chooses it. */
export function EmojiPickerSearch({ className, ...rest }: EmojiPickerSearchProps) {
  const strings = useUiStrings();
  const { search, chooseFirst, autoFocus, gridRef } = useEmojiPickerContext();
  return (
    <SearchField
      {...rest}
      {...hooks.slot('search', undefined, className)}
      aria-label={strings.searchEmoji}
      value={search.query}
      autoFocus={autoFocus}
      onChange={search.setQuery}
      onSubmit={chooseFirst}
      onKeyDown={(event) => moveToGrid(event, gridRef)}
    >
      <Input className={hooks.slotClass('search-input')} placeholder={strings.searchEmoji} />
      <AriaButton className={hooks.slotClass('search-clear')}>
        <Glyph name="close" />
      </AriaButton>
    </SearchField>
  );
}

/** The decorative preview of the emoji last hovered or focused, with its label. */
export function EmojiPickerPreview({ className, ...rest }: EmojiPickerPreviewProps) {
  const { active, grid } = useEmojiPickerContext();
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
