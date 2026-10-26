import type { FeedbackDetails } from './message-commands.js';
export interface FeedbackFormProps {
    /** The reasons offered as toggle chips, in order. */
    reasons: readonly string[];
    onSubmit: (details: FeedbackDetails) => void;
    onSkip: () => void;
}
/** The details that follow a rating: reason chips, an optional comment, then Skip and Submit. */
export declare function FeedbackForm({ reasons, onSubmit, onSkip }: FeedbackFormProps): import("react").JSX.Element;
//# sourceMappingURL=feedback-form.d.ts.map