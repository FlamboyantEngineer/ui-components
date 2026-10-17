# PDF Viewer

`PdfViewer` reads a PDF: it draws each page on a canvas with the page's text laid over it as a transparent, selectable text layer, and offers zoom with fit modes, page navigation and find in one toolbar above the pages. The PDF engine (pdf.js, the `pdfjs-dist` package, an optional peer dependency) is injected by the host through `loadEngine`, so the library never imports it and a host that shows no PDF never loads it. The viewer is data-driven: it takes a source and callbacks and calls no host service.

## UIC-PDF-VIEWER-1 - Document

### UIC-PDF-VIEWER-1.1 - Source and engine

`source` shall be the document's URL (a string or a `URL`) or its bytes (an `ArrayBuffer` or a `Uint8Array`). The viewer shall call `loadEngine` when a document starts loading and open the source with the engine's `getDocument`: a URL as `{ url }`, bytes as `{ data }` holding a copy, because the engine transfers the buffer it is given to its worker; the caller's array stays readable. A new source, including a new array with the same bytes, is a new document. The previous document's loading task shall be destroyed when the source changes and when the viewer unmounts, which also stops its worker. The engine is described by the structural `PdfEngine` type, which the `pdfjs-dist` module satisfies.

Implementation: `src/components/pdf-viewer/pdf-viewer.tsx`, `src/components/pdf-viewer/pdf-engine.ts`, `src/components/pdf-viewer/use-pdf-document.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/pdf-engine.test.ts`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-1.2 - Worker

`workerSrc` shall be set on the engine's `GlobalWorkerOptions` before it opens a document. Without it the engine keeps the worker the host configured.

Implementation: `src/components/pdf-viewer/use-pdf-document.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`

### UIC-PDF-VIEWER-1.3 - Loading

From the moment it has a source until the document has opened, the viewer shall publish `data-loading` and `aria-busy="true"` on its root, cover its stage with a [Loading Overlay](LOADING-OVERLAY.md) and disable its zoom and page controls. A `null` source shall keep the viewer loading without opening anything, for a host still fetching the bytes. A query typed meanwhile runs once the document has opened (UIC-PDF-VIEWER-5.2).

Implementation: `src/components/pdf-viewer/pdf-viewer.tsx`, `src/components/pdf-viewer/pdf-viewer-stage.tsx`, `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-1.4 - Error

When the engine cannot be loaded or the document cannot be opened, the viewer shall publish `data-error`, show an [Inline Error](INLINE-ERROR.md) with the provider's `documentFailed` string over its stage, and call `onError` with the error. The error's retry button loads the same source again.

Implementation: `src/components/pdf-viewer/use-pdf-document.ts`, `src/components/pdf-viewer/pdf-viewer-stage.tsx`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-2 - Pages

### UIC-PDF-VIEWER-2.1 - Page rendering

Each page shall be a `ui-pdf-viewer__page` element sized to the page at the applied zoom, where 100% shows the page at its printed size (96 CSS pixels per inch), holding a `ui-pdf-viewer__canvas` the engine draws into at the device pixel ratio, capped at 2²⁵ device pixels per page. Annotations and form fields shall not be drawn. Only pages within one screen of the view render; a page further away keeps its size but releases its bitmap and text layer, and every rendering page is drawn again when the zoom changes.

Implementation: `src/components/pdf-viewer/pdf-viewer-page.tsx`, `src/components/pdf-viewer/use-page-render.ts`, `src/components/pdf-viewer/use-near-pages.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/use-page-render.test.ts`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-2.2 - Text layer

Over each rendered page the engine shall build its text layer in `ui-pdf-viewer__text-layer`, from the same text content the find searches, so the page's text can be selected and copied where it appears on the canvas. The root publishes the scale, in CSS pixels per point, as `--ui-pdf-viewer-scale`. The engine positions each text run (an element with `role="presentation"`) as a percentage of the layer and sets its font height, horizontal stretch and rotation in the `--font-height`, `--scale-x` and `--rotate` custom properties, and the layer's `--min-font-size` and `data-main-rotation`; the host stylesheet turns these into transparent text over the canvas, as the reference sheet's text-layer rules do. The library loads no stylesheet for it.

Implementation: `src/components/pdf-viewer/use-page-render.ts`, `src/components/pdf-viewer/pdf-engine.ts`, `src/components/pdf-viewer/pdf-viewer.tsx`, `labs/reference/pdf-viewer.css`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-2.3 - Page scroller

The pages shall scroll in `ui-pdf-viewer__scroller`, a focusable `role="document"` element named by `aria-label` (the provider's `document` string by default), so the keyboard scrolls the document once it has focus. A new document starts at its first page.

Implementation: `src/components/pdf-viewer/pdf-viewer-stage.tsx`, `src/components/pdf-viewer/use-pdf-pages.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-3 - Zoom

