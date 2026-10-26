import { type ReactNode } from 'react';
/** The transition a dialog is open for, as the dialog shows it. */
export interface TransitionDialogTarget {
    /** The target state's label. */
    state: string;
    /** The action's label. */
    action: string;
    /** What the transition does, shown under the title. */
    message: ReactNode;
    requiresComment: boolean;
}
interface TransitionDialogProps {
    /** The transition the dialog is for; it stays set while the dialog closes. */
    target: TransitionDialogTarget | null;
    isOpen: boolean;
    onClose: () => void;
    /** Runs the transition with the comment typed, if one was asked for. */
    onConfirm: (comment: string | undefined) => void | Promise<unknown>;
    /** The hook class of the comment field. */
    commentClassName: string;
}
/**
 * Asks before a transition runs: its message and, when the transition requires one, a comment that
 * must not be blank. The action runs the transition, keeping the dialog pending until a returned
 * promise settles and open with the failure if it rejects.
 */
export declare function TransitionDialog({ target, isOpen, onClose, onConfirm, commentClassName, }: TransitionDialogProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=transition-dialog.d.ts.map