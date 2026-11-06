'use client';

import { type ReactNode, useMemo, useState } from 'react';
import type { OpenStateProps } from '../../core/events.js';
import type { BaseProps, Placement, RefProps } from '../../core/props.js';
import { usePersistentState } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { booleanCodec } from '../../utils/json-codec.js';
import { useFollowAnchor } from '../../utils/use-follow-anchor.js';
import { PopoverPanel } from '../popover/popover.js';
import { tourHooks as hooks } from './tour-hooks.js';
import { TourPanel } from './tour-panel.js';
import { TourSpotlight } from './tour-spotlight.js';
import {
  type TourStepPrepare,
  type TourStepStatus,
  useStepPreparation,
  useTargetWait,
} from './use-step-preparation.js';
import { type TourTarget, useTourTarget } from './use-tour-target.js';

export type {
  TourPrepareContext,
  TourStepPrepare,
  TourStepStatus,
} from './use-step-preparation.js';
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
  /**
   * Names the step, so a replaced list of steps whose step at this index has another id prepares it
   * afresh. Defaults to the index alone.
   */
  id?: string | undefined;
  /**
   * Gets the target ready before the step points at it, such as by opening a closed section or
   * loading data; the step shows as pending until it settles, and as failed, with Retry, if it
   * rejects. Its signal aborts when the step stops waiting for it.
   */
  prepare?: TourStepPrepare | undefined;
  /**
   * Milliseconds the ready step waits for a target that is not in the page yet before it shows
   * without one. Defaults to 0, no wait.
   */
  targetTimeout?: number | undefined;
}

export interface TourProps extends RefProps<HTMLElement>, BaseProps, OpenStateProps {
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

/** The open state: the caller's when controlled, else our own, closed once the tour is completed. */
function useTourOpenState({
  isOpen,
  defaultOpen = false,
  onOpenChange,
  persistKey,
}: Pick<TourProps, 'isOpen' | 'defaultOpen' | 'onOpenChange' | 'persistKey'>) {
  const [isCompleted, setCompleted] = usePersistentState(persistKey, false, {
    codec: booleanCodec,
  });
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

/** A new number each time the tour opens, so each opening prepares its steps afresh. */
function useOpening(isOpen: boolean) {
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setSession(session + 1);
  }
  return session;
}

/**
 * Where the shown step stands: its preparation, then its wait for a target, then the element its
 * dialog is placed against (the target, or the spotlight at the centre while it has none).
 */
function useStepPlace(step: TourStep | undefined, index: number, isOpen: boolean) {
  const key = `${useOpening(isOpen)}:${index}:${step?.id ?? ''}`;
  const preparation = useStepPreparation(step?.prepare, key, isOpen);
  const target = useTourTarget(step?.target, isOpen && preparation.status === 'ready');
  const isWaiting = useTargetWait(key, {
    isReady: preparation.status === 'ready' && target.isResolved,
    hasTarget: target.element !== null,
    timeout: step?.targetTimeout ?? 0,
  });
  const status: TourStepStatus = isWaiting ? 'pending' : preparation.status;
  const [spotlight, setSpotlight] = useState<HTMLDivElement | null>(null);
  const element = status === 'ready' ? target.element : null;
  const anchor = element ?? spotlight;
  const anchorRef = useMemo(() => ({ current: anchor }), [anchor]);
  // The dialog and its arrow follow the target as the page scrolls or resizes, with the spotlight.
  const shouldUpdatePosition = useFollowAnchor({ anchorRef, isOpen: isOpen && anchor !== null });
  return {
    status,
    retry: preparation.retry,
    element,
    spotlight,
    setSpotlight,
    anchorRef,
    shouldUpdatePosition,
    isShown: anchor !== null && (status !== 'ready' || target.isResolved),
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
  const place = useStepPlace(current, index, isOpen);
  if (!isOpen) return null;
  const close = (onClose: () => void) => {
    open.complete();
    onClose();
  };
  return (
    <>
      <TourSpotlight
        target={place.element}
        isPending={place.status === 'pending'}
        element={place.spotlight}
        spotlightRef={place.setSpotlight}
      />
      {place.isShown ? (
        <PopoverPanel
          {...rest}
          {...hooks.root({
            className,
            props: rest,
            data: { nonModal: isNonModal, status: place.status },
          })}
          isOpen
          triggerRef={place.anchorRef}
          shouldUpdatePosition={place.shouldUpdatePosition}
          placement={current.placement ?? 'bottom'}
          isNonModal={isNonModal}
          isKeyboardDismissDisabled
          shouldCloseOnInteractOutside={() => false}
          arrowClassName={place.element ? hooks.slotClass('arrow') : undefined}
        >
          <TourPanel
            key={index}
            id={id}
            step={index}
            count={steps.length}
            title={current.title}
            content={current.content}
            status={place.status}
            onRetry={place.retry}
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
