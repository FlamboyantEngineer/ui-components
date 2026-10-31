'use client';

import { useId, useMemo, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import {
  GridLayout,
  GridList,
  GridListItem,
  Size,
  Virtualizer,
  type Key,
} from '../../primitives/index.js';
import type { BaseProps } from '../../core/props.js';
import {
  applySkinTone,
  getEmojiKey,
  getEmojiLabel,
  type EmojiEntry,
  type SkinTone,
} from './emoji-catalog.js';
import { emojiPickerHooks as hooks } from './emoji-picker-hooks.js';

interface EmojiGridProps extends BaseProps {
  /** The visible label that names the grid. */
  label: string;
  entries: readonly EmojiEntry[];
  skinTone: SkinTone;
  onSelect: (entry: EmojiEntry) => void;
  /** Reports the entry under the pointer or keyboard focus. */
  onActiveChange: (entry: EmojiEntry) => void;
  renderEmoji?: ((unicode: string) => ReactNode) | undefined;
  gridRef?: Ref<HTMLDivElement> | undefined;
  /** Renders only the cells in view of the grid, which scrolls itself. */
  virtualized?: boolean | undefined;
}

/** The grid props a picker shares between every grid it draws. */
export type EmojiGridOptions = Omit<EmojiGridProps, 'label' | 'entries' | keyof BaseProps>;

// Grid keys stay inside the picker, even at the grid's edges where React Aria lets them bubble,
// so they never reach shortcuts of the surface that owns it.
const gridKeys = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Enter',
  ' ',
]);

// Eight square cells a row with 2-pixel gaps, as the reference sheet draws the plain grid.
const virtualLayout = {
  minItemSize: new Size(28, 28),
  maxColumns: 8,
  minSpace: new Size(2, 2),
  preserveAspectRatio: true,
};

function stopGridKeys(event: KeyboardEvent) {
  if (gridKeys.has(event.key)) event.stopPropagation();
}

export function EmojiContent({
  entry,
  skinTone,
  renderEmoji,
}: Pick<EmojiGridProps, 'skinTone' | 'renderEmoji'> & { entry: EmojiEntry }) {
  if (entry.kind === 'custom') {
    return (
      <img {...hooks.slot('image')} src={entry.emoji.src} alt="" loading="lazy" draggable={false} />
    );
  }
  const unicode = applySkinTone(entry.emoji, skinTone);
  return renderEmoji ? renderEmoji(unicode) : unicode;
}

/** One labelled grid of emoji; arrow keys move through it in two dimensions. */
export function EmojiGrid({
  label,
  entries,
  skinTone,
  onSelect,
  onActiveChange,
  renderEmoji,
  gridRef,
  virtualized = false,
  className,
  ...rest
}: EmojiGridProps) {
  const labelId = useId();
  const byKey = useMemo(
    () => new Map(entries.map((entry) => [getEmojiKey(entry), entry])),
    [entries],
  );
  const choose = (key: Key) => {
    const entry = byKey.get(String(key));
    if (entry) onSelect(entry);
  };
  const grid = (
    <GridList
      ref={gridRef}
      {...hooks.slot('grid', { virtualized })}
      aria-labelledby={labelId}
      layout="grid"
      onAction={choose}
    >
      {entries.map((entry) => (
        <GridListItem
          key={getEmojiKey(entry)}
          id={getEmojiKey(entry)}
          className={hooks.slotClass('cell')}
          textValue={getEmojiLabel(entry)}
          onHoverStart={() => onActiveChange(entry)}
        >
          <EmojiContent entry={entry} skinTone={skinTone} renderEmoji={renderEmoji} />
        </GridListItem>
      ))}
    </GridList>
  );
  return (
    <div
      {...rest}
      {...hooks.slot('section', { virtualized }, className)}
      onFocus={(event) => {
        const entry = byKey.get((event.target as HTMLElement).dataset.key ?? '');
        if (entry) onActiveChange(entry);
      }}
      onKeyDown={stopGridKeys}
    >
      <div {...hooks.slot('label')} id={labelId}>
        {label}
      </div>
      {virtualized ? (
        <Virtualizer layout={GridLayout} layoutOptions={virtualLayout}>
          {grid}
        </Virtualizer>
      ) : (
        grid
      )}
    </div>
  );
}
