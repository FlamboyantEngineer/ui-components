import { type ReactNode } from 'react';
export interface TourPanelProps {
    /** The dialog's id. */
    id?: string | undefined;
    /** The shown step's index. */
    step: number;
    /** The number of steps. */
    count: number;
    title: ReactNode;
    content?: ReactNode;
    onBack: () => void;
    onNext: () => void;
    onSkip: () => void;
}
/**
 * One step's dialog: the title, which names it, the step count, the body, then Skip, Back and Next
 * (Finish on the last step). Escape skips the tour.
 */
export declare function TourPanel({ id, step, count, title, content, onBack, onNext, onSkip, }: TourPanelProps): import("react").JSX.Element;
//# sourceMappingURL=tour-panel.d.ts.map