### UIC-PDF-VIEWER-3.1 - Zoom control

The toolbar shall show a [Zoom Control](ZOOM-CONTROL.md) over a 25% grid from 25% to 1000%, displaying the applied zoom rounded to a whole percent. A step from any zoom, including one a fit mode resolved to, lands on the next grid level on that side. `onZoomChange` shall receive the applied zoom in percent whenever it changes once the document has opened.

Implementation: `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`, `src/components/pdf-viewer/pdf-zoom.ts`, `src/components/pdf-viewer/use-pdf-zoom.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/pdf-zoom.test.ts`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-3.2 - Fit modes

Fit page width and fit whole page shall be toggle buttons beside the zoom control (`fit-width` and `fit-page` glyphs, the provider's `fitWidth` and `fitPage` strings), pressed while their mode applies. Fitting the width fits the widest page into the page column's width and keeps the zoom between 50% and 200%; fitting the page fits the largest page whole into the column. The column is the scroller's client box less the padding of `ui-pdf-viewer__pages`. A fit is resolved again whenever the scroller changes size; a zoom chosen as a percentage is kept. `defaultZoom` (a percentage, `page-width` by default, or `page-fit`) is the zoom the viewer opens at.

Implementation: `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`, `src/components/pdf-viewer/pdf-zoom.ts`, `src/components/pdf-viewer/use-pdf-zoom.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/pdf-zoom.test.ts`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-3.3 - Reading position

A zoom change shall keep the reader's place: the page at the top of the view and the depth into it, and the horizontal centre of the view.

Implementation: `src/components/pdf-viewer/use-pdf-pages.ts`, `src/components/pdf-viewer/use-pdf-zoom.ts`
Verification: `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-3.4 - Wheel zoom

Ctrl or Command with the wheel over the pages shall step the zoom along the grid (up zooms in) and prevent the browser's own page zoom.

Implementation: `src/components/pdf-viewer/use-pdf-zoom.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-4 - Page navigation

### UIC-PDF-VIEWER-4.1 - Current page

The toolbar shall show the page the reader is on, the one filling most of the view, in a number field labelled with the provider's `page` string (`ui-pdf-viewer__page-field`), followed by the total (`ui-pdf-viewer__page-total`, the provider's `ofTotal` string).

Implementation: `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`, `src/components/pdf-viewer/use-pdf-pages.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-4.2 - Going to a page

Previous page and next page buttons (`chevron-up` and `chevron-down` glyphs) shall scroll to the neighbouring page and are disabled on the first and last page. A page number typed into the field and committed with Enter or by leaving it scrolls to that page, limited to the document's pages. A page lands where the first page sits at the top of the document.

Implementation: `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`, `src/components/pdf-viewer/use-pdf-pages.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-5 - Find

### UIC-PDF-VIEWER-5.1 - Matches

A search field labelled with the provider's `findInDocument` string (`ui-pdf-viewer__search-field`, a React Aria search field whose Escape key and clear button empty it) shall find the query in the text of every page, ignoring case; whitespace in the query matches any whitespace, including a line break, so a phrase is found across lines. Every match in a rendered text layer shall be wrapped in a `ui-pdf-viewer__match` element, the current match carrying `data-current`. Emptying the query removes the matches.

Implementation: `src/components/pdf-viewer/pdf-viewer-search.tsx`, `src/components/pdf-viewer/pdf-search.ts`, `src/components/pdf-viewer/highlights.ts`, `src/components/pdf-viewer/use-pdf-search.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/pdf-search.test.ts`, `src/components/pdf-viewer/highlights.test.ts`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-5.2 - Result count

Beside the field, a `role="status"` element (`ui-pdf-viewer__search-status`) shall report the current match and the total (`2 of 4`), the provider's `noResults` string once a query has no match, and its `searching` string while a query waits for the document or its text. A query typed while the document loads runs once it has opened.

Implementation: `src/components/pdf-viewer/pdf-viewer-search.tsx`, `src/components/pdf-viewer/use-pdf-search.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-5.3 - Stepping through matches

Previous match and next match buttons (`chevron-left` and `chevron-right` glyphs), and Enter and Shift + Enter in the field, shall step the current match backwards and forwards, wrapping at either end; the buttons are disabled without matches. A new query starts at the first match on or after the current page. The current match is brought into view: its page is scrolled to when it is not rendered, and the match is centred when it is not fully visible.

Implementation: `src/components/pdf-viewer/pdf-viewer-search.tsx`, `src/components/pdf-viewer/use-pdf-search.ts`, `src/components/pdf-viewer/pdf-viewer-page.tsx`, `src/components/pdf-viewer/use-pdf-pages.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `src/components/pdf-viewer/pdf-search.test.ts`, `e2e/pdf-viewer.spec.ts`

