---
'@flamboyantengineer/ui-components': minor
---

Rich-text editors are assembled from extensions. A `RichTextExtension` contributes node and mark types (placed by `order`), engine plugin contributions (run by `priority`, optionally gated per editor), node views and mark views, and names the extensions it requires. `createRichTextKit` assembles extensions into a `RichTextKit` (one schema, the plugin order and the merged views) and fails early on duplicate names or missing requirements, without reading the DOM. `createRichTextSchema` takes `extensions` beside the built-in `base` and `editing` extensions, `getRichTextKit` returns a schema's kit, and `RichTextEditor` runs an extension's plugins and renders its views.
