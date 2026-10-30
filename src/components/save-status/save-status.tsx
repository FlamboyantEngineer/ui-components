'use client';

import { CheckGlyph, ErrorGlyph, OfflineGlyph, type GlyphComponent } from '../../core/glyphs.js';
import { useRef } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { useDelayedFlag } from '../../utils/use-delayed-flag.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';

/**
 * Where an editor's changes stand: `idle` shows nothing, `dirty` has unsaved changes, `saving` is
 * writing them, `saved` has written them, `error` failed and `offline` cannot reach the store.
 */
export type SaveStatusPhase = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'offline';

/** The phases that show a label. */
export type SaveStatusLabelPhase = Exclude<SaveStatusPhase, 'idle'>;

export interface SaveStatusProps extends BaseProps {
  /** Where the changes stand. */
  phase: SaveStatusPhase;
  /** Replaces the provider's label of any phase, such as the reason a save failed. */
  labels?: Partial<Record<SaveStatusLabelPhase, string>> | undefined;
  /** Draws a Retry button in the `error` phase that calls this. */
  onRetry?: (() => void) | undefined;
  /** Milliseconds after which the `saved` label fades out. Without it the label stays. */
  hideSavedAfter?: number | undefined;
}

const hooks = createHooks('save-status', ['message', 'icon', 'label', 'retry']);

const phaseGlyphs: Partial<Record<SaveStatusPhase, GlyphComponent>> = {
  saved: CheckGlyph,
  error: ErrorGlyph,
  offline: OfflineGlyph,
};

/**
 * An editor's save status: a label and glyph for the phase in a polite live region, so each change
 * is announced without moving focus, and a Retry button after a failed save.
 */
export function SaveStatus({
  phase,
  labels,
  onRetry,
  hideSavedAfter,
  className,
  ...rest
}: SaveStatusProps) {
  const strings = useUiStrings();
  const ref = useRef<HTMLSpanElement>(null);
  const isHidden = useDelayedFlag(phase === 'saved', hideSavedAfter);
  const { isMounted, isEntering, isExiting } = useEnterExit(ref, phase !== 'idle' && !isHidden);
  const glyph = phaseGlyphs[phase];
  const showLabel = isMounted && phase !== 'idle';
  return (
    <span
      {...rest}
      {...hooks.root({
        className,
        data: { phase, entering: isEntering, exiting: isExiting },
      })}
      ref={ref}
    >
      <span {...hooks.slot('message')} role="status">
        {showLabel ? (
          <>
            {glyph ? <Icon icon={glyph} className={hooks.slotClass('icon')} /> : null}
            <TruncationTooltip className={hooks.slotClass('label')}>
              {labels?.[phase] ?? strings.saveStatus(phase)}
            </TruncationTooltip>
          </>
        ) : null}
      </span>
      {phase === 'error' && onRetry ? (
        <Button size="xs" variant="link" className={hooks.slotClass('retry')} onPress={onRetry}>
          {strings.retry}
        </Button>
      ) : null}
    </span>
  );
}
