# Clipboard

Copy utilities in `src/utils/clipboard.ts`. They use the asynchronous Clipboard API and fall back to a selection copy where that API is missing (insecure origins, older browsers) or refuses. Callers show their own success or failure feedback from the result.

## UIC-CLIPBOARD-1 - Copying

### UIC-CLIPBOARD-1.1 - Plain text

`copyText` shall write its text, whitespace included, through the clipboard's `writeText` (`navigator.clipboard` unless `clipboard` is given) and resolve true only after the write succeeds. Empty text resolves false without writing.

Implementation: `src/utils/clipboard.ts`
Verification: `src/utils/clipboard.test.ts`

### UIC-CLIPBOARD-1.2 - Selection fallback

When the Clipboard API is missing or refuses, `copyText` shall copy through a temporary, off-screen and hidden buffer that it selects before running the browser's copy command, supplying the exact text to the copy event. It removes the buffer, restores the previous selection and focus, and resolves with the command's result. `fallback: false` turns the fallback off, and without a document it resolves false.

Implementation: `src/utils/clipboard.ts`
Verification: `src/utils/clipboard.test.ts`

### UIC-CLIPBOARD-1.3 - Rich text

`copyRichText` shall write plain text and HTML together through `ClipboardItem` and resolve `rich`. Without `ClipboardItem` support it writes the plain text and resolves `text`; a refused rich write resolves `failed` unless `fallbackOnRichFailure` is set, which writes the plain text instead. When no Clipboard API write succeeds, the selection fallback supplies both formats and resolves `rich`, or `failed` when it cannot copy.

Implementation: `src/utils/clipboard.ts`
Verification: `src/utils/clipboard.test.ts`
