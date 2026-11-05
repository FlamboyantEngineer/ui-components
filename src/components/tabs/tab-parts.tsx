'use client';

// The parts inside a tab: its label or name field, its count and its close mark.
import type { MouseEvent, PointerEvent } from 'react';
import { CloseGlyph } from '../../core/glyphs.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { formatCount } from '../../utils/count.js';
import { Badge, type BadgeCountVariant } from '../badge/badge.js';
import { tabsHooks as hooks } from './tab-hooks.js';

interface TabCountProps {
  id: string;
  count: number;
  countMax: number;
  countLabel: string | undefined;
  countVariant: BadgeCountVariant | undefined;
}

/** A tab's shown count, and the hidden description that gives the full count. */
export function TabCount({ id, count, countMax, countLabel, countVariant }: TabCountProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  return (
    <>
      {' '}
      <Badge
        className={hooks.slotClass('count')}
        aria-label={formatCount(count, locale, { max: countMax })}
        count={count}
        max={countMax}
        variant={countVariant}
        size="sm"
      />
      <span id={id} hidden>
        {countLabel ?? strings.itemCount(count)}
      </span>
    </>
  );
}

/**
 * The close mark of a removable tab. It takes pointer presses only, without selecting the tab;
 * keyboard users press Delete on the focused tab, which the tab announces in `aria-keyshortcuts`.
 */
export function TabRemoveMark({ onRemove }: { onRemove: () => void }) {
  const stop = (event: PointerEvent | MouseEvent) => event.stopPropagation();
  return (
    <span
      {...hooks.slot('remove')}
      aria-hidden="true"
      onPointerDown={stop}
      onPointerUp={stop}
      onDoubleClick={stop}
      onMouseDown={(event) => {
        // Closing a tab neither selects nor focuses it.
        event.preventDefault();
        stop(event);
      }}
      onClick={(event) => {
        stop(event);
        onRemove();
      }}
    >
      <Glyph icon={CloseGlyph} />
    </span>
  );
}
