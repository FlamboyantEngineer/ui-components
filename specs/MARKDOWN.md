# Markdown

`Markdown` renders Markdown as React elements, for documentation pages, descriptions, comments and generated answers. `parseMarkdown` reads the text into a plain, frozen document tree without a dependency or the DOM, so it also runs on the server: CommonMark's blocks and inlines (headings, paragraphs, emphasis, code, lists, block quotes, links, images, thematic breaks) and three extensions, tables, task lists and strikethrough. Raw HTML is never interpreted; it shows as text. Tables render through [Prose Table](PROSE-TABLE.md), links through [Link](LINK.md), task items through a read-only [Checkbox](CHECKBOX.md), thematic breaks through [Separator](SEPARATOR.md) and text through [Text Match](TEXT-MATCH.md). Highlighting code and drawing diagrams stay with the caller, through `renderNode`. Stored HTML is shown by [HTML Markup](HTML-MARKUP.md) instead.

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

Fenced code (three or more backticks or tildes, closed by a fence of the same character at least as long, or by the end of its container) and indented code (four spaces) shall become `codeBlock` nodes holding their text verbatim, with a fence's indentation removed from its lines. `language` is the first word of the fence's info string, or `null`.

Implementation: `src/components/markdown/markdown-blocks.ts`, `src/components/markdown/markdown-lines.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`

### UIC-MARKDOWN-1.5 - Block quotes

Lines starting with `>` shall become a `blockquote` whose content is parsed as blocks, so quotes nest and hold any block. A paragraph line without the marker continues the quote's paragraph (a lazy continuation). Five thousand nested block quotes shall parse without recursive calls; deferred container frames retain depth-first source order for reference definitions, inline content and heading ids.

Implementation: `src/components/markdown/markdown-containers.ts`, `src/components/markdown/parse-markdown.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`

### UIC-MARKDOWN-1.6 - Lists

Items marked `-`, `+` or `*`, or numbered with `.` or `)`, shall become `list` nodes of `listItem`s whose content (the lines indented to the item's content column, and lazy paragraph lines) is parsed as blocks, so lists nest. A change of bullet or delimiter starts a new list; an ordered list's `start` is its first number. A list is `tight` unless a blank line separates two items or two blocks of an item. A continuation may follow two hundred thousand blank lines without exceeding the function argument limit.

Implementation: `src/components/markdown/markdown-containers.ts`, `src/components/markdown/markdown-lines.ts`
Verification: `src/components/markdown/parse-markdown.test.ts`

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

## UIC-MARKDOWN-2 - Rendering

### UIC-MARKDOWN-2.1 - Elements

`Markdown` shall render `source` inside a `<div>` root, each node as its element: `<h1>`–`<h6>`, `<p>`, `<blockquote>`, `<ul>`, `<ol>` (with `start` when it is not 1), `<li>`, `<em>`, `<strong>`, `<del>`, `<br>`, `<img>` with `alt` and `title` in the `ui-markdown__image` slot, and a [Separator](SEPARATOR.md) for a thematic break. The paragraphs of a tight list's items render without `<p>`.

Implementation: `src/components/markdown/markdown.tsx`, `labs/reference/markdown.css`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.2 - Heading ids

With `headingIdPrefix`, headings shall carry `id` set to the prefix and their slug, and a link to `#slug` of one of the document's headings shall point to the prefixed id. Without it headings carry no id, so two documents on a page never repeat one.

Implementation: `src/components/markdown/markdown.tsx`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.3 - Links

Links shall render through [Link](LINK.md), so they navigate through the provider's link renderer and `navigate` ([UIC-PROVIDER-5](PROVIDER.md#uic-provider-5---links)). A link to an absolute `http` or `https` URL opens in a new tab, with Link's safe `rel` and new-tab text; other links stay in the page.

Implementation: `src/components/markdown/markdown.tsx`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.4 - Code

A code block shall render as `<pre>` in the `ui-markdown__code-block` slot, publishing its language in `data-language`, around a `<code>` holding its text unhighlighted; inline code renders as `<code>` in the `ui-markdown__code` slot.

Implementation: `src/components/markdown/markdown.tsx`, `labs/reference/markdown.css`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.5 - Tables

A table shall render through [Prose Table](PROSE-TABLE.md), its columns aligned as the divider row says.

Implementation: `src/components/markdown/markdown.tsx`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.6 - Task items

A task item shall render as an `<li>` in the `ui-markdown__task` slot holding a read-only [Checkbox](CHECKBOX.md), ticked when the item is checked and labelled by the item's first paragraph, followed by the item's other blocks.

Implementation: `src/components/markdown/markdown.tsx`, `labs/reference/markdown.css`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.7 - Find highlighting

Text, inline code and code blocks shall render through [Text Match](TEXT-MATCH.md), so a `TextMatchProvider` above the document marks its query, for example from a [Find Bar](FIND-BAR.md).

Implementation: `src/components/markdown/markdown.tsx`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.8 - Node overrides

`renderNode(node, children)` shall be called for every node with the node and its rendered children (`null` for a node without children); a return value other than `undefined` replaces the node's rendering, `null` hiding it. Callers use it to highlight code, draw diagrams from fenced code, resolve image sources or add heading anchors.

Implementation: `src/components/markdown/markdown.tsx`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.9 - Outline

`source` shall also take a document `parseMarkdown` returned, and `listMarkdownHeadings(document, headingIdPrefix)` shall list its headings in order as [Outline](OUTLINE.md) headings (`id` with the prefix, `label` the plain text, `level`), so one parse feeds both the reader and its outline. Heading collection and plain-text extraction shall walk nested document and inline nodes iteratively.

Implementation: `src/components/markdown/markdown.tsx`, `src/components/markdown/markdown-headings.ts`
Verification: `src/components/markdown/markdown.test.tsx`, `src/components/markdown/parse-markdown.test.ts`, `e2e/markdown.spec.ts`

### UIC-MARKDOWN-2.10 - Hooks and caller attributes

`Markdown` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/markdown/markdown.tsx`
Verification: `src/components/markdown/markdown.test.tsx`

## UIC-MARKDOWN-3 - Accessibility

### UIC-MARKDOWN-3.1 - Native semantics

The document shall keep native semantics: heading levels as written, lists, block quotes, table semantics from Prose Table, images named by their alt text, and task checkboxes named by their text and read-only. Raw HTML is never injected, and the component never sets `innerHTML`.

Implementation: `src/components/markdown/markdown.tsx`
Verification: `src/components/markdown/markdown.test.tsx`, `e2e/markdown.spec.ts`

## Hooks

| Hook                      | Kind      | Values | Description                                 |
| ------------------------- | --------- | ------ | ------------------------------------------- |
| `ui-markdown`             | root      |        | The `<div>` holding the document.           |
| `ui-markdown__code-block` | slot      |        | A code block's `<pre>`.                     |
| `ui-markdown__code`       | slot      |        | Inline `<code>`.                            |
| `ui-markdown__task`       | slot      |        | A task item's `<li>`, around its Checkbox.  |
| `ui-markdown__image`      | slot      |        | An `<img>`.                                 |
| `data-language`           | attribute |        | On a code block, the language of its fence. |
