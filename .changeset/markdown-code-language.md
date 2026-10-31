---
'@flamboyantengineer/ui-components': patch
---

MARKDOWN.md now states that a Markdown code block publishes its language only as `data-language` on `<pre>`, without the `language-<x>` class on `<code>`, and points hosts that highlight code to `createCodeBlockOverride` or `renderNode`.
