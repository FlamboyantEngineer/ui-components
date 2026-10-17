import { useId, useMemo, type ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import {
  ProgressBar,
  resolveProgressRange,
  type ProgressBarProps,
} from '../progress-bar/progress-bar.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';

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
}

export interface LoadingRegionProps extends LoadingOverlayProps {
  /** While true the region is busy, its content is inert and the overlay covers it. */
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
  const { value, minValue, maxValue } = resolveProgressRange(progress);
  return maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0;
}

/** The whole, locale-formatted percentage, hidden from assistive technology (the bar has it). */
function LoadingCardValue({ progress }: { progress: LoadingProgress }) {
  const { locale } = useLocale();
  const percent = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }),
    [locale],
  );
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
  const { 'aria-label': progressLabel, ...range } = isMeasured(progress) ? progress : {};
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
 * stylesheet stretches it over its positioned parent; mount it only while the work runs.
 */
export function LoadingOverlay({
  presentation = 'card',
  className,
  id,
  ...rest
}: LoadingOverlayProps) {
  const isScrim = presentation === 'scrim';
  const [data, cardProps] = splitDataAttributes(rest);
  return (
    <div
      {...data}
      {...overlayHooks.root({ className, data: { presentation } })}
      id={id}
      aria-hidden={isScrim || undefined}
    >
      {isScrim ? null : <LoadingCard {...cardProps} />}
    </div>
  );
}

/**
 * A bounded region that blocks its own content while loading: it is marked busy, its content is
 * inert (no pointer, focus or assistive-technology access) and a `LoadingOverlay` covers it.
 */
export function LoadingRegion({
  isLoading = false,
  children,
  className,
  id,
  ...rest
}: LoadingRegionProps) {
  const [data, overlayProps] = splitDataAttributes(rest);
  return (
    <div
      {...data}
      {...regionHooks.root({ className, data: { loading: isLoading } })}
      id={id}
      aria-busy={isLoading || undefined}
    >
      <div {...regionHooks.slot('content')} inert={isLoading || undefined}>
        {children}
      </div>
      {isLoading ? <LoadingOverlay {...overlayProps} /> : null}
    </div>
  );
}
