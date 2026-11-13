# Markdown

`Markdown` renders Markdown as React elements, for documentation pages, descriptions, comments and generated answers. `parseMarkdown` reads the text into a plain, frozen document tree without a dependency or the DOM, so it also runs on the server: CommonMark's blocks and inlines (headings, paragraphs, emphasis, code, lists, block quotes, links, images, thematic breaks) and three extensions, tables, task lists and strikethrough. Raw HTML is never interpreted; it shows as text. Tables render through [Prose Table](PROSE-TABLE.md), links through [Link](LINK.md), task items through a read-only [Checkbox](CHECKBOX.md), thematic breaks through [Separator](SEPARATOR.md) and text through [Text Match](TEXT-MATCH.md). Highlighting code and drawing diagrams stay with the caller, through `renderNode`, and ready-made overrides draw code through [Code Block](CODE-BLOCK.md) and citation markers through [Chat Sources](CHAT-SOURCES.md). A streaming mode renders an answer that is still arriving. Stored HTML is shown by [HTML Markup](HTML-MARKUP.md) instead.

## UIC-MARKDOWN-1 - Parsing

### UIC-MARKDOWN-1.1 - Document tree

`parseMarkdown(source)` shall return a frozen `MarkdownDocument` whose `children` are the blocks in source order, each node a plain object with a `type` (`heading`, `paragraph`, `codeBlock`, `blockquote`, `list`, `listItem`, `table`, `thematicBreak`; inline `text`, `inlineCode`, `emphasis`, `strong`, `strikethrough`, `link`, `image`, `lineBreak`). Lines end at `\n`, `\r\n` or `\r`, leading tabs count to the next multiple of four columns, and every construct the parser does not recognise is text. It never touches the DOM. Freezing and deferred inline collection shall use bounded appends and iterative walks, including deeply nested inline formatting.

Implementation: `src/components/markdown/parse-markdown.ts`, `src/components/markdown/markdown-nodes.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`

### UIC-MARKDOWN-1.2 - Headings

ATX headings (`#` to `######` followed by a space, an optional closing `#` sequence) and setext headings (paragraph lines underlined with `===` for level 1 or `---` for level 2) shall become `heading` nodes with their level and inline content. Each heading's `id` is a slug of its plain text (accents folded, lower case, every run of characters other than letters and digits one hyphen, `section` when nothing is left), suffixed `-2`, `-3`, … when an earlier heading of the document has the same slug. Repeated slugs shall resume from their next available suffix while still avoiding collisions with suffix-like source titles.

Implementation: `src/components/markdown/markdown-blocks.ts`, `src/components/markdown/markdown-headings.ts`, `src/components/markdown/markdown-lines.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`

### UIC-MARKDOWN-1.3 - Paragraphs and line breaks

Consecutive non-blank lines that start no other block shall form a `paragraph`, its lines joined by a newline in the text (a soft break, shown as a space) with their leading spaces removed. A line ending in two or more spaces or a backslash shall end in a `lineBreak`. A paragraph ends at a blank line or at a line that starts a heading, fence, block quote, thematic break, table or list (an ordered list only when it starts at 1); indented lines continue it.

Implementation: `src/components/markdown/markdown-blocks.ts`, `src/components/markdown/markdown-inlines.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`

### UIC-MARKDOWN-1.4 - Code blocks

Fenced code (three or more backticks or tildes, closed by a fence of the same character at least as long, or by the end of its container) and indented code (four columns) shall become `codeBlock` nodes holding their text verbatim, with a fence's indentation, or indented code's four columns, removed from its lines; blank lines inside indented code keep what is left of their whitespace. Tabs stay as written: where block structure is read, in quotes and list items too, a tab spans the columns to the next multiple of four, and a tab that removed indentation takes only in part leaves spaces for its remaining columns. `language` is the first word of the fence's info string, or `null`.

