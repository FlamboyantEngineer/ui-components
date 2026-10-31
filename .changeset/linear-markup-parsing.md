---
'@flamboyantengineer/ui-components': patch
---

`sanitizeHtml`, `HtmlMarkup`, `parseSvgMarkup`, `SvgMarkup`, `parseMarkdown` and `Markdown` (streaming included) now read untrusted input in time proportional to its length. Before, a tag that never ended, deep nesting with stray closing tags, unpaired emphasis markers, nested brackets or unclosed link destinations could block the main thread or a server for seconds. Streaming Markdown no longer hangs on a link whose destination holds a code span (`[a](`)`)`. Following CommonMark, a bare link destination nests parentheses at most 32 deep, and a reference label is at most 999 characters.
