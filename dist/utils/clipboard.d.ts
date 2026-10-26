/** The parts of `navigator.clipboard` the copy helpers use. */
export interface ClipboardWriter {
    writeText?(text: string): Promise<void>;
    write?(items: never[]): Promise<void>;
}
export interface CopyOptions {
    /** The clipboard to write to. Defaults to `navigator.clipboard`; `null` skips the asynchronous API. */
    clipboard?: ClipboardWriter | null | undefined;
    /**
     * Copy through a temporary selection and `document.execCommand('copy')` when the asynchronous API
     * is missing or refuses. Defaults to true.
     */
    fallback?: boolean | undefined;
}
export interface RichCopyOptions extends CopyOptions {
    /** The `ClipboardItem` constructor. Defaults to the global one. */
    ClipboardItem?: (new (items: Record<string, Blob>) => unknown) | undefined;
    /** Copy the plain text when the rich write is refused, instead of reporting the refusal. */
    fallbackOnRichFailure?: boolean | undefined;
}
/** How a rich copy reached the clipboard: both formats, plain text only, or not at all. */
export type RichCopyResult = 'rich' | 'text' | 'failed';
/**
 * Copies plain text, exactly as given. Resolves true once the clipboard holds it and false when
 * there is nothing to copy or every way was refused.
 */
export declare function copyText(text: string, options?: CopyOptions): Promise<boolean>;
/**
 * Copies text with an HTML version, so rich editors paste the HTML and plain fields the text.
 * Without `ClipboardItem` support it copies the plain text; a refused rich write is reported as
 * `failed` unless `fallbackOnRichFailure` is set.
 */
export declare function copyRichText(content: {
    text: string;
    html: string;
}, options?: RichCopyOptions): Promise<RichCopyResult>;
//# sourceMappingURL=clipboard.d.ts.map