'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Dialog, Heading } from '../../primitives/index.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useLatest } from '../../utils/use-latest.js';
import { Button } from '../button/button.js';
import { tourHooks as hooks } from './tour-hooks.js';
import type { TourStepStatus } from './use-step-preparation.js';

interface TourPanelProps {
  /** The dialog's id. */
  id?: string | undefined;
  /** The shown step's index. */
  step: number;
  /** The number of steps. */
  count: number;
  title: ReactNode;
  content?: ReactNode;
  /** Whether the step is getting ready, ready or failed to get ready. */
  status: TourStepStatus;
  onRetry: () => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

/** The step's readiness, a polite live region kept in place so its changes are announced. */
function TourStatus({ status }: { status: TourStepStatus }) {
  const strings = useUiStrings();
  const text =
    status === 'pending'
      ? strings.tourStepPreparing
      : status === 'failed'
        ? strings.tourStepFailed
        : null;
  return (
    <div {...hooks.slot('status', { status })} role="status">
      {text}
    </div>
  );
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
  status,
  onRetry,
  onBack,
  onNext,
  onSkip,
}: TourPanelProps) {
  const strings = useUiStrings();
  const isLast = step === count - 1;
  const dialogRef = useRef<HTMLElement>(null);
  const skip = useLatest(onSkip);
  // The dialog takes no key handler, so Escape is heard on its document, once the event has bubbled
  // past React's root: a control in the step's content that handles Escape in its own React or
  // native handler (preventDefault or stopPropagation) keeps it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const owner = dialog.ownerDocument;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.composedPath().includes(dialog)) return;
      // A composing Escape in a field of the step's content is the input method's.
      if (event.key !== 'Escape' || event.defaultPrevented || isComposingKey(event)) return;
      event.preventDefault();
      skip.current();
    };
    owner.addEventListener('keydown', onKeyDown);
    return () => owner.removeEventListener('keydown', onKeyDown);
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
      <TourStatus status={status} />
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
        {status === 'failed' ? (
          <Button
            variant="secondary"
            size="sm"
            className={hooks.slotClass('retry')}
            onPress={onRetry}
          >
            {strings.retry}
          </Button>
        ) : null}
        <Button
          variant="primary"
          size="sm"
          className={hooks.slotClass('next')}
          isDisabled={status === 'pending'}
          onPress={onNext}
        >
          {isLast ? strings.finish : strings.next}
        </Button>
      </div>
    </Dialog>
  );
}
