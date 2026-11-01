# Markup

The helpers the markup readers share: `tokenizeMarkup` and `decodeEntities` read markup strings without the DOM, so [SVG Markup](SVG-MARKUP.md) and [HTML Markup](HTML-MARKUP.md) parse the same way on the server and in the browser, and [Markdown](MARKDOWN.md) decodes character references with them; `isSafeUrl`, exported from the package root, decides which URLs from authored content may become links and image sources.

## UIC-MARKUP-1 - Tokens

### UIC-MARKUP-1.1 - Tokens

`tokenizeMarkup(markup)` shall return the markup's text, opening-tag and closing-tag tokens in order. An opening tag keeps its tag name and attribute names as written, the first of repeated attribute names, attribute values with entities decoded (an attribute without a value is empty), and whether it ends in `/>`. Comments, processing instructions and declarations (with an internal subset) are dropped, a CDATA section becomes text as written, text has its entities decoded, and a `<` that starts no tag is text.

Implementation: `src/utils/markup.ts`
Verification: `src/utils/markup.test.ts`, `src/components/svg-markup/parse-svg-markup.test.ts`

### UIC-MARKUP-1.2 - Raw text

For an element named in `rawTextElements` (lower case), the content up to its closing tag, matched ignoring case, shall be one text token as written, never read as markup, followed by its closing tag, which the end of the markup implies when it is missing.

Implementation: `src/utils/markup.ts`
Verification: `src/utils/markup.test.ts`

### UIC-MARKUP-1.3 - Character references

`decodeEntities(text)` shall decode decimal and hexadecimal character references, a reference to no character (zero, a surrogate, beyond U+10FFFF) becoming U+FFFD, and every named character reference of HTML (accented letters, Greek and mathematical signs, those that stand for two code points), each ended by its `;` and matched with its case. An unknown name stays as written, and a name an ordinary object inherits (`constructor`) is unknown. [Markdown](MARKDOWN.md) and [SVG Markup](SVG-MARKUP.md) decode this way. `tokenizeMarkup(markup, { references: 'html' })`, which [HTML Markup](HTML-MARKUP.md) uses, decodes as an HTML parser does instead: also the legacy names written without a `;` (`&copy`) and numeric references without one, numeric references to C1 controls as their Windows-1252 characters, and in attribute values a legacy name without a `;` before `=` or an alphanumeric stays as written. Text is decoded exactly once, before URL checks.

Implementation: `src/utils/markup.ts`
Verification: `src/utils/markup.test.ts`, `src/utils/markup-entities.test.tsx`, `e2e/html-markup.spec.ts`

### UIC-MARKUP-1.4 - Dropped elements

`skipDroppedElements(tokens, { isDropped, isEmpty })` shall pass on the tokens outside the elements `isDropped` picks, skipping each picked element with its content up to its matching closing tag (or to the end of the markup). Elements of the same name nested inside a dropped one are counted, so their closing tags do not end the drop early; tag names compare ignoring case. An element `isEmpty` reports (by default one ending in `/>`) is dropped alone.

Implementation: `src/utils/markup.ts`
Verification: `src/utils/markup.test.ts`

### UIC-MARKUP-1.5 - Linear reading

Reading untrusted markup shall take time about proportional to its length, whatever it holds, so authored content cannot stall a page or a server. `tokenizeMarkup` reads each tag in one pass, an opening tag that never ends (no `>` before the next `<` outside quotes, or an unclosed quote) costing its length once before its `<` is read as text. The HTML and SVG readers find the nearest open element of a name without walking their open elements, so deep nesting, stray closing tags and implied ends cost the same per tag at any depth. No input is refused or cut short for its size.

Implementation: `src/utils/markup.ts`, `src/utils/open-elements.ts`, `src/components/html-markup/html-tree.ts`, `src/components/svg-markup/parse-svg-markup.ts`
Verification: `src/utils/markup-scaling.test.tsx`, `e2e/html-markup.spec.ts`

### UIC-MARKUP-1.6 - Nesting depth

No input shall overflow the call stack while it is read or drawn, on the server or in the browser. HtmlMarkup, SvgMarkup and Markdown draw at most 256 levels of nested elements (`maxMarkupDepth`): a deeper element that has content is unwrapped, and its content joins the element at level 256 in document order, so text, line breaks and images are kept and only the deeper wrappers go; those wrappers are not offered to `renderElement` or `renderNode`. The bound sits well below the 512 open elements Chromium's parser keeps, so server HTML parses back to the same tree inside a page's own nesting and hydrates.

Implementation: `src/utils/map-tree.ts`, `src/utils/markup.ts`, `src/components/html-markup/html-markup.tsx`, `src/components/svg-markup/svg-markup.tsx`, `src/components/markdown/markdown-render.tsx`
Verification: `src/utils/map-tree.test.ts`, `src/utils/markup-depth.test.tsx`, `e2e/html-markup.spec.ts`, `e2e/markdown.spec.ts`

## UIC-MARKUP-2 - URLs

### UIC-MARKUP-2.1 - Safe URLs

`isSafeUrl(url, schemes)` shall accept a URL that is relative (a path, a query, a fragment, a protocol-relative `//host`) or whose scheme, read after control characters and whitespace are removed as a browser removes them, is one of `schemes` ignoring case; `schemes` defaults to `defaultUrlSchemes` (`http`, `https`, `mailto`, `tel`). `javascript:`, `vbscript:`, `data:` and every other scheme are refused unless listed.

Implementation: `src/utils/safe-url.ts`
Verification: `src/utils/safe-url.test.ts`
