---
'@flamboyantengineer/ui-components': minor
---

Tooltips that only repeat a control's name attach one way. `ActionRow` actions show their tooltip through `Button`'s own `tooltip`, so the `ui-action-row__tooltip` slot is gone and the panel is a plain `ui-tooltip`. Icon-only `SegmentedChoice` segments and collapsed `NavigationRail` groups use `Tooltip`'s `relationship="label"`, which now keeps a trigger's own `aria-label` (such as a name with a count) while still adding no description.
