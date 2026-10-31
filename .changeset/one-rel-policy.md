---
'@flamboyantengineer/ui-components': patch
---

Links that open a new tab follow one `rel` policy: Button, ListRow and Card now add `noopener noreferrer` to a caller's `rel` (as Link and HtmlMarkup do) instead of replacing them. Rich text links no longer write `rel="noopener nofollow"`.
