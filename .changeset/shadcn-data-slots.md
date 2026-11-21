---
'@flamboyantengineer/ui-components': minor
---

Components that match a shadcn/ui component now mark their root and matching parts with shadcn/ui's `data-slot` names beside the `ui-*` classes (`data-slot="dialog-content"`, `"card-title"`, `"tabs-trigger"`…), so selectors written for shadcn/ui markup apply. `createHooks` takes the names as a third argument; a caller's `data-slot`, or a part class in the caller's `className`, names a composed part. Spec hook tables list each name in the Values column of its root or slot row, and `expectHooksMatchSpec` checks them.
