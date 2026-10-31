---
'@flamboyantengineer/ui-components': minor
---

`ActionRow` actions keep their own buttons as actions come, go and move. An action's `id` now identifies it rather than setting its button's DOM id: it is required on custom actions and defaults to the verb on standard ones, so a row with the same verb twice gives each an `id`. When the focused action leaves the row or collapses into the overflow menu, focus moves to the next button instead of falling to the page.
