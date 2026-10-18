---
'@flamboyantengineer/ui-components': minor
---

Add Markdown and HTML Markup readers.

- `Markdown` (new): renders Markdown from `source` (text, or a document `parseMarkdown` returned), with `headingIdPrefix` for heading ids and in-page links, and `renderNode(node, children)` to replace any node (code highlighting, diagrams, image sources). Tables render through `ProseTable`, links through `Link` (absolute URLs open in a new tab), task items as read-only `Checkbox`es, thematic breaks as `Separator`s and text through `TextMatch`. Raw HTML stays text. Hooks: `ui-markdown`, `__code-block`, `__code`, `__task`, `__image`, `data-language`.
- `parseMarkdown` (new): a dependency-free, DOM-free parser for CommonMark blocks and inlines plus tables, task lists and strikethrough, returning a frozen tree (`MarkdownDocument` and the `Markdown*` node types); unsafe link and image URLs keep only their text. `listMarkdownHeadings(document, prefix)` lists the headings for `Outline`.
- `HtmlMarkup` (new): renders an HTML fragment (`markup`) as React elements without `innerHTML`, through an allowlist `policy`, with links drawn by the provider's link renderer, text through `TextMatch`, and `renderElement(element, children)` overrides. Hook: `ui-html-markup`.
- `sanitizeHtml` and `defaultHtmlPolicy` (new): a DOM-free allowlist sanitizer returning a frozen tree; scripts, styles, frames, objects and form fields are dropped, other unknown elements unwrapped, handlers, inline styles, unsafe URLs and `ui-` classes removed, and new-tab links given a safe `rel`.
- `isSafeUrl` and `defaultUrlSchemes` (new utilities): the URL scheme check both readers use.
- `SvgMarkup`'s parser now shares the library's markup tokenizer; it decodes the common HTML named entities (such as `&nbsp;`) besides the XML ones. No API change.
