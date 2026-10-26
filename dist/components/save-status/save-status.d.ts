import type { BaseProps } from '../../core/props.js';
/**
 * Where an editor's changes stand: `idle` shows nothing, `dirty` has unsaved changes, `saving` is
 * writing them, `saved` has written them, `error` failed and `offline` cannot reach the store.
 */
export type SaveStatusPhase = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'offline';
/** The phases that show a label. */
export type SaveStatusLabelPhase = Exclude<SaveStatusPhase, 'idle'>;
export interface SaveStatusProps extends BaseProps {
    /** Where the changes stand. */
    phase: SaveStatusPhase;
    /** Replaces the provider's label of any phase, such as the reason a save failed. */
    labels?: Partial<Record<SaveStatusLabelPhase, string>> | undefined;
    /** Draws a Retry button in the `error` phase that calls this. */
    onRetry?: (() => void) | undefined;
    /** Milliseconds after which the `saved` label fades out. Without it the label stays. */
    hideSavedAfter?: number | undefined;
}
/**
 * An editor's save status: a label and glyph for the phase in a polite live region, so each change
 * is announced without moving focus, and a Retry button after a failed save.
 */
export declare function SaveStatus({ phase, labels, onRetry, hideSavedAfter, className, ...rest }: SaveStatusProps): import("react").JSX.Element;
//# sourceMappingURL=save-status.d.ts.map