import { type ReactNode } from 'react';
import type { OpenStateProps } from '../../core/events.js';
import type { BaseProps, Placement } from '../../core/props.js';
import { type TourTarget } from './use-tour-target.js';
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
/**
 * A guided sequence of steps, each a dialog floating against an element of the page with a
 * spotlight over that element. Modal by default: the rest of the page is inert until the reader
 * finishes or skips; `isNonModal` leaves it usable. With `persistKey`, a completed tour stays closed.
 */
export declare function Tour({ steps, step: stepProp, defaultStep, onStepChange, isOpen: isOpenProp, defaultOpen, onOpenChange, isNonModal, persistKey, onFinish, onSkip, id, className, ...rest }: TourProps): import("react").JSX.Element | null;
//# sourceMappingURL=tour.d.ts.map