---
'@flamboyantengineer/ui-components': patch
---

`Outline` and `useScrollSpy` look headings up in the viewport's shadow root when it sits in one, so an outline inside a web component tracks and jumps to its own headings instead of finding none or one with the same id outside.
