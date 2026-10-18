import { useId, type KeyboardEvent, type ReactNode, type Ref } from 'react';
import { GridList, GridListItem, type Key } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import {
  applySkinTone,
  getEmojiKey,
  getEmojiLabel,
  type EmojiEntry,
  type SkinTone,
} from './emoji-catalog.js';

export interface EmojiGridProps extends BaseProps {
  /** The visible label that names the grid. */
  label: string;
  entries: readonly EmojiEntry[];
  skinTone: SkinTone;
  onSelect: (entry: EmojiEntry) => void;
  /** Reports the entry under the pointer or keyboard focus. */
  onActiveChange: (entry: EmojiEntry) => void;
  renderEmoji?: ((unicode: string) => ReactNode) | undefined;
  gridRef?: Ref<HTMLDivElement> | undefined;
}

/** The grid props a picker shares between every grid it draws. */
export type EmojiGridOptions = Omit<EmojiGridProps, 'label' | 'entries' | keyof BaseProps>;

const hooks = createHooks('emoji-picker', ['section', 'label', 'grid', 'cell', 'image']);
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
  className,
  ...rest
}: EmojiGridProps) {
  const labelId = useId();
  const byKey = new Map(entries.map((entry) => [getEmojiKey(entry), entry]));
  const choose = (key: Key) => {
    const entry = byKey.get(String(key));
    if (entry) onSelect(entry);
  };
  return (
    <div
      {...rest}
      {...hooks.slot('section', undefined, className)}
      onFocus={(event) => {
        const entry = byKey.get((event.target as HTMLElement).dataset.key ?? '');
        if (entry) onActiveChange(entry);
      }}
      onKeyDown={stopGridKeys}
    >
      <div {...hooks.slot('label')} id={labelId}>
        {label}
      </div>
      <GridList
        ref={gridRef}
        className={hooks.slotClass('grid')}
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
    </div>
  );
}