Implementation: `src/components/markdown/markdown-blocks.ts`, `src/components/markdown/markdown-lines.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`, `src/components/markdown/markdown-tabs.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-1.5 - Block quotes

Lines starting with `>` shall become a `blockquote` whose content is parsed as blocks, so quotes nest and hold any block. A line without the marker continues the quote only while the quote's last line leaves a paragraph open, nested quotes and list items included, and the line starts no other block (a lazy continuation); after a heading, a thematic break, a table, indented code or a fenced code block, open or closed, the quote ends and the line is read outside it. Five thousand nested block quotes shall parse without recursive calls. The parser opens block quotes and lists at most 256 deep (`maxMarkupDepth`, the depth the renderers draw); deeper markers stay paragraph text, so hostile nesting cannot make parsing explode. Deferred container frames retain depth-first source order for reference definitions, inline content and heading ids.

Implementation: `src/components/markdown/markdown-containers.ts`, `src/components/markdown/markdown-paragraph-state.ts`, `src/components/markdown/parse-markdown.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`, `src/components/markdown/markdown-lazy-continuation.test.ts`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-1.6 - Lists

Items marked `-`, `+` or `*`, or numbered with `.` or `)`, shall become `list` nodes of `listItem`s whose content (the lines indented to the item's content column, and lazy lines that continue a paragraph the item's last line leaves open, as for block quotes) is parsed as blocks, so lists nest. A change of bullet or delimiter starts a new list; an ordered list's `start` is its first number. A list is `tight` unless a blank line separates two items or two blocks of an item. A continuation may follow two hundred thousand blank lines without exceeding the function argument limit.

Implementation: `src/components/markdown/markdown-containers.ts`, `src/components/markdown/markdown-paragraph-state.ts`, `src/components/markdown/markdown-lines.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`, `src/components/markdown/markdown-lazy-continuation.test.ts`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-1.7 - Task lists

An item whose content starts with `[ ]`, `[x]` or `[X]` followed by a space and text shall be a task item, with `checked` `false` or `true` and the marker removed. Other items have `checked: null`.

Implementation: `src/components/markdown/markdown-containers.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`

### UIC-MARKDOWN-1.8 - Tables

A row of cells separated by `|` over a divider row with as many cells (`---`, `:---`, `:---:`, `---:`) shall become a `table` with the columns' `align` (`start`, `center`, `end` or `null`), the heading cells and the body rows that follow until a blank line or another block. Body rows are padded or cut to the number of columns, and `\|` is a pipe inside a cell. A table may interrupt a paragraph.

Implementation: `src/components/markdown/markdown-blocks.ts`, `src/components/markdown/markdown-lines.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`

### UIC-MARKDOWN-1.9 - Thematic breaks

A line of three or more `-`, `*` or `_` (spaces allowed between them) shall become a `thematicBreak`, unless it underlines a paragraph as a setext heading.

Implementation: `src/components/markdown/markdown-blocks.ts`, `src/components/markdown/markdown-lines.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`

### UIC-MARKDOWN-1.10 - Inline formatting

The inline parser shall read `*` and `_` runs into `emphasis` and `strong` nodes under CommonMark's flanking and delimiter rules (no emphasis inside words with `_`), `~` and `~~` runs into `strikethrough`, backtick runs into `inlineCode` (closed by a run of the same length), backslash escapes of ASCII punctuation into literal characters, and character references into their characters. An unclosed delimiter or backtick run stays text. A paragraph may contain a hundred thousand inline spans without exceeding the function argument limit.

Implementation: `src/components/markdown/markdown-inlines.ts`, `src/components/markdown/markdown-inline-syntax.ts`, `src/utils/markup.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`

### UIC-MARKDOWN-1.11 - Links and images

Inline links `[text](destination "title")`, reference links (`[text][label]`, `[label][]`, `[label]`) resolved against the document's `[label]: destination "title"` definitions (the first of a label wins, labels match ignoring case and spacing), autolinks (`<https://…>`, `<name@example.com>`) and images `![alt](source "title")` shall become `link` and `image` nodes. A link holds no other link; an image's `alt` is the plain text of its description. A bracket that matches no target stays text.

