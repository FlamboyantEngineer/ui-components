import type { ModalAction } from './modal.js';
/** Which built-in footer action runs. */
export type ModalActionSlot = 'primary' | 'secondary';
export interface ModalActionsOptions {
    primaryAction?: ModalAction | undefined;
    secondaryAction?: ModalAction | undefined;
}
/** The action lifecycle of one opening of a modal. */
export interface ModalActions {
    /** The action whose promise is running. */
    running: ModalActionSlot | null;
    /** The message of the last failed attempt, until the next attempt or the next opening. */
    failure: string | null;
    /** Closes this opening of the modal. */
    close: () => void;
    /** Whether the action exists, is enabled and not pending, and no action is running. */
    canRun: (slot: ModalActionSlot) => boolean;
    /** Runs the action, keeping it pending until its promise settles. */
    run: (slot: ModalActionSlot) => void;
}
/**
 * Runs the footer actions of the enclosing modal. Each opening gets a generation, so a request from
 * an earlier opening never releases, fails or closes a later one, and closing clears the state.
 */
export declare function useModalActions({ primaryAction, secondaryAction, }: ModalActionsOptions): ModalActions;
//# sourceMappingURL=use-modal-actions.d.ts.map