---
'@flamboyantengineer/ui-components': minor
---

`Card` gains collapse and an adaptive presentation:

- **Collapse.** `isCollapsible` draws a "Details" toggle. State comes from `isExpanded`, `defaultExpanded` and `onExpandedChange`, and `isToggleDisabled` disables the toggle. The toggle shows and hides the media, body and footer while keeping them mounted.
- **New regions.** `leading`, `meta` and `summary` (a preview shown while collapsed) are new header regions.
- **Adaptive presentation.** `presentationSteps` sets the card's `compact` and `minimal` breakpoints (by width, height or both; no defaults). The card measures the space it is given against them and publishes `data-presentation` (`full`, `compact` or `minimal`). Smaller presentations move secondary regions, actions and the toggle into a More popover, and the minimal one shows just a few characters (`abbreviation`). Every action stays reachable, and the card keeps its full accessible name.
