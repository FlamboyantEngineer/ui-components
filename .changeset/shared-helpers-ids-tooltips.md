---
'@flamboyantengineer/ui-components': patch
---

Components share one `joinIds` for ARIA reference lists, one manually driven tooltip state and panel (relative time and truncation tooltips), the link renderer (Breadcrumb), `isEmptyNode` with a blank-text option (UserIdentity) and `getToneGlyph` in core (Banner, InlineError, Toast). Reference lists that end up empty are no longer rendered as empty attributes.
