---
'@flamboyantengineer/ui-components': patch
---

With `headingIdPrefix`, a Markdown link to a percent-encoded heading fragment, such as `#%E6%9D%B1%E4%BA%AC` for `東京` or `#caf%C3%A9` for `cafe`, now points to the heading's prefixed id. A fragment is decoded once, malformed escapes are left as written, and links to other fragments are unchanged.
