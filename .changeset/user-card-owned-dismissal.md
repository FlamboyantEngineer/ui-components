---
'@flamboyantengineer/ui-components': patch
---

`UserCard` actions close only the card a `UserCardTrigger` opened, in press and hover modes, reporting the close through `onOpenChange` and returning focus to the trigger. A card rendered in place, such as inside a modal, no longer closes that modal or takes focus as a dialog.
