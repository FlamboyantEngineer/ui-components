---
'@flamboyantengineer/ui-components': patch
---

Following an `Outline` entry scrolls only the `viewportRef` element and the scrollers inside it, so the page and outer scrollers stay where they are. The scroll keeps the heading's `scroll-margin-top`, follows the scroller's `scroll-behavior` and stays correct under an ancestor scale.
