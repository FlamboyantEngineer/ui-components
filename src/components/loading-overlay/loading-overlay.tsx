'use client';

import { useId, useRef, type ReactNode, type Ref } from 'react';
import { useNumberFormatter } from '../../primitives/index.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { LoadingBoundaryProvider } from '../../core/loading-boundary.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useActiveAfter } from '../../utils/use-delayed-flag.js';
import { useEnterExit } from '../../utils/use-enter-exit.js';
import { Portal } from '../portal/portal.js';
import {
  ProgressBar,
  resolveProgressRange,
  toProgressRatio,
  type ProgressBarProps,
} from '../progress-bar/progress-bar.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
import { useBlockedFocus } from './use-blocked-focus.js';

/** Measured progress for the card's bar. Without it, or when indeterminate, the bar has no level. */
export type LoadingProgress = Pick<
  ProgressBarProps,
  | 'value'
  | 'minValue'
  | 'maxValue'
  | 'valueLabel'
  | 'formatOptions'
  | 'isIndeterminate'
  | 'aria-label'
>;

/** A phase counter: `current` of `total`, both whole numbers. */
export interface LoadingStep {
  current: number;
  total: number;
}

export interface LoadingCardProps extends BaseProps {
  /** What is loading; the card announces it politely. Defaults to the provider's `loading` string. */
  label?: ReactNode;
  /** A longer explanation under the bar. */
  description?: ReactNode;
  /** The current piece of work, kept out of the announcement; cut text keeps a tooltip. */
  hint?: ReactNode;
  /** Measured progress; omit for an indeterminate bar. */
  progress?: LoadingProgress | undefined;
  /** The current phase, shown as "current of total". */
  step?: LoadingStep | undefined;
}

export type LoadingOverlayPresentation = 'card' | 'scrim';

export interface LoadingOverlayProps extends LoadingCardProps {
  /**
   * `card` (the default) centres the status card on the scrim. `scrim` draws the cover alone, hidden
   * from assistive technology, for secondary regions that load together with a primary one.
   */
  presentation?: LoadingOverlayPresentation | undefined;
  /** Milliseconds the work must last before the overlay shows, so quick work never flashes it. */
  delay?: number | undefined;
  /** Cover the viewport from the overlay layer instead of the positioned parent. */
  fullscreen?: boolean | undefined;
  /** The overlay has just appeared; publishes `data-entering` for an enter animation. */
  isEntering?: boolean | undefined;
  /** The overlay is on its way out; publishes `data-exiting` for an exit transition. */
  isExiting?: boolean | undefined;
  /** The cover element, for example for `useEnterExit`. */
  ref?: Ref<HTMLDivElement> | undefined;
}

export interface LoadingRegionProps extends Omit<
  LoadingOverlayProps,
  'isEntering' | 'isExiting' | 'ref'
> {
  /** While true (after `delay`) the region is busy, its content is inert and the overlay covers it. */
  isLoading?: boolean | undefined;
  /** The region's content. */
  children?: ReactNode;
}

const cardHooks = createHooks('loading-card', [
  'header',
  'label',
  'value',
  'progress',
  'description',
  'footer',
  'hint',
  'step',
]);
const overlayHooks = createHooks('loading-overlay');
const regionHooks = createHooks('loading-region', ['content']);

function isMeasured(progress: LoadingProgress | undefined): progress is LoadingProgress {
  return progress !== undefined && !progress.isIndeterminate;
}

function isValidStep(step: LoadingStep | undefined): step is LoadingStep {
  return (
    step !== undefined &&
    Number.isInteger(step.current) &&
    Number.isInteger(step.total) &&
    step.current > 0 &&
    step.current <= step.total
  );
}

/** The bounded share of measured progress that is done, from 0 to 1. */
function toRatio(progress: LoadingProgress): number {
  return toProgressRatio(resolveProgressRange(progress));
}

/** The whole, locale-formatted percentage, hidden from assistive technology (the bar has it). */
function LoadingCardValue({ progress }: { progress: LoadingProgress }) {
  const percent = useNumberFormatter({ style: 'percent', maximumFractionDigits: 0 });
  return (
    <span {...cardHooks.slot('value')} aria-hidden="true">
      {percent.format(toRatio(progress))}
    </span>
  );
}

/** The one progress bar, quiet, named by the progress label or else by the card's label. */
function LoadingCardBar({
  progress,
  labelId,
}: {
  progress: LoadingProgress | undefined;
  labelId: string;
}) {
  const { 'aria-label': progressLabel, ...measured }: LoadingProgress = progress ?? {};
  const range = isMeasured(progress) ? measured : {};
  return (
    <div {...cardHooks.slot('progress')} aria-live="off">
      <ProgressBar
        {...range}
        isIndeterminate={!isMeasured(progress)}
        size="md"
        showValueLabel={false}
        {...(progressLabel ? { 'aria-label': progressLabel } : { 'aria-labelledby': labelId })}
      />
    </div>
  );
}

