---
'@flamboyantengineer/ui-components': patch
---

`downloadUrl` compares the resolved URL with the page's own origin rather than its base URL's, so under a cross-origin `<base>` a relative link is refused and an absolute link to the page's origin downloads.
