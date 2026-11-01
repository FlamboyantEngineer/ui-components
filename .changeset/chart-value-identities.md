---
'@flamboyantengineer/ui-components': patch
---

Chart values are keyed by their series' typed `id` and their place (a bar's category, a line point's x, a donut segment's `id`) instead of their position, so focus, the tab stop and the tooltip stay on the same value when series reorder or values are added before it.
