---
'@flamboyantengineer/ui-components': patch
---

`InlineTextField` commits once on Enter and nothing after Escape when the host moves focus inside `onCommit` or `onCancel`, and lets Tab reach the host from a field in another window. Scroll-close guards and scroll measuring walk across shadow roots of another window.
