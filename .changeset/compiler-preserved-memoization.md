---
'@flamboyantengineer/ui-components': patch
---

The annotation layer, chat message actions menu, field state, list navigation, PDF links and tab menu keep memoisation the React Compiler can preserve: refs read in callbacks are named as refs and the message menu merges its target's ref through `useForwardedRef`, so a host compiling with the React Compiler no longer skips these components.
