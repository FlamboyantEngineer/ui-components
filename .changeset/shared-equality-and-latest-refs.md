---
'@flamboyantengineer/ui-components': patch
---

Share internal helpers instead of repeating them: measurements and state snapshots compare through one shallow-equality helper, components that read their latest props from effects and handlers use the shared latest-value hook, range limits use `clamp`, and the carousel and tab list share one reduced-motion check. Behaviour is unchanged.
