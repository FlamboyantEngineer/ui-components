---
'@flamboyantengineer/ui-components': minor
---

Simplify tree selection and filtering, large tag entry, JSON validation and formatting, code-editor decoration lookup, transfer-list calculations, zoom steps, and shared asynchronous state. Correct disabled tab and selection interactions, focus-open completion menus and their scrolling, breadcrumb callbacks, PDF zoom shortcuts and interrupted pinches, read-only rich-text insertion, controlled numeric display, and stale clipboard feedback. Preserve typed collection identities across rendering, selection, editing, and movement. Correct documentation to match control behavior and add regression coverage for boundary cases.

Breaking before 1.0: generated completion option IDs now encode the type of their keys; derive them with `getCompletionOptionId` instead of constructing the ID. Code completions interpret snippet fields only in `insertText`, while labels remain literal; escape a dollar, closing brace, or backslash with a backslash inside snippets. Collection-generated DOM IDs and `data-key` values may change; public IDs and callback values retain their original types. Table group keys escape path separators and avoid caller row IDs; treat the returned group keys as opaque when storing expansion state.
