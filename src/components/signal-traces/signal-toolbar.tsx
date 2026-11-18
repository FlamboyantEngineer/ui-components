'use client';

import { MinusGlyph, PlusGlyph, RestoreGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { getMinimumSpan, type SignalTimeRange, zoomRange } from './signal-model.js';
import { signalTracesHooks as hooks } from './signal-traces-hooks.js';

interface SignalToolbarProps {
  domain: SignalTimeRange;
  range: SignalTimeRange;
  setRange: (range: SignalTimeRange) => void;
  /** The visible range as text, which also describes the plot. */
  rangeText: string;
  rangeId: string;
}

/** How much the zoom buttons narrow or widen the range, around its middle. */
const zoomStep = 2;

/**
 * Zoom in, zoom out and reset buttons and the visible range. Zoom in is disabled at the narrowest
 * span, and zoom out and reset while the whole data window shows.
 */
export function SignalToolbar({ domain, range, setRange, rangeText, rangeId }: SignalToolbarProps) {
  const strings = useUiStrings();
  const anchor = (range[0] + range[1]) / 2;
  const isWhole = range[0] === domain[0] && range[1] === domain[1];
  // A zoom that rounds to the narrowest span still counts as reaching it.
  const isNarrowest = range[1] - range[0] <= getMinimumSpan(domain) * (1 + 1e-9);
  const zoom = (factor: number) => setRange(zoomRange(range, domain, { factor, anchor }));
  return (
    <div {...hooks.slot('toolbar')}>
      <Button
        className={hooks.slotClass('zoom-in')}
        icon={PlusGlyph}
        label={strings.zoomIn}
        size="sm"
        isDisabled={isNarrowest}
        onPress={() => zoom(1 / zoomStep)}
      />
      <Button
        className={hooks.slotClass('zoom-out')}
        icon={MinusGlyph}
        label={strings.zoomOut}
        size="sm"
        isDisabled={isWhole}
        onPress={() => zoom(zoomStep)}
      />
      <Button
        className={hooks.slotClass('reset')}
        icon={RestoreGlyph}
        label={strings.resetZoom}
        size="sm"
        isDisabled={isWhole}
        onPress={() => setRange(domain)}
      />
      <span {...hooks.slot('range')} id={rangeId}>
        {rangeText}
      </span>
    </div>
  );
}
