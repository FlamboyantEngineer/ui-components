import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, NativeProps, Size, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';

export type StatusLightTone = Tone;

export type StatusLightSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** A person's presence, in the words a presence avatar uses. */
export type StatusLightStatus = 'active' | 'away' | 'busy' | 'idle';

export interface StatusLightProps extends BaseProps, Pick<NativeProps<'span'>, 'aria-label'> {
  /** The visible label. Defaults to the presence label of `status`, if any. */
  children?: ReactNode;
  /** The status's tone. Defaults to `neutral`. */
  tone?: StatusLightTone | undefined;
  /** A presence state, published for the stylesheet and labelled from the provider's strings. */
  status?: StatusLightStatus | undefined;
  /** Dot and text size. Defaults to `md`. */
  size?: StatusLightSize | undefined;
  /** The status is still in progress, such as a deployment running; the stylesheet may pulse the dot. */
  isProcessing?: boolean | undefined;
}

const hooks = createHooks('status-light', ['dot', 'label']);

/**
 * A coloured dot beside a short label that names a status, such as a service state or a person's
 * presence. Without a visible label it is an image named by `aria-label`, or decorative.
 */
export function StatusLight({
  children,
  tone = 'neutral',
  status,
  size = 'md',
  isProcessing = false,
  className,
  'aria-label': ariaLabel,
  ...rest
}: StatusLightProps) {
  const strings = useUiStrings();
  const presenceLabel = status && !ariaLabel ? strings.presenceStatus(status) : undefined;
  const label = isEmptyNode(children) ? presenceLabel : children;
  const data = { tone, size, status, processing: isProcessing };
  const name = label === undefined && ariaLabel ? ariaLabel : undefined;
  return (
    <span
      {...rest}
      {...hooks.root({ className, data })}
      role={name ? 'img' : undefined}
      aria-label={name}
      aria-hidden={label === undefined && !name ? true : undefined}
    >
      <span {...hooks.slot('dot')} aria-hidden="true" />
      {label === undefined ? null : <span {...hooks.slot('label')}>{label}</span>}
    </span>
  );
}
