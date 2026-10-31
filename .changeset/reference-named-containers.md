---
'@flamboyantengineer/ui-components': patch
---

The reference stylesheet names every container it establishes (`ui-list-row`, `ui-property-panel`, `ui-segmented-bar`, `ui-steps`, `ui-icon-label`) and every container query names the container it reads, so a nested list row no longer reacts to its panel. A collapsible Icon Label is now its own container: it hides its text when its own room is under 8rem, so `collapsible` works without an ancestor container.
