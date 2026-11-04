# HTML Markup

`HtmlMarkup` renders an HTML fragment, such as stored rich text or a server-rendered description, as React elements, never through `innerHTML`. `sanitizeHtml` reads the fragment without the DOM, so it also runs on the server, and keeps only what an allowlist policy names: elements, attributes and URL schemes. It is the HTML counterpart of [SVG Markup](SVG-MARKUP.md); authored Markdown is shown by [Markdown](MARKDOWN.md). Links render through the provider's link renderer and text through [Text Match](TEXT-MATCH.md), and the caller may replace any element, for example to draw a mention as a component.

## UIC-HTML-MARKUP-1 - Sanitizing

### UIC-HTML-MARKUP-1.1 - Element tree

`sanitizeHtml(markup, policy)` shall return the fragment as a frozen list of nodes: elements (`tag` in lower case, the kept `attributes` with lower-case names and decoded entities, `children`) and text with its character references decoded ([UIC-MARKUP-1](MARKUP.md#uic-markup-1---tokens)). Comments and doctypes are dropped, and a `<` that starts no tag is text. It never touches the DOM.

Filtering deeply nested kept or excluded elements shall preserve content order and freezing without relying on recursive calls. Excluded wrappers shall append into their parent's output rather than repeatedly copy their descendants.

Implementation: `src/components/html-markup/sanitize-html.ts`, `src/components/html-markup/html-tree.ts`, `src/utils/markup.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`

### UIC-HTML-MARKUP-1.2 - HTML structure

The tree shall follow the structure an HTML parser gives the fragment: void elements (`br`, `img`, `hr`, …) take no children; an element closes the open elements it implies (a block, list item, term or description closes an open paragraph, a list item, term, row, cell or table section closes its open sibling, a link closes an open link, a heading an open heading); table parts go where an HTML parser puts them, so server HTML parses back into the same tree: a `col` outside a column group gets a `colgroup`, a row outside a table section a `tbody` and a cell outside a row a `tr`; a caption, column group or section closes what is open inside its table, a row what is open inside its section and a cell what is open inside its row; another element directly in table structure is placed before the table, and a `table` there closes the open table and follows it; a list item, term, description or link placed so in an open one of its kind, or a heading placed so directly in a heading, keeps only its content there, since its own tag would close that element when the server HTML is parsed again; a table part outside any table is ignored, its content kept; text directly in table structure is dropped; a closing tag closes the nearest open element of its name and a stray one is ignored.

After policy filtering removes a scope boundary (such as a button, list, table or cell), a retained tag that would implicitly close an emitted ancestor shall also be unwrapped, preserving its allowed content in order. Heading opening tags shall be checked against their immediate emitted parent. If filtering breaks a table's required parent/child structure or exposes flow content in its scaffold, that table and its own structural tags shall be unwrapped; a table unwrapped by scope repair shall lose its scaffold too. Valid nested tables shall retain their independent structure. Repair shall never synthesize policy-excluded tags or drop newly exposed content, and shall remain iterative with work proportional to the tree size.

Implementation: `src/components/html-markup/html-tree.ts`, `src/components/html-markup/html-table.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`, `src/components/html-markup/html-table-hydration.test.tsx`, `src/components/html-markup/html-scope-hydration.test.tsx`, `e2e/html-markup.spec.ts`

### UIC-HTML-MARKUP-1.3 - Elements

Elements the policy does not list shall be unwrapped, their content kept in their place, whatever their name: one an ordinary object inherits (`constructor`, `__proto__`, `toString`) reads as any unknown name does, at the root and inside open paragraphs, lists and tables. `script`, `style`, `template`, `iframe`, `frame`, `frameset`, `object`, `embed`, `applet`, `noscript`, `noembed`, `noframes`, `xmp`, `plaintext`, `title`, `textarea`, `select`, `svg`, `math`, `base`, `link` and `meta` shall be dropped with their content whatever the policy lists, up to the closing tag that matches them (nested elements of the same name are counted). The content of the ones an HTML parser reads as text (`script`, `style`, `iframe`, `noembed`, `noframes`, `noscript`, `xmp`, `plaintext`, `textarea` and `title`) is never parsed as markup.

Unwrapping excluded elements shall apply the structure repair in UIC-HTML-MARKUP-1.2 to the ancestry that will actually be emitted, while preserving the element, attribute and URL allowlists.

Implementation: `src/components/html-markup/html-tree.ts`, `src/components/html-markup/sanitize-html.ts`, `src/utils/markup.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`, `src/components/html-markup/html-object-names.test.tsx`, `src/components/html-markup/html-scope-hydration.test.tsx`, `e2e/html-markup.spec.ts`

### UIC-HTML-MARKUP-1.4 - Attributes

Kept elements shall keep only the attributes the policy lists (an entry ending in `*`, such as `data-*`, keeps every name it starts). Event handlers (`on…`), `style` and `srcdoc` are always dropped, and `class` tokens starting with `ui-` are dropped so content cannot claim a library hook.

Implementation: `src/components/html-markup/sanitize-html.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`, `e2e/html-markup.spec.ts`

### UIC-HTML-MARKUP-1.5 - URLs

A URL attribute (`href`, `src`, `cite`, `action`, `formaction`, `poster`, `background`, `longdesc`, `xlink:href`, and each candidate of `srcset`) shall be kept only when [`isSafeUrl`](MARKUP.md#uic-markup-21---safe-urls) accepts it with the policy's schemes: relative, or using a listed scheme after control characters and whitespace are ignored.

Implementation: `src/components/html-markup/sanitize-html.ts`, `src/utils/safe-url.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`, `e2e/html-markup.spec.ts`

### UIC-HTML-MARKUP-1.6 - New tabs

A kept link with `target="_blank"` shall get `noopener` and `noreferrer` added to its `rel`, by the same policy as a [Link](LINK.md#uic-link-22---new-tabs); a link without that target keeps its `rel` as written.

Implementation: `src/components/html-markup/sanitize-html.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`

### UIC-HTML-MARKUP-1.7 - Policy

A policy (`HtmlPolicy`) shall list the kept `elements`, `attributes` and URL `schemes`, in lower case. `defaultHtmlPolicy`, frozen, keeps rich text without forms or media: text-level elements, headings, paragraphs, lists, block quotes, code, tables, figures, details, images and links; their descriptive attributes (`href`, `src`, `alt`, `title`, `class`, `lang`, `dir`, table spans and scopes, list numbering, `datetime`, `target`, `rel`, `data-*`); and the `http`, `https`, `mailto` and `tel` schemes.

Implementation: `src/components/html-markup/sanitize-html.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`

## UIC-HTML-MARKUP-2 - Rendering

### UIC-HTML-MARKUP-2.1 - React elements

`HtmlMarkup` shall render `markup`, sanitized, inside a `<div>` root as React elements, converting attribute names to React props (`class` to `className`, `colspan` to `colSpan`, `datetime` to `dateTime`, boolean attributes such as `open` and `reversed` to `true`), so it renders on the server as in the browser. It never sets `innerHTML` and parses again only when `markup` or `policy` changes.

An `<img>` comes from the content, so by default it sends no referrer (`referrerpolicy="no-referrer"`), loads lazily (`loading="lazy"`) and decodes asynchronously (`decoding="async"`): showing the markup does not tell a remote image's server the page's URL or that an unread image was reached. `defaultHtmlPolicy` drops the content's own `referrerpolicy` and `loading`; a policy that keeps them lets the content's values replace the defaults, and a `renderElement` override that draws the image sets its own attributes.

Building the React element tree shall use an iterative traversal, preserving each node's sibling key and calling element overrides after their rendered children.

Without element overrides, the repaired markup shall parse from server HTML into the same structure and hydrate without recovery or replacing server nodes, including when the policy removes scope boundaries.

Implementation: `src/components/html-markup/html-markup.tsx`, `src/utils/map-tree.ts`, `src/utils/safe-url.ts`
Verification: `src/components/html-markup/html-markup.test.tsx`, `src/components/html-markup/html-markup-images.test.tsx`, `src/components/html-markup/html-scope-hydration.test.tsx`, `e2e/html-markup.spec.ts`

### UIC-HTML-MARKUP-2.2 - Links

A link with `href` shall render through the provider's link renderer ([UIC-PROVIDER-5.1](PROVIDER.md#uic-provider-51---link-renderer)) with its kept attributes; an anchor without `href` renders as a plain `<a>`.

Implementation: `src/components/html-markup/html-markup.tsx`
Verification: `src/components/html-markup/html-markup.test.tsx`, `e2e/html-markup.spec.ts`

### UIC-HTML-MARKUP-2.3 - Element overrides

`renderElement(element, children)` shall be called for every kept element with the sanitized element and its rendered children; a return value other than `undefined` replaces the element, `null` hiding it.

Implementation: `src/components/html-markup/html-markup.tsx`
Verification: `src/components/html-markup/html-markup.test.tsx`, `e2e/html-markup.spec.ts`

### UIC-HTML-MARKUP-2.4 - Find highlighting

Text shall render through [Text Match](TEXT-MATCH.md), so a `TextMatchProvider` above the content marks its query.

Implementation: `src/components/html-markup/html-markup.tsx`
Verification: `src/components/html-markup/html-markup.test.tsx`, `e2e/html-markup.spec.ts`

### UIC-HTML-MARKUP-2.5 - Policy

`policy` shall replace `defaultHtmlPolicy` for the component's sanitizing.

Implementation: `src/components/html-markup/html-markup.tsx`
Verification: `src/components/html-markup/html-markup.test.tsx`, `e2e/html-markup.spec.ts`

### UIC-HTML-MARKUP-2.6 - Hooks and caller attributes

`HtmlMarkup` shall carry the hook below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/html-markup/html-markup.tsx`
Verification: `src/components/html-markup/html-markup.test.tsx`

## UIC-HTML-MARKUP-3 - Accessibility

### UIC-HTML-MARKUP-3.1 - Content semantics

The rendered content shall keep the semantics of its elements (headings, lists, tables, disclosure, images named by `alt`); the component adds no role of its own.

Implementation: `src/components/html-markup/html-markup.tsx`
Verification: `src/components/html-markup/html-markup.test.tsx`, `e2e/html-markup.spec.ts`

## Hooks

| Hook             | Kind | Values | Description                      |
| ---------------- | ---- | ------ | -------------------------------- |
| `ui-html-markup` | root |        | The `<div>` holding the content. |
