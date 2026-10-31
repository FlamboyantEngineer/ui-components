---
'@flamboyantengineer/ui-components': minor
---

Export every type a public prop uses: `BreadcrumbOverflow`, `PendingChangeHandler`, `ViewActionHandlers`, `LinkRenderState`, `Completions`, `TableValueColumn`, the folder selection types and the remaining PDF engine types. `check:public-types` now fails when an exported type names a library type that no entry point exports.
