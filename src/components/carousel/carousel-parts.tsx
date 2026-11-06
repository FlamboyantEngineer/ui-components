'use client';

import type { ReactNode } from 'react';
import { ChevronLeftGlyph, ChevronRightGlyph, PauseGlyph, PlayGlyph } from '../../core/glyphs.js';
import { useUiStrings } from '../../core/provider.js';
import { Button as AriaButton, useLocale } from '../../primitives/index.js';
import { Button } from '../button/button.js';
import { carouselHooks as hooks } from './carousel-hooks.js';
import type { CarouselAutoplay } from './use-carousel-autoplay.js';

/** How a carousel lets the reader pick a slide directly. */
export type CarouselPagination = 'dots' | 'thumbnails' | 'none';

interface CarouselControlsProps {
  /** The slide element the buttons change. */
  viewportId: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  /** The rotation button's state, when the carousel rotates on its own. */
  rotation?: Pick<CarouselAutoplay, 'isStopped' | 'toggle' | 'rotationRef'> | undefined;
}

interface CarouselPaginationProps {
  pagination: Exclude<CarouselPagination, 'none'>;
  /** The index each page starts at. */
  starts: readonly number[];
  /** The shown page. */
  page: number;
  viewportId: string;
  onSelect: (index: number) => void;
  renderThumbnail?: ((index: number) => ReactNode) | undefined;
}

/** Starts or stops the slides' rotation. */
function RotationButton({
  rotation,
  viewportId,
}: Required<Pick<CarouselControlsProps, 'rotation' | 'viewportId'>>) {
  const strings = useUiStrings();
  const { rotationRef, isStopped, toggle } = rotation;
  return (
    <Button
      ref={rotationRef}
      icon={isStopped ? PlayGlyph : PauseGlyph}
      label={isStopped ? strings.startSlideRotation : strings.stopSlideRotation}
      size="sm"
      className={hooks.slotClass('rotation')}
      aria-controls={viewportId}
      onPress={toggle}
    />
  );
}

/** The rotation button, then the previous and next buttons. */
export function CarouselControls({
  viewportId,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  rotation,
}: CarouselControlsProps) {
  const strings = useUiStrings();
  const isRtl = useLocale().direction === 'rtl';
  return (
    <div {...hooks.slot('controls')}>
      {rotation ? <RotationButton rotation={rotation} viewportId={viewportId} /> : null}
      <Button
        icon={isRtl ? ChevronRightGlyph : ChevronLeftGlyph}
        label={strings.previousSlide}
        size="sm"
        className={hooks.slotClass('previous')}
        aria-controls={viewportId}
        isDisabled={!canGoPrevious}
        focusableWhenDisabled
        onPress={onPrevious}
      />
      <Button
        icon={isRtl ? ChevronLeftGlyph : ChevronRightGlyph}
        label={strings.nextSlide}
        size="sm"
        className={hooks.slotClass('next')}
        aria-controls={viewportId}
        isDisabled={!canGoNext}
        focusableWhenDisabled
        onPress={onNext}
      />
    </div>
  );
}

/**
 * One button per page, as a dot or as the caller's thumbnail of the page's first slide, marking the
 * shown page current. With one slide a page, a page is a slide.
 */
export function CarouselPaginationButtons({
  pagination,
  starts,
  page,
  viewportId,
  onSelect,
  renderThumbnail,
}: CarouselPaginationProps) {
  const strings = useUiStrings();
  const slot = pagination === 'dots' ? 'dot' : 'thumbnail';
  return (
    <div {...hooks.slot('pagination')} role="group" aria-label={strings.chooseSlide}>
      {starts.map((start, position) => (
        <AriaButton
          key={start}
          {...hooks.slot(slot, { current: position === page })}
          aria-label={strings.goToSlide(start + 1)}
          aria-current={position === page ? 'true' : undefined}
          aria-controls={viewportId}
          onPress={() => onSelect(start)}
        >
          {slot === 'thumbnail' ? renderThumbnail?.(start) : null}
        </AriaButton>
      ))}
    </div>
  );
}