## UIC-PDF-VIEWER-6 - Toolbar

### UIC-PDF-VIEWER-6.1 - Toolbar

The controls shall sit above the pages in a [Toolbar Scroller](TOOLBAR-SCROLLER.md) named with the provider's `controlsFor` string (`Report controls`), in this order: zoom, fit modes, page navigation, find, then the caller's `actions` (`ui-pdf-viewer__actions`). The left and right arrow keys move focus along the toolbar; inside a text field they move the caret, and move focus only at the ends of the text.

Implementation: `src/components/pdf-viewer/pdf-viewer-toolbar.tsx`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`, `e2e/pdf-viewer.spec.ts`

### UIC-PDF-VIEWER-6.2 - Hooks and caller attributes

`PdfViewer` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/pdf-viewer/pdf-viewer.tsx`, `src/components/pdf-viewer/styling-hooks.ts`
Verification: `src/components/pdf-viewer/pdf-viewer.test.tsx`

## Hooks

| Hook                           | Kind     | Values                  | Description                                                       |
| ------------------------------ | -------- | ----------------------- | ----------------------------------------------------------------- |
| `ui-pdf-viewer`                | root     |                         | The viewer `<div>`.                                               |
| `ui-pdf-viewer__toolbar`       | slot     |                         | The toolbar's wrapper, around a Toolbar Scroller.                 |
| `ui-pdf-viewer__group`         | slot     |                         | The page navigation group and the find group.                     |
| `ui-pdf-viewer__page-field`    | slot     |                         | The page number field (React Aria `NumberField`).                 |
| `ui-pdf-viewer__page-label`    | slot     |                         | The page field's visible label.                                   |
| `ui-pdf-viewer__page-input`    | slot     |                         | The page field's `<input>`.                                       |
| `ui-pdf-viewer__page-total`    | slot     |                         | The page total after the field.                                   |
| `ui-pdf-viewer__search-field`  | slot     |                         | The find field (React Aria `SearchField`).                        |
| `ui-pdf-viewer__search-input`  | slot     |                         | The find field's `<input>`.                                       |
| `ui-pdf-viewer__search-clear`  | slot     |                         | The find field's clear button.                                    |
| `ui-pdf-viewer__search-status` | slot     |                         | The `role="status"` result count.                                 |
| `ui-pdf-viewer__actions`       | slot     |                         | The caller's actions at the end of the toolbar.                   |
| `ui-pdf-viewer__stage`         | slot     |                         | The positioned area under the toolbar.                            |
| `ui-pdf-viewer__scroller`      | slot     |                         | The focusable `role="document"` element the pages scroll in.      |
| `ui-pdf-viewer__pages`         | slot     |                         | The positioned page column; its padding is left free by the fits. |
| `ui-pdf-viewer__page`          | slot     |                         | One page, sized inline to the zoom.                               |
| `ui-pdf-viewer__canvas`        | slot     |                         | The page bitmap.                                                  |
| `ui-pdf-viewer__text-layer`    | slot     |                         | The engine's selectable text layer over the bitmap.               |
| `ui-pdf-viewer__match`         | slot     |                         | A find match inside a text run.                                   |
| `data-loading`                 | state    | `true`                  | The document has not opened yet.                                  |
| `data-error`                   | state    | `true`                  | The engine or the document could not be opened.                   |
| `data-current`                 | state    | `true`                  | On the current match.                                             |
| `data-main-rotation`           | state    | `0`, `90`, `180`, `270` | Set on the text layer by the engine: the page's rotation.         |
| `data-empty`                   | state    | `true`                  | The find field is empty (React Aria).                             |
| `data-disabled`                | state    | `true`                  | A field, input or the clear button is disabled (React Aria).      |
| `data-hovered`                 | state    | `true`                  | An input or the clear button is hovered (React Aria).             |
| `data-focused`                 | state    | `true`                  | An input or the clear button has focus (React Aria).              |
| `data-focus-visible`           | state    | `true`                  | An input or the clear button has keyboard focus (React Aria).     |
| `data-pressed`                 | state    | `true`                  | The clear button is pressed (React Aria).                         |
| `--ui-pdf-viewer-scale`        | property |                         | CSS pixels per point at the applied zoom, on the root.            |
