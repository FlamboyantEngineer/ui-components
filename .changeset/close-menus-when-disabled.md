---
'@flamboyantengineer/ui-components': patch
---

An open DropdownMenu (plain or split), ActionRow action menu or TransitionMenu now closes for good when its trigger turns disabled or pending, so its items choose nothing. MenuTrigger reports that close once through `onOpenChange(false)` and draws a controlled menu closed while disabled.
