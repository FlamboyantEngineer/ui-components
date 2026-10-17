# Clipboard

Copy utilities in `src/utils/clipboard.ts`. They use the asynchronous Clipboard API and fall back to a selection copy where that API is missing (insecure origins, older browsers) or refuses. Callers show their own success or failure feedback from the result, or keep it for a while with `useClipboard` (`src/utils/use-clipboard.ts`), which [Copy Button](COPY-BUTTON.md) builds on.

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

## UIC-CLIPBOARD-2 - Copy feedback

### UIC-CLIPBOARD-2.1 - Copied state with a timeout

`useClipboard({ timeout })` shall return `copy(text)`, which copies with `copyText` (taking its `clipboard` and `fallback` options) and resolves whether the text reached the clipboard, and `status`: `copied` after a successful copy, until `timeout` milliseconds (2000 by default) after the last copy, then `idle`. A new copy restarts the timeout, and `reset()` returns to `idle` at once.

Implementation: `src/utils/use-clipboard.ts`
Verification: `src/utils/use-clipboard.test.ts`, `src/components/copy-button/copy-button.test.tsx`

### UIC-CLIPBOARD-2.2 - Refused copies and unmounting

A copy that does not reach the clipboard shall set `status` to `failed` for the same timeout. Unmounting clears the pending timeout, and a copy that settles after unmounting changes nothing.

Implementation: `src/utils/use-clipboard.ts`
Verification: `src/utils/use-clipboard.test.ts`
