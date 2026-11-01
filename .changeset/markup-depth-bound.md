---
'@flamboyantengineer/ui-components': patch
---

HtmlMarkup, SvgMarkup and Markdown draw at most 256 levels of nested elements (`maxMarkupDepth`): deeper elements are unwrapped and their content kept in order, so deeply nested input no longer overflows the call stack while React mounts it.