/** The quiet footer pairing the hint with the step counter; nothing when both are absent. */
function LoadingCardFooter({ hint, step }: Pick<LoadingCardProps, 'hint' | 'step'>) {
  const strings = useUiStrings();
  const stepLabel = isValidStep(step) ? strings.stepOfTotal(step.current, step.total) : null;
  if (isEmptyNode(hint) && stepLabel === null) return null;
  return (
    <div {...cardHooks.slot('footer')} aria-live="off">
      {isEmptyNode(hint) ? null : (
        <TruncationTooltip className={cardHooks.slotClass('hint')}>{hint}</TruncationTooltip>
      )}
      {stepLabel === null ? null : <span {...cardHooks.slot('step')}>{stepLabel}</span>}
    </div>
  );
}

/**
 * The loading status card: label, optional percentage, one progress bar, an optional description
 * and a footer pairing the current-work hint with a step counter. Only the label and description
 * are announced; progress, hint and step changes stay quiet.
 */
export function LoadingCard({
  label,
  description,
  hint,
  progress,
  step,
  className,
  ...rest
}: LoadingCardProps) {
  const strings = useUiStrings();
  const labelId = useId();
  const isDeterminate = isMeasured(progress);

  return (
    <div
      {...rest}
      {...cardHooks.root({ className, data: { determinate: isDeterminate } })}
      role="status"
      aria-live="polite"
    >
      <div {...cardHooks.slot('header')}>
        <p {...cardHooks.slot('label')} id={labelId}>
          {label ?? strings.loading}
        </p>
        {isDeterminate ? <LoadingCardValue progress={progress} /> : null}
      </div>
      <LoadingCardBar progress={progress} labelId={labelId} />
      {isEmptyNode(description) ? null : <p {...cardHooks.slot('description')}>{description}</p>}
      <LoadingCardFooter hint={hint} step={step} />
    </div>
  );
}

/**
 * A cover for a positioned surface that is loading, with the status card centred on it. The
 * stylesheet stretches it over its positioned parent, or over the viewport when `fullscreen`; mount
 * it only while the work runs. With `delay` it shows only once the work has lasted that long.
 */
export function LoadingOverlay({
  presentation = 'card',
  delay = 0,
  fullscreen = false,
  isEntering = false,
  isExiting = false,
  className,
  id,
  ref,
  ...rest
}: LoadingOverlayProps) {
  const isShown = useActiveAfter(true, delay);
  const isScrim = presentation === 'scrim';
  const [data, cardProps] = splitDataAttributes(rest);
  if (!isShown) return null;
  const hookData = { presentation, fullscreen, entering: isEntering, exiting: isExiting };
  const cover = (
    <div
      {...data}
      {...overlayHooks.root({ className, data: hookData })}
      id={id}
      ref={ref}
      aria-hidden={isScrim || undefined}
    >
      {isScrim ? null : <LoadingCard {...cardProps} />}
    </div>
  );
  return fullscreen ? <Portal layer="modal">{cover}</Portal> : cover;
}

/**
 * A bounded region that blocks its own content while loading: its content is marked busy and made
 * inert (no pointer, focus or assistive-technology access) and a `LoadingOverlay` covers it; focus
 * that was in the content waits on the region and returns once loading ends. With
 * `delay` all of it waits until the work has lasted that long; the overlay stays mounted through its
 * exit transition (`useEnterExit`).
 */
export function LoadingRegion({
  isLoading = false,
  delay = 0,
  children,
  className,
  id,
  ...rest
}: LoadingRegionProps) {
  const isBlocked = useActiveAfter(isLoading, delay);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { isMounted, isEntering, isExiting } = useEnterExit(overlayRef, isBlocked);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const holdFocus = useBlockedFocus({ rootRef, contentRef, isBlocked });
  const [data, overlayProps] = splitDataAttributes(rest);
  return (
    <div
      {...data}
      {...regionHooks.root({ className, data: { loading: isBlocked } })}
      id={id}
      ref={rootRef}
      tabIndex={isBlocked ? -1 : undefined}
    >
      {/* Only the content is busy: a busy ancestor would hold back the card's announcement. */}
      <div
        {...regionHooks.slot('content')}
        ref={contentRef}
        aria-busy={isBlocked || undefined}
        inert={isBlocked || undefined}
      >
        <LoadingBoundaryProvider isSuspended={isBlocked} holdFocus={holdFocus}>
          {children}
        </LoadingBoundaryProvider>
      </div>
      {isMounted ? (
        <LoadingOverlay
          {...overlayProps}
          ref={overlayRef}
          isEntering={isEntering}
          isExiting={isExiting}
        />
      ) : null}
    </div>
  );
}