Implementation: `src/components/markdown/markdown-inlines.ts`, `src/components/markdown/markdown-inline-syntax.ts`, `src/components/markdown/markdown-blocks.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`

### UIC-MARKDOWN-1.12 - Safe content

Raw HTML shall stay text. A link whose destination is not relative or `http`, `https`, `mailto` or `tel` ([`isSafeUrl`](MARKUP.md#uic-markup-21---safe-urls)) shall be replaced by its content, and an image whose source is not relative or `http` or `https` by its alt text, so no `javascript:` or `data:` URL reaches the tree. An unsafe link with a hundred thousand inline spans shall preserve its formatted label through bounded appends.

Implementation: `src/components/markdown/markdown-inlines.ts`, `src/utils/safe-url.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`

### UIC-MARKDOWN-1.13 - Linear parsing

`parseMarkdown`, `parseStreamingMarkdown` and the streaming preparation shall take time about proportional to the source's length, whatever it holds, so authored content cannot stall a page or a server. Emphasis pairing follows CommonMark's delimiter algorithm, each closer searching back only as far as an earlier closer of the same kind found no opener; a link closing deactivates the brackets before it at once; a line's text is gathered without rereading earlier lines. Two CommonMark limits apply: a bare link destination nests parentheses at most 32 deep, and a link label (the text of a shortcut or collapsed reference) is at most 999 characters, beyond which the brackets are text. Within them no input is refused or cut short for its size. A closing `#` sequence of a heading is found by scanning back from the line's end, and a code span finds its closing run of equal length from one index of the text's backtick runs, so neither rescans a long line. Container lines are followed by measuring each line's indentation once for all the list items it continues. Table cell construction shall split each header and body row once and reuse its cells across columns. Including the constant scans for table recognition, table work is proportional to scanned row text plus produced cells; padding ragged rows can produce more cells than the source contains.

Implementation: `src/components/markdown/markdown-inlines.ts`, `src/components/markdown/markdown-emphasis.ts`, `src/components/markdown/markdown-inline-syntax.ts`, `src/components/markdown/markdown-streaming-inlines.ts`, `src/components/markdown/markdown-blocks.ts`, `src/components/markdown/markdown-lines.ts`, `src/components/markdown/markdown-paragraph-state.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`, `src/components/markdown/markdown-scaling.test.tsx`, `src/components/markdown/markdown-table-scaling.test.ts`, `src/components/markdown/markdown-tables.test.tsx`, `e2e/markdown.spec.ts`

## UIC-MARKDOWN-2 - Rendering

### UIC-MARKDOWN-2.1 - Elements

`Markdown` shall render `source` inside a `<div>` root, each node as its element: `<h1>`–`<h6>`, `<p>`, `<blockquote>`, `<ul>`, `<ol>` (with `start` when it is not 1), `<li>`, `<em>`, `<strong>`, `<del>`, `<br>`, `<img>` with `alt` and `title` in the `ui-markdown__image` slot, and a [Separator](SEPARATOR.md) for a thematic break. An image's source comes from the content, so the `<img>` sends no referrer (`referrerpolicy="no-referrer"`), loads lazily (`loading="lazy"`) and decodes asynchronously (`decoding="async"`): opening a document does not tell a remote image's server the page's URL or that an unread image was reached. A `renderNode` override that draws the image (for example through an image proxy) sets its own attributes. The paragraphs of a tight list's items render without `<p>`. The elements are built without recursive calls, so every document `parseMarkdown` returns renders, five thousand nested block quotes included; how deep a tree the host's renderer can mount is its own limit.

Implementation: `src/components/markdown/markdown.tsx`, `src/components/markdown/markdown-render.tsx`, `labs/reference/markdown.css`, `src/utils/safe-url.ts`
Verification: `src/components/markdown/markdown.test.tsx`, `src/components/markdown/markdown-images.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.2 - Heading ids

With `headingIdPrefix`, headings shall carry `id` set to the prefix and their slug, and a link to `#slug` of one of the document's headings shall point to the prefixed id. The fragment names a heading as written or percent-decoded once (malformed escapes are left as written), compared as is and with accents folded as slugs fold them, so `#%E6%9D%B1%E4%BA%AC` reaches `東京` and `#caf%C3%A9` reaches `cafe`; a fragment that names no heading keeps its link unchanged. Without it headings carry no id, so two documents on a page never repeat one. The document's heading ids are kept as a list compared item by item, so a render that reads the same headings keeps the blocks' context.

Implementation: `src/components/markdown/markdown.tsx`, `src/components/markdown/markdown-render.tsx`
Verification: `src/components/markdown/markdown.test.tsx`, `src/components/markdown/markdown-heading-links.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.3 - Links

Links shall render through [Link](LINK.md), so they navigate through the provider's link renderer and `navigate` ([UIC-PROVIDER-5](PROVIDER.md#uic-provider-5---links)). A link to an absolute `http` or `https` URL opens in a new tab, with Link's safe `rel` and new-tab text; other links stay in the page. A link's title, inline or from its reference definition, becomes the anchor's `title` (an empty title is left out); the link's text stays its name.

Implementation: `src/components/markdown/markdown.tsx`, `src/components/markdown/markdown-render.tsx`
Verification: `src/components/markdown/markdown.test.tsx`, `src/components/markdown/markdown-link-titles.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.4 - Code

A code block shall render as `<pre>` in the `ui-markdown__code-block` slot, publishing its language in `data-language`, around a `<code>` holding its text unhighlighted; inline code renders as `<code>` in the `ui-markdown__code` slot. The `<code>` of a block carries no class: the [hook contract](HOOK-CONTRACT.md) allows hook classes only, so the CommonMark `language-<x>` class that highlighters such as Prism and highlight.js look for is not emitted. A host that highlights code draws code blocks through `createCodeBlockOverride` ([UIC-CODE-BLOCK-4.1](CODE-BLOCK.md#uic-code-block-41---code-block-override)) or its own `renderNode` ([UIC-MARKDOWN-2.8](#uic-markdown-28---node-overrides)), which receives the fence language as the node's `language`.

Implementation: `src/components/markdown/markdown-render.tsx`, `labs/reference/markdown.css`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.5 - Tables

A table shall render through [Prose Table](PROSE-TABLE.md), its columns aligned as the divider row says.

Implementation: `src/components/markdown/markdown.tsx`, `src/components/markdown/markdown-render.tsx`
Verification: `src/components/markdown/markdown.test.tsx`, `src/components/markdown/markdown-tables.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.6 - Task items

A task item shall render as an `<li>` in the `ui-markdown__task` slot holding a read-only [Checkbox](CHECKBOX.md), ticked when the item is checked and labelled by the item's first paragraph, followed by the item's other blocks.

Implementation: `src/components/markdown/markdown-render.tsx`, `labs/reference/markdown.css`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.7 - Find highlighting

Text, inline code and code blocks shall render through [Text Match](TEXT-MATCH.md), so a `TextMatchProvider` above the document marks its query, for example from a [Find Bar](FIND-BAR.md).

Implementation: `src/components/markdown/markdown.tsx`, `src/components/markdown/markdown-render.tsx`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.8 - Node overrides

`renderNode(node, children, place)` shall be called once for every node it renders with the node, its rendered children (`null` for a node without children) and its place (`MarkdownNodePlace`), whose `isInteractive` is `true` for a node inside a link or a task item's label, where an override must not draw another link or button; a return value other than `undefined` replaces the node's rendering, `null` hiding it. A task item's first paragraph labels its checkbox rather than rendering as a paragraph, so it is not passed itself: the item's children are its label's rendered inline nodes followed by its other blocks. Callers use it to highlight code, draw diagrams from fenced code, resolve image sources or add heading anchors. Two overrides are ready-made: `createCodeBlockOverride` draws code blocks as [Code Blocks](CODE-BLOCK.md#uic-code-block-41---code-block-override) and `createCitationOverride` turns `[n]` markers in text into [citations](CHAT-SOURCES.md#uic-chat-sources-31---citation-override); a caller combines overrides by trying one, then the next while it returns `undefined`.

Implementation: `src/components/markdown/markdown.tsx`, `src/components/markdown/markdown-render.tsx`, `src/components/markdown/markdown-place.ts`
Verification: `src/components/markdown/markdown.test.tsx`, `src/components/code-block/markdown-code-block.test.tsx`, `src/components/chat-sources/markdown-citations.test.tsx`, `src/components/chat-sources/markdown-citation-places.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.9 - Outline

`source` shall also take a document `parseMarkdown` returned, and `listMarkdownHeadings(document, headingIdPrefix)` shall list its headings in order as [Outline](OUTLINE.md) headings (`id` with the prefix, `label` the plain text, `level`), so one parse feeds both the reader and its outline. Heading collection and plain-text extraction shall walk nested document and inline nodes iteratively.

Implementation: `src/components/markdown/markdown.tsx`, `src/components/markdown/markdown-headings.ts`
Verification: `src/components/markdown/markdown.test.tsx`, `src/components/markdown/parse-markdown.test.ts`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.10 - Hooks and caller attributes

`Markdown` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/markdown/markdown.tsx`
Verification: `src/components/markdown/markdown.test.tsx`

### UIC-MARKDOWN-2.11 - Streaming: incomplete syntax

While `isStreaming`, the root shall publish `data-streaming`, and a text `source` is prepared before it is parsed so that its end renders as it will once complete, never flashing raw markers where that can be avoided. The parser itself is unchanged, and the preparation is pure text in, text out:

- An unclosed fence already shows as code to the end of its container; inside it, a last line that may yet close the fence (fewer fence characters than the opening) waits.
- Outside a fence, a last line that cannot be read yet waits: an opening fence whose language may be partial, one or two backticks or tildes, a line of only block markers (a list marker, `#`, `>`, `-`, `=`, `*`, `_`, `+`) or an ordered marker, and a table row. A table row without a divider row under it yet waits too.
- In the last paragraph, list item or heading (not a table row or indented code), an unclosed code span is closed; emphasis, strong and `~~` strikethrough runs left open are closed before trailing spaces, and a run nothing follows yet is dropped. A run inside a word, after a non-opening character such as `/`, a single `~` or an escaped marker never opens. A link whose destination is still arriving, an unclosed `[` and a bracketed label that ends the text show as their text; a citation number (`[1`, or `[1]` and `[1, 2]` at the end) and a task marker keep their brackets, a partial citation waits; an image or an autolink (`<https://…`) still arriving waits.

Without `isStreaming` the source renders exactly as written. A parsed document `source` is rendered as given.

Implementation: `src/components/markdown/markdown.tsx`, `src/components/markdown/markdown-streaming.ts`, `src/components/markdown/markdown-streaming-inlines.ts`
Verification: `src/components/markdown/markdown-streaming.test.ts`, `src/components/markdown/markdown-streaming-inlines.test.ts`, `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.12 - Finished blocks

A top-level block the previous render drew in the same rendering context shall keep its element, so React skips it and `renderNode` is not called for its nodes again: the same block object, and while `isStreaming`, a block parsed afresh whose content (signed without recursive calls) and position match, so each chunk renders only the blocks it changed, usually the last. Settled blocks ([UIC-MARKDOWN-2.13](#uic-markdown-213---streaming-settled-blocks)) are the same objects, so they are not signed again. A new `renderNode`, `headingIdPrefix` or set of heading ids renders every block again, so callers keep `renderNode` stable while streaming (`useMemo` or `useCallback`). The element tree has the same shape with and without streaming, so ending a stream keeps the rendered elements, and focus within them.

Implementation: `src/components/markdown/markdown.tsx`, `src/components/markdown/markdown-block-cache.ts`, `src/components/markdown/markdown-render.tsx`
Verification: `src/components/markdown/markdown-block-cache.test.tsx`, `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.13 - Streaming: settled blocks

While `isStreaming`, a text `source` that continues the previous one shall not be parsed again up to its last settled point: the start of a whole line, with more after it, that follows a blank line, sits outside every fence and begins in the first column with a letter, a digit that is not a list marker, `#`, `|`, `!` or `(`, so that no block before it can take it. The blocks before that point keep the objects they were parsed as, and only the rest of the source is parsed for each chunk, so a long reply costs each chunk about as much as its last blocks. A piece that would leave a fence open (one a list item opened, say) does not settle. The document equals `parseMarkdown` of the prepared source at every chunk, heading ids included. Line ends are read as `\n`, so a carriage return, alone or before a line feed, ends a line and settles like one. A source with a line that may start a link reference definition (`[label]:` at the start of a line, inside block quote and list markers too) is parsed whole, since a definition can change what came before; a `]:` elsewhere in a line, such as `x[0]:` in code, does not stop settling. The check reads each line once, so a line of many list markers that defines nothing costs no more than its length.

Implementation: `src/components/markdown/parse-streaming-markdown.ts`, `src/components/markdown/parse-markdown.ts`, `src/components/markdown/markdown.tsx`
Verification: `src/components/markdown/parse-streaming-markdown.test.ts`, `src/components/markdown/markdown-block-cache.test.tsx`

### UIC-MARKDOWN-2.14 - Image policy

`images` shall choose how images show. With `show`, the default, each image is an `<img>` loaded from its source ([UIC-MARKDOWN-2.1](#uic-markdown-21---elements)). With `link`, no image loads: each is a [Link](LINK.md) to its source in the `ui-markdown__image-link` slot, named by its text, or by its source when it has none, with its title as the anchor's `title`, opening an absolute `http` or `https` source in a new tab like other links ([UIC-MARKDOWN-2.3](#uic-markdown-23---links)). Inside another link or a task item's label, where links do not nest, the image is its text in a `<span>` in the same slot. Content from a writer the reader does not trust takes `link`, so opening it reveals nothing to an image's server. A `renderNode` override that draws images comes first under either policy.

Implementation: `src/components/markdown/markdown.tsx`, `src/components/markdown/markdown-render.tsx`
Verification: `src/components/markdown/markdown-images.test.tsx`

## UIC-MARKDOWN-3 - Accessibility

### UIC-MARKDOWN-3.1 - Native semantics

The document shall keep native semantics: heading levels as written, lists, block quotes, table semantics from Prose Table, images named by their alt text, and task checkboxes named by their text and read-only. Raw HTML is never injected, and the component never sets `innerHTML`.

Implementation: `src/components/markdown/markdown.tsx`, `src/components/markdown/markdown-render.tsx`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

## Hooks

| Hook                      | Kind      | Values | Description                                 |
| ------------------------- | --------- | ------ | ------------------------------------------- |
| `ui-markdown`             | root      |        | The `<div>` holding the document.           |
| `ui-markdown__code-block` | slot      |        | A code block's `<pre>`.                     |
| `ui-markdown__code`       | slot      |        | Inline `<code>`.                            |
| `ui-markdown__task`       | slot      |        | A task item's `<li>`, around its Checkbox.  |
| `ui-markdown__image`      | slot      |        | An `<img>`.                                 |
| `ui-markdown__image-link` | slot      |        | An image drawn as a link, or as its text.   |
| `data-language`           | attribute |        | On a code block, the language of its fence. |
| `data-streaming`          | state     | `true` | On the root, while `isStreaming`.           |
