---
'@flamboyantengineer/ui-components': patch
---

`sanitizeHtml` and `HtmlMarkup` no longer throw on tag names an ordinary object inherits, such as `<constructor>` or `<__proto__>` inside an open element; they are unwrapped like any other unknown element, keeping their content.
