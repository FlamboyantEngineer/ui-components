// The parts inside a tab: its label or name field, its count and its close mark.

import type { MouseEvent, PointerEvent } from 'react';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { tabsHooks as hooks } from './tab-hooks.js';

export interface TabCountProps {
  id: string;
  count: number;
  countMax: number;
  countLabel: string | undefined;
}

/** A count worth showing: a positive whole number, or `null`. */
export function normalizeCount(count: number | null | undefined): number | null {
  if (typeof count !== 'number' || !Number.isFinite(count)) return null;
  const whole = Math.floor(count);
  return whole > 0 ? whole : null;
}

/** A tab's shown count, and the hidden description that gives the full count. */
export function TabCount({ id, count, countMax, countLabel }: TabCountProps) {
  const strings = useUiStrings();
  return (
    <>
      {' '}
      <span {...hooks.slot('count')}>{count > countMax ? `${countMax}+` : count}</span>
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
      <Glyph name="close" />
    </span>
  );
}

/** Joins element ids for an ARIA reference list. */
export function joinIds(...ids: Array<string | undefined>): string {
  return ids.filter(Boolean).join(' ');
}
