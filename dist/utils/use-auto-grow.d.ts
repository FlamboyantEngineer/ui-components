import { type RefObject } from 'react';
export interface AutoGrowOptions {
    /** The rows the text area shows at least. Defaults to one. */
    minRows: number | undefined;
    /** The rows it grows to at most before it scrolls. Defaults to no limit. */
    maxRows: number | undefined;
    /** The text, which it measures again whenever it changes. */
    value: string;
}
/** Whether a text area grows with its text: when either row limit is set. */
export declare function isAutoGrowing({ minRows, maxRows }: Pick<AutoGrowOptions, 'minRows' | 'maxRows'>): boolean;
/**
 * Grows a text area with its text between `minRows` and `maxRows` (one row and no limit by default),
 * when either is set. Past `maxRows` the text area scrolls. A new width (a stylesheet or font that
 * loads late, a resized container) wraps the text anew, so it measures again.
 */
export declare function useAutoGrow(area: RefObject<HTMLTextAreaElement | null>, options: AutoGrowOptions): void;
//# sourceMappingURL=use-auto-grow.d.ts.map