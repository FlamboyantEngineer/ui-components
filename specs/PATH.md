# Path

`Path` shows one location (a folder, a file, a destination) as a single line of text that a stylesheet truncates from the start, so the final label stays visible, and shows the whole path in a tooltip while it is cut. It adds no link, tab stop or landmark; a linked trail of ancestors is a [Breadcrumb](BREADCRUMB.md). The text comes from `formatPath`, which hosts can also call directly, and `formatFolderPath` resolves a folder's path in a flat catalog.

## UIC-PATH-1 - Formatting

### UIC-PATH-1.1 - Joining labels

`formatPath` shall join the nonblank, trimmed labels of a path with `/`, without surrounding spaces. A string is split on `/`, so empty segments disappear; array entries stay whole, keeping slashes inside labels such as URLs or file names. It neither escapes nor rewrites labels and never changes its input.

Implementation: `src/utils/path.ts`
Verification: `src/utils/path.test.ts`

### UIC-PATH-1.2 - Rooted and empty paths

With `rooted`, `formatPath` shall start the text with `/`, and an empty rooted path shall read `/`. An empty relative path shall read as empty, unless `emptyLabel` supplies the text for a path with no labels.

Implementation: `src/utils/path.ts`
Verification: `src/utils/path.test.ts`

### UIC-PATH-1.3 - Folder paths

`formatFolderPath` shall return the rooted path of a folder in a flat catalog of `{ id, parentId, name, path? }` entries. A folder's own nonblank `path` is used as given (normalized as a rooted path). Otherwise it walks parent ids upwards, keeps the known part when an ancestor is missing, stops before repeating a folder in a cycle and shows a blank name as the folder's id. An absent or unknown folder reads `rootLabel` (`/` by default).

Implementation: `src/utils/path.ts`
Verification: `src/utils/path.test.ts`

## UIC-PATH-2 - Component

### UIC-PATH-2.1 - Text

`Path` shall render its `path` as `formatPath` text inside a left-to-right isolate (`<bdi dir="ltr">`, the `ui-path__text` slot) within its root `<span>`, so the labels keep their reading order in any direction. A string path that starts with `/` is rooted. The complete text stays in the DOM; the component adds no link, tab stop, role or landmark.

Implementation: `src/components/path/path.tsx`
Verification: `src/components/path/path.test.tsx`, `e2e/path.spec.ts`

### UIC-PATH-2.2 - Start truncation

The root shall be one line that inherits the host's font and colour. The reference sheet clips an overflowing path at its start with an ellipsis, keeping the final label visible, and lets it shrink beside sibling actions in a row; a path that fits is not clipped.

Implementation: `src/components/path/path.tsx`, `labs/reference/path.css`
Verification: `e2e/path.spec.ts`

### UIC-PATH-2.3 - Visibility and announcements

`hidden` shall hide the path with the native `hidden` attribute. The path is quiet by default; a caller's `aria-live` (`polite` or `assertive`) announces changes to it.

Implementation: `src/components/path/path.tsx`
Verification: `src/components/path/path.test.tsx`

### UIC-PATH-2.4 - Hooks and caller attributes

`Path` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id`, `ref` and the other native `<span>` attributes to its root, except the pointer handlers the tooltip owns (`onPointerEnter`, `onPointerLeave`, `onPointerDown`).

Implementation: `src/components/path/path.tsx`
Verification: `src/components/path/path.test.tsx`

### UIC-PATH-2.5 - Full path in a tooltip

`Path` shall render its root as a [Truncation Tooltip](TRUNCATION-TOOLTIP.md), so while the stylesheet cuts the path, resting a mouse or pen on it (or keyboard focus on the nearest focusable element holding it) shows the whole path in a tooltip, in reading order inside the same isolate. A path that fits shows nothing. The tooltip is visual only: the full text is already in the page, so the path gets no description and never takes focus.

Implementation: `src/components/path/path.tsx`, `src/components/truncation-tooltip/truncation-tooltip.tsx`
Verification: `src/components/path/path.test.tsx`, `e2e/path.spec.ts`

## Hooks

| Hook            | Kind | Values | Description                                           |
| --------------- | ---- | ------ | ----------------------------------------------------- |
| `ui-path`       | root |        | The one-line `<span>` (also `ui-truncation-tooltip`). |
| `ui-path__text` | slot |        | The left-to-right isolate holding the text.           |
