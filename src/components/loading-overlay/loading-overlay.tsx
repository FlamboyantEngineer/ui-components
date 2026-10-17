import { useId, useMemo, type ReactNode } from 'react';
import { useLocale } from 'react-aria-components';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { ProgressBar, boundedRange, type ProgressBarProps } from '../progress-bar/progress-bar.js';
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

export interface LoadingCardProps {
  /** What is loading; the card announces it politely. Defaults to the provider's `loading` string. */
  label?: ReactNode;
  /** A longer explanation under the bar. */
  description?: ReactNode;
  /** The current piece of work, kept out of the announcement; cut text keeps a tooltip. */
  hint?: ReactNode;
  progress?: LoadingProgress | undefined;
  step?: LoadingStep | undefined;
  className?: string | undefined;
  id?: string | undefined;
  [data: `data-${string}`]: string | number | boolean | undefined;
}

export type LoadingOverlayPresentation = 'card' | 'scrim';

export interface LoadingOverlayProps extends LoadingCardProps {
  /**
   * `card` (the default) centres the status card on the scrim. `scrim` draws the cover alone, hidden
   * from assistive technology, for secondary regions that load together with a primary one.
   */
  presentation?: LoadingOverlayPresentation | undefined;
}

export interface LoadingRegionProps extends Omit<LoadingOverlayProps, 'className' | 'id'> {
  /** While true the region is busy, its content is inert and the overlay covers it. */
  isLoading?: boolean | undefined;
  children?: ReactNode;
  className?: string | undefined;
  id?: string | undefined;
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

function validStep(step: LoadingStep | undefined): step is LoadingStep {
  return (
    step !== undefined &&
    Number.isInteger(step.current) &&
    Number.isInteger(step.total) &&
    step.current > 0 &&
    step.current <= step.total
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
  id,
  ...rest
}: LoadingCardProps) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const labelId = useId();
  const measured = isMeasured(progress);
  const percent = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }),
    [locale],
  );
  let ratio = 0;
  if (measured) {
    const range = boundedRange(progress);
    const span = range.maxValue - range.minValue;
    ratio = span > 0 ? (range.value - range.minValue) / span : 0;
  }
  const stepLabel = validStep(step) ? strings.stepOfTotal(step.current, step.total) : null;
  const hasHint = hint != null && hint !== false && hint !== '';
  const { 'aria-label': progressLabel, ...progressRange } = progress ?? {};

  return (
    <div
      {...cardHooks.root({ className, props: rest, data: { determinate: measured } })}
      id={id}
      role="status"
      aria-live="polite"
    >
      <div {...cardHooks.slot('header')}>
        <p {...cardHooks.slot('label')} id={labelId}>
          {label ?? strings.loading}
        </p>
        {measured ? (
          <span {...cardHooks.slot('value')} aria-hidden="true">
            {percent.format(ratio)}
          </span>
        ) : null}
      </div>
      <div {...cardHooks.slot('progress')} aria-live="off">
        <ProgressBar
          {...(measured ? progressRange : {})}
          isIndeterminate={!measured}
          size="md"
          showValueLabel={false}
          {...(progressLabel ? { 'aria-label': progressLabel } : { 'aria-labelledby': labelId })}
        />
      </div>
      {description != null && description !== false && description !== '' ? (
        <p {...cardHooks.slot('description')}>{description}</p>
      ) : null}
      {hasHint || stepLabel ? (
        <div {...cardHooks.slot('footer')} aria-live="off">
          {hasHint ? (
            <TruncationTooltip className={cardHooks.slotClass('hint')}>{hint}</TruncationTooltip>
          ) : null}
          {stepLabel ? <span {...cardHooks.slot('step')}>{stepLabel}</span> : null}
        </div>
      ) : null}
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
  const [, cardProps] = splitDataAttributes(rest);
  return (
    <div
      {...overlayHooks.root({ className, props: rest, data: { presentation } })}
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
  const [, overlayProps] = splitDataAttributes(rest);
  return (
    <div
      {...regionHooks.root({ className, props: rest, data: { loading: isLoading } })}
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
