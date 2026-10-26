import type { ReactNode } from 'react';
import type { BaseProps, NativeProps, Size, Tone } from '../../core/props.js';
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
/**
 * A coloured dot beside a short label that names a status, such as a service state or a person's
 * presence. Without a visible label it is an image named by `aria-label`, or decorative.
 */
export declare function StatusLight({ children, tone, status, size, isProcessing, className, 'aria-label': ariaLabel, ...rest }: StatusLightProps): import("react").JSX.Element;
//# sourceMappingURL=status-light.d.ts.map