import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  VisuallyHidden,
  useNumberFormatter,
} from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, NativeProps, Orientation } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Icon } from '../icon/icon.js';

/** Where a step stands: done, being worked on, not reached, failed or passed over. */
export type StepsStatus = 'complete' | 'current' | 'upcoming' | 'error' | 'skipped';

/** `compact` drops descriptions and shows only the current step's label. */
export type StepsVariant = 'default' | 'compact';

export interface StepsItem {
  /** Identifies the step for `currentId` and `onAction`. */
  id: Key;
  /** The step's name. */
  label: ReactNode;
  /** A line under the label. */
  description?: ReactNode;
  /** Overrides the status read from the step's place before, at or after `currentId`. */
  status?: StepsStatus | undefined;
  /** Marks the step as one the reader may skip. */
  isOptional?: boolean | undefined;
  /** Keeps the step from being pressed. */
  isDisabled?: boolean | undefined;
}

export interface StepsProps extends BaseProps, AriaLabellingProps, Pick<NativeProps<'ol'>, 'ref'> {
  /** The steps, in order. */
  items: readonly StepsItem[];
  /** The step being worked on. */
  currentId?: Key | null | undefined;
  /** How the steps run. Defaults to `horizontal`. */
  orientation?: Orientation | undefined;
  /** Defaults to `default`. */
  variant?: StepsVariant | undefined;
  /** Makes steps already reached pressable, and receives the `id` of the step pressed. */
  onAction?: ((id: Key) => void) | undefined;
  /** Keeps every step from being pressed. */
  isDisabled?: boolean | undefined;
}

interface StepProps {
  item: StepsItem;
  index: number;
  status: StepsStatus;
  isCurrent: boolean;
  isLast: boolean;
  isCompact: boolean;
  isDisabled: boolean;
  onAction: ((id: Key) => void) | undefined;
}

const hooks = createHooks('steps', [
  'item',
  'step',
  'marker',
  'text',
  'label',
  'optional',
  'description',
  'connector',
]);

const statusGlyphs = { complete: 'check', error: 'error', skipped: 'minus' } as const;

/** The status of the step at `index`: its own, else read from where it sits against the current one. */
function resolveStepStatus(item: StepsItem, index: number, currentIndex: number): StepsStatus {
  if (item.status) return item.status;
  if (currentIndex === -1 || index > currentIndex) return 'upcoming';
  return index === currentIndex ? 'current' : 'complete';
}

/** The decorative marker: a glyph for a settled step, else the step's number. */
function StepMarker({ status, index }: { status: StepsStatus; index: number }) {
  const format = useNumberFormatter();
  const glyph = status in statusGlyphs ? statusGlyphs[status as keyof typeof statusGlyphs] : null;
  return (
    <span {...hooks.slot('marker')} aria-hidden="true">
      {glyph ? <Icon glyph={glyph} size="sm" /> : format.format(index + 1)}
    </span>
  );
}

/** The label with the status words assistive technology reads after it, then the extra lines. */
function StepText({ item, status, isCurrent, isCompact }: StepProps) {
  const strings = useUiStrings();
  const settled = status === 'complete' || status === 'error' || status === 'skipped';
  const label = (
    <span {...hooks.slot('label')}>
      {item.label}
      {settled ? (
        <>
          {' '}
          <VisuallyHidden>{strings.stepStatus(status)}</VisuallyHidden>
        </>
      ) : null}
    </span>
  );
  return (
    <span {...hooks.slot('text')}>
      {isCompact && !isCurrent ? <VisuallyHidden>{label}</VisuallyHidden> : label}
      {item.isOptional && !isCompact ? (
        <>
          {' '}
          <span {...hooks.slot('optional')}>{strings.optional}</span>
        </>
      ) : null}
      {isCompact || isEmptyNode(item.description) ? null : (
        <>
          {' '}
          <span {...hooks.slot('description')}>{item.description}</span>
        </>
      )}
    </span>
  );
}

function Step(props: StepProps) {
  const { item, index, status, isCurrent, isLast, isDisabled, onAction } = props;
  const content = (
    <>
      <StepMarker status={status} index={index} />
      <StepText {...props} />
    </>
  );
  const canPress = Boolean(onAction) && !isCurrent && status !== 'upcoming' && status !== 'current';
  return (
    <li
      {...hooks.slot('item', { status, current: isCurrent, disabled: isDisabled })}
      aria-current={isCurrent ? 'step' : undefined}
    >
      {canPress ? (
        <AriaButton
          className={hooks.slotClass('step')}
          isDisabled={isDisabled}
          onPress={() => onAction?.(item.id)}
        >
          {content}
        </AriaButton>
      ) : (
        <span {...hooks.slot('step')}>{content}</span>
      )}
      {isLast ? null : <span {...hooks.slot('connector')} aria-hidden="true" />}
    </li>
  );
}

/**
 * An ordered list of the steps of a task with where each one stands, the current one marked with
 * `aria-current="step"`. Steps already reached can be pressed to return to them.
 */
export function Steps({
  items,
  currentId = null,
  orientation = 'horizontal',
  variant = 'default',
  onAction,
  isDisabled = false,
  className,
  ...rest
}: StepsProps) {
  const strings = useUiStrings();
  const currentIndex = items.findIndex((item) => item.id === currentId);
  const named = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined;
  return (
    <ol
      aria-label={named ? undefined : strings.steps}
      {...rest}
      {...hooks.root({ className, props: rest, data: { orientation, variant } })}
    >
      {items.map((item, index) => (
        <Step
          key={toKeyIdentity(item.id)}
          item={item}
          index={index}
          status={resolveStepStatus(item, index, currentIndex)}
          isCurrent={index === currentIndex}
          isLast={index === items.length - 1}
          isCompact={variant === 'compact'}
          isDisabled={isDisabled || Boolean(item.isDisabled)}
          onAction={onAction}
        />
      ))}
    </ol>
  );
}
