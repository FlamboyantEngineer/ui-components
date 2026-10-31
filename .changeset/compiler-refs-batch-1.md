---
'@flamboyantengineer/ui-components': patch
---

Components no longer read or write refs while rendering in the first set of places the React Compiler's `refs` rule reports. "Latest value" refs are now updated in a layout effect (`useLatest`). Values that keep their identity while equal use a new internal `useEqualValue` hook built on state. Merged refs come from a new internal `useMergedRefs` callback hook. Hook models that carry refs are destructured before rendering. Behaviour is unchanged.
