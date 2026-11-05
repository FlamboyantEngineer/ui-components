# Math Preview

`MathPreview` typesets LaTeX source as MathML, and `MathField` pairs a source editor with a live preview. They load from their own entry point, `@flamboyantengineer/ui-components/math-preview`, and typeset with [KaTeX](https://katex.org), an optional peer that the default renderer imports the first time it typesets; the package root does not export them, so hosts that use no math need no KaTeX. A host may pass its own `renderer`. The host owns inserting math into a document, its transactions, equation numbering, storing the source and its dialogs.

## UIC-MATH-PREVIEW-1 - Preview

### UIC-MATH-PREVIEW-1.1 - Typesetting

`MathPreview` shall render a `<span>` (`ui-math-preview`) that publishes `data-display` (`inline` by default, or `display`) and `data-status`: `empty` for blank source, `pending` while the renderer works, `ready` with the math in `ui-math-preview__math`, and `invalid` when the source does not typeset. Display math is a MathML `<math display="block">`; inline math sits in its line of text. While nothing has typeset yet, `ui-math-preview__pending` holds the provider string `mathPending`.

Implementation: `src/components/math-preview/math-preview.tsx`, `src/components/math-preview/math-render.ts`
Verification: `src/components/math-preview/math-preview.test.tsx`, `e2e/math-preview.spec.ts`

### UIC-MATH-PREVIEW-1.2 - Invalid source

A source that does not typeset shall show the renderer's message in `ui-math-preview__error`, followed by the source as written in `ui-math-preview__source`. A source longer than `maxLength` characters (10000 by default) is not typeset; its error is the provider string `mathTooLong`. A renderer that throws or rejects shows its error's message.

Implementation: `src/components/math-preview/math-preview.tsx`, `src/components/math-preview/math-render.ts`
Verification: `src/components/math-preview/math-preview.test.tsx`, `e2e/math-preview.spec.ts`

### UIC-MATH-PREVIEW-1.3 - Latest source wins

Each new source or display shall typeset again. An answer for an older source, or one that arrives after unmounting, is dropped, so out-of-order answers never replace a newer preview. While newer source typesets, the last typeset math stays shown and the root publishes `data-stale="true"`. Each preview holds its own state, so several on a page are independent.

Implementation: `src/components/math-preview/math-render.ts`
Verification: `src/components/math-preview/math-preview.test.tsx`

### UIC-MATH-PREVIEW-1.4 - Safe rendering

A renderer (`MathRenderer`) shall turn source into `{ ok: true, mathml }` or `{ ok: false, message }`, and the preview renders the markup only through an allow-list: MathML Core elements (`math`, `mrow`, `mi`, `mn`, `mo`, `mfrac`, `msqrt`, `mtable` and the rest of the presentation set, `semantics` and `annotation`) and their presentation attributes become React elements. Any other element is dropped with its content, and so are other attributes, including `href`, `style`, `class` and event handlers; `mathcolor` and `mathbackground` take colour names or hex values only. There is no raw-markup escape hatch. The default renderer, `renderKatexMath`, typesets to MathML only with KaTeX's `trust` off, so `\href`, `\url`, `\includegraphics` and HTML commands render nothing active and show as their source in the text colour, and bounds sizes (`maxSize` 50 em) and macro expansions (`maxExpand` 500) so a short source cannot grow without end.

Implementation: `src/components/math-preview/math-markup.tsx`, `src/components/math-preview/katex-renderer.ts`
Verification: `src/components/math-preview/math-markup.test.tsx`, `src/components/math-preview/katex-renderer.test.ts`

### UIC-MATH-PREVIEW-1.5 - Entry point and caller attributes

The math components shall load only from the `math-preview` entry point, which alone imports KaTeX, and only when the default renderer first typesets. `MathPreview` appends the caller's `className` and forwards `id`, `ref` and caller `data-*` attributes to its root.

Implementation: `src/components/math-preview/index.ts`, `package.json`
Verification: `test/package.test.ts`, `src/components/math-preview/math-preview.test.tsx`

## UIC-MATH-PREVIEW-2 - Math field

### UIC-MATH-PREVIEW-2.1 - Source and preview

`MathField` shall render a `Field` whose root also carries `ui-math-field` and publishes `data-display` (`display` by default) and `data-status`. Its control is a `CodeEditor` surface (`ui-math-field__editor`) without line numbers that wraps long lines and highlights commands, braces, scripts and digits; below it a group named by the provider string `mathPreview` (`ui-math-field__preview`) holds a `ui-math-preview` of the source, which describes the editor. Typing, deleting and input-method composition happen in the editor alone: the preview never changes the source, the caret, the selection or focus.

Implementation: `src/components/math-preview/math-field.tsx`
Verification: `src/components/math-preview/math-field.test.tsx`, `e2e/math-preview.spec.ts`

### UIC-MATH-PREVIEW-2.2 - Commit, restore and errors

The source shall follow the field's value contract (`value`/`defaultValue`/`committedValue` with `onChange` and `onCommit`, UIC-FIELD-1). Enter breaks the line; focus leaving the field commits, and Escape on a changed source restores the committed source and goes no further, unless an input method is composing. When the source does not typeset, the reason is announced through a visually hidden status (`ui-math-field__status`, `role="status"`). `isReadOnly` and `isDisabled` lock the editor as for every field.

Implementation: `src/components/math-preview/math-field.tsx`
Verification: `src/components/math-preview/math-field.test.tsx`, `e2e/math-preview.spec.ts`

## Hooks

| Hook                       | Kind      | Values                                 | Description                                              |
| -------------------------- | --------- | -------------------------------------- | -------------------------------------------------------- |
| `ui-math-preview`          | root      |                                        | The preview.                                             |
| `ui-math-preview__math`    | slot      |                                        | The typeset MathML.                                      |
| `ui-math-preview__pending` | slot      |                                        | The note shown before anything has typeset.              |
| `ui-math-preview__error`   | slot      |                                        | Why the source does not typeset.                         |
| `ui-math-preview__source`  | slot      |                                        | The source as written, after an error.                   |
| `ui-math-field`            | root      |                                        | The math field (also `ui-field`).                        |
| `ui-math-field__editor`    | slot      |                                        | The source editor (also `ui-code-editor`).               |
| `ui-math-field__preview`   | slot      |                                        | The group holding the field's preview.                   |
| `ui-math-field__status`    | slot      |                                        | The visually hidden announcement of a typesetting error. |
| `data-display`             | attribute | `inline`, `display`                    | On a preview or field root: how the math is set.         |
| `data-status`              | attribute | `empty`, `pending`, `ready`, `invalid` | On a preview or field root: where the preview stands.    |
| `data-stale`               | state     | `true`                                 | On a preview: the math shown is for older source.        |
