'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { OpenStateProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Placement } from '../../core/props.js';
import { usePersistentState } from '../../core/provider.js';
import { booleanCodec } from '../../utils/json-codec.js';
import { PopoverPanel } from '../popover/popover.js';
import { TourPanel } from './tour-panel.js';
import { TourSpotlight } from './tour-spotlight.js';
import { useTourTarget, type TourTarget } from './use-tour-target.js';
import { clamp } from '../../utils/clamp.js';

export type { TourTarget } from './use-tour-target.js';

/** One step of a tour. */
export interface TourStep {
  /** The element the step points at: a ref, or a CSS selector looked up when the step shows. */
  target: TourTarget;
  /** The step's heading, which names its dialog. */
  title: ReactNode;
  /** The step's explanation. */
  content?: ReactNode;
  /** Where the step's popover opens against the target. Defaults to `bottom`. */
  placement?: Placement | undefined;
}

export interface TourProps extends BaseProps, OpenStateProps {
  /** The steps, in order. */
  steps: readonly TourStep[];
  /** The shown step's index (controlled). */
  step?: number | undefined;
  /** The step shown each time the tour opens (uncontrolled). Defaults to 0. */
  defaultStep?: number | undefined;
  /** Called with the index of each step moved to. */
  onStepChange?: ((step: number) => void) | undefined;
  /** Leaves the page reachable and scrollable while the tour is open. */
  isNonModal?: boolean | undefined;
  /** Remembers through the provider storage that the tour was finished or skipped, so it opens no more. */
  persistKey?: string | undefined;
  /** Called when the reader finishes the last step. */
  onFinish?: (() => void) | undefined;
  /** Called with the shown step's index when the reader skips the tour, with Skip or Escape. */
  onSkip?: ((step: number) => void) | undefined;
}

const hooks = createHooks('tour', ['arrow']);

/** The open state: the caller's when controlled, else our own, closed once the tour is completed. */
function useTourOpenState({
  isOpen,
  defaultOpen = false,
  onOpenChange,
  persistKey,
}: Pick<TourProps, 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'persistKey'>) {
  const [isCompleted, setCompleted] = usePersistentState(persistKey, false, booleanCodec);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const complete = () => {
    if (persistKey !== undefined) setCompleted(true);
    setOwnOpen(false);
    onOpenChange?.(false);
  };
  return { isOpen: isOpen ?? (ownOpen && isCompleted !== true), complete };
}

/**
 * The shown step: the caller's when controlled, else our own, back at `defaultStep` whenever the
 * tour is closed, however it closed.
 */
function useTourStep({
  step,
  defaultStep = 0,
  onStepChange,
  isOpen,
}: Pick<TourProps, 'step' | 'defaultStep' | 'onStepChange'> & { isOpen: boolean }) {
  const [ownStep, setOwnStep] = useState(defaultStep);
  if (!isOpen && step === undefined && ownStep !== defaultStep) setOwnStep(defaultStep);
  return {
    step: step ?? ownStep,
    moveTo: (next: number) => {
      if (step === undefined) setOwnStep(next);
      onStepChange?.(next);
    },
  };
}

/**
 * A guided sequence of steps, each a dialog floating against an element of the page with a
 * spotlight over that element. Modal by default: the rest of the page is inert until the reader
 * finishes or skips; `isNonModal` leaves it usable. With `persistKey`, a completed tour stays closed.
 */
export function Tour({
  steps,
  step: stepProp,
  defaultStep,
  onStepChange,
  isOpen: isOpenProp,
  defaultOpen,
  onOpenChange,
  isNonModal = false,
  persistKey,
  onFinish,
  onSkip,
  id,
  className,
  ...rest
}: TourProps) {
  const open = useTourOpenState({ isOpen: isOpenProp, defaultOpen, onOpenChange, persistKey });
  const position = useTourStep({
    step: stepProp,
    defaultStep,
    onStepChange,
    isOpen: open.isOpen,
  });
  const index = clamp(Math.trunc(position.step) || 0, 0, steps.length - 1);
  const current = steps[index];
  const isOpen = open.isOpen && current !== undefined;
  const target = useTourTarget(current?.target, isOpen);
  const [spotlight, setSpotlight] = useState<HTMLDivElement | null>(null);
  const anchor = target.element ?? spotlight;
  const anchorRef = useMemo(() => ({ current: anchor }), [anchor]);
  if (!isOpen) return null;
  const close = (onClose: () => void) => {
    open.complete();
    onClose();
  };
  return (
    <>
      <TourSpotlight target={target.element} element={spotlight} spotlightRef={setSpotlight} />
      {target.isResolved && anchor ? (
        <PopoverPanel
          {...rest}
          {...hooks.root({ className, props: rest, data: { nonModal: isNonModal } })}
          isOpen
          triggerRef={anchorRef}
          placement={current.placement ?? 'bottom'}
          isNonModal={isNonModal}
          isKeyboardDismissDisabled
          shouldCloseOnInteractOutside={() => false}
          arrowClassName={target.element ? hooks.slotClass('arrow') : undefined}
        >
          <TourPanel
            key={index}
            id={id}
            step={index}
            count={steps.length}
            title={current.title}
            content={current.content}
            onBack={() => position.moveTo(index - 1)}
            onNext={() =>
              index === steps.length - 1 ? close(() => onFinish?.()) : position.moveTo(index + 1)
            }
            onSkip={() => close(() => onSkip?.(index))}
          />
        </PopoverPanel>
      ) : null}
    </>
  );
}
