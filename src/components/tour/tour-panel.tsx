'use client';

import { useLatest } from '../../utils/use-latest.js';
import { useEffect, useRef, type ReactNode } from 'react';
import { Dialog, Heading } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { Button } from '../button/button.js';
import { tourHooks as hooks } from './tour-hooks.js';

interface TourPanelProps {
  /** The dialog's id. */
  id?: string | undefined;
  /** The shown step's index. */
  step: number;
  /** The number of steps. */
  count: number;
  title: ReactNode;
  content?: ReactNode;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

/**
 * One step's dialog: the title, which names it, the step count, the body, then Skip, Back and Next
 * (Finish on the last step). Escape skips the tour.
 */
export function TourPanel({
  id,
  step,
  count,
  title,
  content,
  onBack,
  onNext,
  onSkip,
}: TourPanelProps) {
  const strings = useUiStrings();
  const isLast = step === count - 1;
  const dialogRef = useRef<HTMLElement>(null);
  const skip = useLatest(onSkip);
  // The dialog takes no key handler, so Escape is heard on its element.
  useEffect(() => {
    const dialog = dialogRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      // A composing Escape in a field of the step's content is the input method's.
      if (event.key !== 'Escape' || event.defaultPrevented || isComposingKey(event)) return;
      event.preventDefault();
      skip.current();
    };
    dialog?.addEventListener('keydown', onKeyDown);
    return () => dialog?.removeEventListener('keydown', onKeyDown);
  }, [skip]);
  return (
    <Dialog ref={dialogRef} id={id} className={hooks.slotClass('dialog')}>
      <div {...hooks.slot('header')}>
        <Heading slot="title" className={hooks.slotClass('title')}>
          {title}
        </Heading>
        <span {...hooks.slot('progress')}>{strings.stepOfTotal(step + 1, count)}</span>
      </div>
      {isEmptyNode(content) ? null : <div {...hooks.slot('body')}>{content}</div>}
      <div {...hooks.slot('footer')}>
        {isLast ? null : (
          <Button variant="ghost" size="sm" className={hooks.slotClass('skip')} onPress={onSkip}>
            {strings.skip}
          </Button>
        )}
        {step > 0 ? (
          <Button
            variant="secondary"
            size="sm"
            className={hooks.slotClass('back')}
            onPress={onBack}
          >
            {strings.back}
          </Button>
        ) : null}
        <Button variant="primary" size="sm" className={hooks.slotClass('next')} onPress={onNext}>
          {isLast ? strings.finish : strings.next}
        </Button>
      </div>
    </Dialog>
  );
}
