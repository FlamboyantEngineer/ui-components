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

`decodeEntities(text)` shall decode decimal and hexadecimal character references, a reference to no character (zero, a surrogate, beyond U+10FFFF) becoming U+FFFD, and the common named entities (`amp`, `lt`, `gt`, `quot`, `apos`, `nbsp`, spaces, dashes, quotes, `hellip`, `copy`, `reg`, `trade`, currency, arithmetic and arrow signs); an unknown name stays as written.

Implementation: `src/utils/markup.ts`
Verification: `src/utils/markup.test.ts`

## UIC-MARKUP-2 - URLs

### UIC-MARKUP-2.1 - Safe URLs

`isSafeUrl(url, schemes)` shall accept a URL that is relative (a path, a query, a fragment, a protocol-relative `//host`) or whose scheme, read after control characters and whitespace are removed as a browser removes them, is one of `schemes` ignoring case; `schemes` defaults to `defaultUrlSchemes` (`http`, `https`, `mailto`, `tel`). `javascript:`, `vbscript:`, `data:` and every other scheme are refused unless listed.

Implementation: `src/utils/safe-url.ts`
Verification: `src/utils/safe-url.test.ts`
