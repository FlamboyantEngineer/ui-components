import { type CopyOptions } from './clipboard.js';
/** The outcome of the last copy, until `timeout` returns it to `idle`. */
export type CopyStatus = 'idle' | 'copied' | 'failed';
export interface ClipboardOptions extends CopyOptions {
    /** How long `copied` or `failed` lasts, in milliseconds. Defaults to 2000. */
    timeout?: number | undefined;
}
export interface ClipboardState {
    /** Copies `text` with `copyText` and resolves whether it reached the clipboard. */
    copy: (text: string) => Promise<boolean>;
    status: CopyStatus;
    /** Returns to `idle` at once. */
    reset: () => void;
}
/** How long the outcome of a copy shows before it returns to idle. */
export declare const DEFAULT_COPY_TIMEOUT = 2000;
/**
 * Copies text and keeps the outcome as `status` (`copied` or `failed`) for `timeout` milliseconds,
 * for feedback such as a check mark. A new copy restarts the timeout; unmounting clears it.
 */
export declare function useClipboard({ timeout, clipboard, fallback, }?: ClipboardOptions): ClipboardState;
//# sourceMappingURL=use-clipboard.d.ts.map