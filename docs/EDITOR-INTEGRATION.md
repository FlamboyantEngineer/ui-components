# Editor integration

Use one installation of `@flamboyantengineer/ui-components` for the editor controls and the surrounding interface. Place them beneath the same `UiProvider` when they share messages, locale, icons, links or storage. Do not bundle a private copy of the provider into an adapter. `react`, `react-dom` and the rich-text peers also belong to the consumer's shared dependency graph.

## Supported dependency set

The following exact set supports strict npm peer resolution with the current package:

| Package                             | Version  |
| ----------------------------------- | -------- |
| `react`, `react-dom`                | `19.2.7` |
| `@handlewithcare/react-prosemirror` | `3.3.0`  |
| `react-reconciler`                  | `0.33.0` |
| `prosemirror-view`                  | `1.42.3` |

Install the remaining `prosemirror-*` peers listed in `package.json` in their supported ranges. The React peer range also supports later compatible React 19 releases; the table is a reproducible consumer set, not a new minimum requirement. The binding is optional unless an imported entry requires rich text. Older binding releases outside the declared peer range are unsupported.

The binding requires **exactly** `prosemirror-view@1.42.3`. Version `3.3.0` and upstream main commit `23380c2d5ac00108de6f3cbf2753a18278188e81` both declare this requirement. A consumer requiring `prosemirror-view@1.42.6` needs an upstream binding release that explicitly accepts that version, followed by coordinated library peer updates and runtime verification. Widening only this package's peer range cannot satisfy the binding's exact peer requirement. `--force`, `--legacy-peer-deps`, nested view copies and dependency overrides do not establish a supported set.

Validate a release set by installing built package tarballs into an empty consumer with normal `npm install` and then `npm ci`. Run `npm ls react react-dom @handlewithcare/react-prosemirror prosemirror-model prosemirror-state prosemirror-view` and confirm that every library resolves the same instance. Render a rich editor as well as checking dependency resolution: a successful install alone does not exercise the view lifecycle. `npm run check:git-install` performs strict install and rendering checks for this package at its minimum peer versions.

## Public entry points

Import components from their focused entry points, such as `/code-editor`, `/tree`, `/dialog`, `/user-identity`, `/hover-card/preview` and `/segmented-choice`. These do not require the rich-text peers. `/rich-text-editor`, `/message-composer/rich`, `/comment-composer/rich` and the complete `/chat` entry require them. The focused chat entries described in the README remain independent of the rich editor. The server-safe `/rich-text-editor/kit` entry exports `createRichTextKit` and its extension types for shared schema composition; it uses `prosemirror-model` without loading the React view binding.

Load `/reference.css` once to opt into the common reference styling, and optionally `/fonts.css` to bundle the self-hosted font faces. Neither is imported by component JavaScript. Source components expose the hooks in their specs; consumer rules can override the `ui-reference` cascade layer. Editor packages can add their own optional reference stylesheets using these shared controls and tokens without copying the controls or loading another font bundle.

## Supported compositions

A query uses `CodeEditor` with `tokenize` (or `language`/`syntax`), `completions`, `diagnostics` and `onSubmit(value)`. The completion source may be asynchronous; the editor discards stale responses, keeps focus and handles acceptance before submission. Enter submits a single line; Ctrl/Cmd+Enter submits a multiline source. The callback never receives an input-method acceptance key. The consumer supplies language analysis and execution policy; it does not need to reproduce completion keyboard handling. For asynchronous execution, keep the result and pending state with the operation, and use a pending `Button` or an async `Dialog` action where confirmation is needed.

Collection management uses `Tree` with `onRename` and a `Dialog` primary action for creation or removal. Return the operation's promise and reject with an `Error` on failure. The controls own pending interaction, visible rejection feedback and focus restoration; retain authoritative collection data and naming policy with the operation. Close the modal only after acceptance. The collection lab demonstrates these contracts without a separate collection manager.

Identity previews compose `UserIdentity` with `PreviewTrigger` from `/hover-card/preview`; use `Card` and `DescriptionList` for preview content. The trigger owns press, hover, keyboard dismissal and overlay focus behavior. Counted exclusive or multiple filters use `SegmentedChoice` options with `count`, `countMax` and `showZero`; its promise-returning `onChange` owns pending selection and restores the previous value on rejection. Use `FilterBar` for structured predicates and `PropertyPanel` search for property discovery.

Use `Label` for icon and text, `ToolbarRow` with overflow for horizontal controls, and `Breadcrumb` or `formatPath` for locations. A grid editor owns its address, formula draft and evaluation contract and can compose these public controls. See [Host compositions](HOST-COMPOSITIONS.md) for complete examples and the component specs for hooks and callback semantics.
