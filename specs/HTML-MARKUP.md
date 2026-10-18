# HTML Markup

`HtmlMarkup` renders an HTML fragment, such as stored rich text or a server-rendered description, as React elements, never through `innerHTML`. `sanitizeHtml` reads the fragment without the DOM, so it also runs on the server, and keeps only what an allowlist policy names: elements, attributes and URL schemes. It is the HTML counterpart of [SVG Markup](SVG-MARKUP.md); authored Markdown is shown by [Markdown](MARKDOWN.md). Links render through the provider's link renderer and text through [Text Match](TEXT-MATCH.md), and the caller may replace any element, for example to draw a mention as a component.

## UIC-HTML-MARKUP-1 - Sanitizing

### UIC-HTML-MARKUP-1.1 - Element tree

`sanitizeHtml(markup, policy)` shall return the fragment as a frozen list of nodes: elements (`tag` in lower case, the kept `attributes` with lower-case names and decoded entities, `children`) and text with its character references decoded ([UIC-MARKUP-1](MARKUP.md#uic-markup-1---tokens)). Comments and doctypes are dropped, and a `<` that starts no tag is text. It never touches the DOM.

Implementation: `src/components/html-markup/sanitize-html.ts`, `src/components/html-markup/html-tree.ts`, `src/utils/markup.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`

### UIC-HTML-MARKUP-1.2 - HTML structure

The tree shall follow the structure an HTML parser gives the fragment: void elements (`br`, `img`, `hr`, …) take no children; an element closes the open elements it implies (a block closes an open paragraph, a list item, term, row, cell or table section closes its open sibling, a link closes an open link, a heading an open heading); a row directly in a table gets a `tbody`; text directly in table structure is dropped; a closing tag closes the nearest open element of its name and a stray one is ignored.

Implementation: `src/components/html-markup/html-tree.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`

### UIC-HTML-MARKUP-1.3 - Elements

Elements the policy does not list shall be unwrapped, their content kept in their place. `script`, `style`, `template`, `iframe`, `frame`, `frameset`, `object`, `embed`, `applet`, `noscript`, `noembed`, `noframes`, `xmp`, `plaintext`, `title`, `textarea`, `select`, `svg`, `math`, `base`, `link` and `meta` shall be dropped with their content whatever the policy lists; the content of the raw-text ones is never parsed as markup.

Implementation: `src/components/html-markup/html-tree.ts`, `src/components/html-markup/sanitize-html.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`, `e2e/html-markup.spec.ts`

### UIC-HTML-MARKUP-1.4 - Attributes

Kept elements shall keep only the attributes the policy lists (an entry ending in `*`, such as `data-*`, keeps every name it starts). Event handlers (`on…`), `style` and `srcdoc` are always dropped, and `class` tokens starting with `ui-` are dropped so content cannot claim a library hook.

Implementation: `src/components/html-markup/sanitize-html.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`, `e2e/html-markup.spec.ts`

### UIC-HTML-MARKUP-1.5 - URLs

A URL attribute (`href`, `src`, `cite`, `action`, `formaction`, `poster`, `background`, `longdesc`, `xlink:href`, and each candidate of `srcset`) shall be kept only when [`isSafeUrl`](MARKUP.md#uic-markup-21---safe-urls) accepts it with the policy's schemes: relative, or using a listed scheme after control characters and whitespace are ignored.

Implementation: `src/components/html-markup/sanitize-html.ts`, `src/utils/safe-url.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`, `e2e/html-markup.spec.ts`

### UIC-HTML-MARKUP-1.6 - New tabs

A kept link with `target="_blank"` shall get `noopener` and `noreferrer` added to its `rel`.

Implementation: `src/components/html-markup/sanitize-html.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`

### UIC-HTML-MARKUP-1.7 - Policy

A policy (`HtmlPolicy`) shall list the kept `elements`, `attributes` and URL `schemes`, in lower case. `defaultHtmlPolicy`, frozen, keeps rich text without forms or media: text-level elements, headings, paragraphs, lists, block quotes, code, tables, figures, details, images and links; their descriptive attributes (`href`, `src`, `alt`, `title`, `class`, `lang`, `dir`, table spans and scopes, list numbering, `datetime`, `target`, `rel`, `data-*`); and the `http`, `https`, `mailto` and `tel` schemes.

Implementation: `src/components/html-markup/sanitize-html.ts`
Verification: `src/components/html-markup/sanitize-html.test.ts`

## UIC-HTML-MARKUP-2 - Rendering

### UIC-HTML-MARKUP-2.1 - React elements

`HtmlMarkup` shall render `markup`, sanitized, inside a `<div>` root as React elements, converting attribute names to React props (`class` to `className`, `colspan` to `colSpan`, `datetime` to `dateTime`, boolean attributes such as `open` and `reversed` to `true`), so it renders on the server as in the browser. It never sets `innerHTML` and parses again only when `markup` or `policy` changes.

Implementation: `src/components/html-markup/html-markup.tsx`
Verification: `src/components/html-markup/html-markup.test.tsx`, `e2e/html-markup.spec.ts`

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
