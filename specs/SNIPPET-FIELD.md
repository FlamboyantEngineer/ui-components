# Snippet Field

`SnippetField` holds a code snippet taken from a source: the source's address as the host names it (a path, a URL, a record key), an optional range of lines, and the code as it was saved. The reader edits the source and lines, previews what the host's loader finds there, and saves it explicitly. It is a `Field` ([FIELD.md](FIELD.md)) with the field's label, validation, required, dirty and disabled states, restore, undo and menu, and it shows code through [Code Block](CODE-BLOCK.md). The host owns fetching, authorization, allowed sources, revisions and storage; the field fetches nothing itself.

## UIC-SNIPPET-FIELD-1 - Source and lines

### UIC-SNIPPET-FIELD-1.1 - Structure

`SnippetField` shall render a `Field` whose root also carries `ui-snippet-field`. Its control is the source input (`ui-snippet-field__source`), named by the field's label and showing `placeholder` while empty, in a row (`ui-snippet-field__request`) with two line inputs (`ui-snippet-field__line`, named by the provider strings `snippetStartLine` and `snippetEndLine`) and a Preview button (`ui-snippet-field__preview-button`, provider string `snippetPreview`). Below them the saved snippet shows as a `CodeBlock` (`ui-snippet-field__saved`) with line numbers, headed by its source and, for a range, the provider string `snippetLines`; without a saved snippet, `ui-snippet-field__empty` holds the provider string `snippetEmpty`. The Preview, Apply and Cancel buttons take the field's `size` (default `md`), so they stand as tall as the inputs beside them.

Implementation: `src/components/snippet-field/snippet-field.tsx`, `src/components/snippet-field/snippet-field-parts.tsx`
Verification: `src/components/snippet-field/snippet-field.test.tsx`, `e2e/snippet-field.spec.ts`

### UIC-SNIPPET-FIELD-1.2 - Line range

The lines shall be whole numbers counted from 1. Both blank takes the whole source; a single blank line input, a number below 1 or text that is not a whole number shows the provider string `snippetRangeIncomplete`, and a last line before the first shows `snippetRangeOrder`, in `ui-snippet-field__range-error`, which describes both line inputs and marks them invalid. Preview is disabled while the range is unreadable or the source is blank. A range past the source's end is the loader's to report.

Implementation: `src/components/snippet-field/snippet-request.ts`, `src/components/snippet-field/snippet-field.tsx`
Verification: `src/components/snippet-field/snippet-request.test.ts`, `src/components/snippet-field/snippet-field.test.tsx`

### UIC-SNIPPET-FIELD-1.3 - Value

The value shall be `{ source, lines, code, language }` or `null`, following the field's value contract (`value`/`defaultValue`/`committedValue`, `onChange`, `onCommit`, required and dirty state, UIC-FIELD-1). Typing in the source and line inputs edits a draft request only; the value changes only through Apply ([UIC-SNIPPET-FIELD-2.2](#uic-snippet-field-22---apply-and-cancel)) and the field's own restore, undo and menu actions. A new value from the caller starts the draft again from it.

Implementation: `src/components/snippet-field/snippet-field.tsx`
Verification: `src/components/snippet-field/snippet-field.test.tsx`

## UIC-SNIPPET-FIELD-2 - Preview

### UIC-SNIPPET-FIELD-2.1 - Loading

Preview shall call `loadSnippet({ source, lines }, { signal })`, with the source trimmed. The loader resolves `{ ok: true, code, language }` or `{ ok: false, message }`; a rejection reports its error's message. While it loads, the preview panel (`ui-snippet-field__preview`) shows the provider string `snippetLoading` in its status (`ui-snippet-field__status`, `role="status"`); a failure shows the message there. The panel and the root publish `data-status` (`loading`, `ready`, `error`). Each preview aborts the signal of the one before it, and so do Cancel, editing the source or lines, and unmounting: an answer for an aborted or replaced request never shows. A failed preview leaves the saved snippet as it was.

Implementation: `src/components/snippet-field/use-snippet-preview.ts`, `src/components/snippet-field/snippet-field.tsx`
Verification: `src/components/snippet-field/snippet-field.test.tsx`, `e2e/snippet-field.spec.ts`

### UIC-SNIPPET-FIELD-2.2 - Apply and cancel

A ready preview shall show its code in a `CodeBlock` with line numbers. Apply (`ui-snippet-field__apply`, provider string `snippetApply`) sets the value to the previewed request and code and commits it; Cancel (`ui-snippet-field__cancel`, provider string `cancel`) drops the preview and puts the saved source and lines back in the inputs. Either way focus returns to the source input. Apply is disabled while the preview is not ready, and while the field is read-only or disabled.

Implementation: `src/components/snippet-field/snippet-field.tsx`, `src/components/snippet-field/snippet-field-parts.tsx`
Verification: `src/components/snippet-field/snippet-field.test.tsx`, `e2e/snippet-field.spec.ts`

### UIC-SNIPPET-FIELD-2.3 - Stale snippets

Previewing the saved snippet's own source and lines shall compare the loaded code with the saved code. The same code shows the provider string `snippetUnchanged` and leaves Apply disabled. Different code means the source changed since the snippet was saved: the status shows `snippetStale`, the panel and the root publish `data-stale="true"`, and Apply reads `snippetUpdate`. The saved code is replaced only when the reader presses it.

Implementation: `src/components/snippet-field/snippet-field.tsx`, `src/components/snippet-field/snippet-field-parts.tsx`
Verification: `src/components/snippet-field/snippet-field.test.tsx`, `e2e/snippet-field.spec.ts`

### UIC-SNIPPET-FIELD-2.4 - Read-only, disabled and caller attributes

A read-only field shall keep its inputs readable but not editable and draw no Preview button; a disabled field disables its inputs and buttons. The field carries the hooks below on top of the field's own, appends the caller's `className`, and forwards `id` and caller `data-*` attributes to its root. Each field holds its own draft and preview, so several fields on a page are independent.

Implementation: `src/components/snippet-field/snippet-field.tsx`
Verification: `src/components/snippet-field/snippet-field.test.tsx`

## Hooks

| Hook                               | Kind      | Values                      | Description                                                |
| ---------------------------------- | --------- | --------------------------- | ---------------------------------------------------------- |
| `ui-snippet-field`                 | root      |                             | The field (also `ui-field`).                               |
| `ui-snippet-field__request`        | slot      |                             | The row of source and line inputs and the Preview button.  |
| `ui-snippet-field__source`         | slot      |                             | The source input, the field's control.                     |
| `ui-snippet-field__line`           | slot      |                             | A first-line or last-line input.                           |
| `ui-snippet-field__preview-button` | slot      |                             | The Preview button (also `ui-button`).                     |
| `ui-snippet-field__range-error`    | slot      |                             | Why the typed lines name no range.                         |
| `ui-snippet-field__saved`          | slot      |                             | The saved snippet's code block (also `ui-code-block`).     |
| `ui-snippet-field__empty`          | slot      |                             | The note that no snippet is saved.                         |
| `ui-snippet-field__preview`        | slot      |                             | The preview panel.                                         |
| `ui-snippet-field__status`         | slot      |                             | The preview's status text.                                 |
| `ui-snippet-field__apply`          | slot      |                             | The Apply or Update button (also `ui-button`).             |
| `ui-snippet-field__cancel`         | slot      |                             | The Cancel button (also `ui-button`).                      |
| `data-status`                      | attribute | `loading`, `ready`, `error` | On the root and the preview panel: the preview's state.    |
| `data-stale`                       | state     | `true`                      | On the root and the preview panel: the saved code changed. |
