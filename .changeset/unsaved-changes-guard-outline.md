---
'@flamboyantengineer/ui-components': minor
---

Add the unsaved changes guard family and the document outline.

- `UnsavedChangesGuard` (new): the one way to protect unsaved edits. Editors register with `useUnsavedChanges({ isDirty, label, onSave, onDiscard })`; code that leaves awaits `confirmLeave({ title, message })` from `useUnsavedChangesGuard()`, which also returns `isDirty`. While anything is dirty a `ConfirmDialog` offers Save (pending, open on failure), Discard and Stay (Discard and Stay when a dirty editor cannot save) and the browser confirms closing the page (`shouldConfirmUnload`). A guard inside another asks about its own editors and stands in its parent for them. Hooks: `ui-unsaved-changes-guard`, `__list`.
- `Outline` (new): a navigation landmark of nested heading links from `headings` (`id`, `label`, `level`), with the current heading from `currentId` or tracked in `viewportRef` by `useScrollSpy` (`trackingOffset`), `onNavigate` and scrolling to a followed heading, section toggles (`collapseBelowLevel`, `expandedKeys`, `defaultExpandedKeys`, `onExpandedChange`), numbering through `formatOutlineNumber` (`isNumbered`, `numberOptions`), and loading and empty notices (`isPending`, `emptyMessage`). Hooks: `ui-outline`, `__empty`, `__list`, `__item`, `__row`, `__link`, `__number`, `__label`, `data-numbered`, `data-pending`, `data-level`, `data-current`, `data-current-within`, `data-expanded`.
- `useScrollSpy` is also exported from the Scroll Region main module.
- Provider strings: `unsavedChanges`, `saveBeforeLeaving`, `discardBeforeLeaving`, `discard`, `stay` and `sectionsIn`.
