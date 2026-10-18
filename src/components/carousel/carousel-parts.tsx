import type { ReactNode } from 'react';
import { Button as AriaButton } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { IconButton } from '../icon-button/icon-button.js';
import type { CarouselAutoplay } from './use-carousel-autoplay.js';

/** How a carousel lets the reader pick a slide directly. */
export type CarouselPagination = 'dots' | 'thumbnails' | 'none';

export interface CarouselControlsProps {
  /** The slide element the buttons change. */
  viewportId: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  /** The rotation button's state, when the carousel rotates on its own. */
  rotation?: Pick<CarouselAutoplay, 'isStopped' | 'toggle' | 'rotationRef'> | undefined;
}

export interface CarouselPaginationProps {
  pagination: Exclude<CarouselPagination, 'none'>;
  count: number;
  index: number;
  viewportId: string;
  onSelect: (index: number) => void;
  renderThumbnail?: ((index: number) => ReactNode) | undefined;
}

const hooks = createHooks('carousel', [
  'controls',
  'rotation',
  'previous',
  'next',
  'pagination',
  'dot',
  'thumbnail',
]);

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
  return (
    <div {...hooks.slot('controls')}>
      {rotation ? (
        <IconButton
          ref={rotation.rotationRef}
          icon={rotation.isStopped ? 'play' : 'pause'}
          label={rotation.isStopped ? strings.startSlideRotation : strings.stopSlideRotation}
          size="sm"
          className={hooks.slotClass('rotation')}
          aria-controls={viewportId}
          onPress={rotation.toggle}
        />
      ) : null}
      <IconButton
        icon="chevron-left"
        label={strings.previousSlide}
        size="sm"
        className={hooks.slotClass('previous')}
        aria-controls={viewportId}
        isDisabled={!canGoPrevious}
        focusableWhenDisabled
        onPress={onPrevious}
      />
      <IconButton
        icon="chevron-right"
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

/** One button per slide, as a dot or as the caller's thumbnail, marking the shown slide current. */
export function CarouselPaginationButtons({
  pagination,
  count,
  index,
  viewportId,
  onSelect,
  renderThumbnail,
}: CarouselPaginationProps) {
  const strings = useUiStrings();
  const slot = pagination === 'dots' ? 'dot' : 'thumbnail';
  return (
    <div {...hooks.slot('pagination')} role="group" aria-label={strings.chooseSlide}>
      {Array.from({ length: count }, (_, position) => (
        <AriaButton
          key={position}
          {...hooks.slot(slot, { current: position === index })}
          aria-label={strings.goToSlide(position + 1)}
          aria-current={position === index ? 'true' : undefined}
          aria-controls={viewportId}
          onPress={() => onSelect(position)}
        >
          {slot === 'thumbnail' ? renderThumbnail?.(position) : null}
        </AriaButton>
      ))}
    </div>
  );
}
