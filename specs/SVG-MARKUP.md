# SVG Markup

`SvgMarkup` renders an SVG markup string as React elements, never through `innerHTML`, and `parseSvgMarkup` turns the markup into a plain element tree without touching the DOM, so it also runs on the server. Hosts that keep their icons as markup strings pass them to `Icon` as children: `<Icon size="sm" label="Add"><SvgMarkup markup={icons.plus} /></Icon>`.

## UIC-SVG-MARKUP-1 - Parsing

### UIC-SVG-MARKUP-1.1 - Element tree

`parseSvgMarkup` shall return the markup's root `<svg>` element as a frozen tree of elements (tag and attribute names in their SVG spelling, attributes with entities decoded) and text. Freezing a deeply nested tree shall not depend on JavaScript's call-stack depth. Comments, processing instructions, doctypes and whitespace-only text are dropped, CDATA sections become text, an unmatched closing tag closes the nearest open element of that name, and markup without a root `<svg>` element throws.

Implementation: `src/components/svg-markup/parse-svg-markup.ts`, `src/utils/markup.ts`
Verification: `src/components/svg-markup/parse-svg-markup.test.ts`

### UIC-SVG-MARKUP-1.2 - Unsafe content

Markup is untrusted, and the result shall be safe to render on the server and on the client. `parseSvgMarkup` shall keep only an allowlist of drawing elements (shapes, groups, `use`, `symbol`, text, gradients, patterns, clip paths, masks, markers, filter primitives, `title`, `desc`) and SMIL animations (`animate`, `animateMotion`, `animateTransform`, `set`, `mpath`), and drop every other element with its content, including `<script>`, `<style>`, `<foreignObject>`, HTML elements and namespaced elements. Links (`<a>`) are unwrapped: the link goes and its content stays. `<title>` and `<desc>` hold text only; any element inside them is dropped with its content.

Kept elements keep only allowlisted drawing attributes, `aria-*` and `data-*`; event handlers, `tabindex` and unknown attributes are dropped, whatever their case. `href` and `xlink:href` keep only a link to a fragment of the same drawing (`#id`), and `<image>` may also embed a base64 PNG, JPEG, GIF, WebP or AVIF data URL. Other values are dropped when they contain `\`, `<`, `>`, `@`, `javascript:` or `expression`, call a CSS function outside the drawing functions (colours, `var`, `calc`, transforms and the like), or use `url()` for anything but a fragment. A `style` attribute keeps only presentation properties (with or without a vendor prefix) and custom properties whose values pass the same check. `xmlns` and `xmlns:xlink` keep only the SVG and XLink namespaces, and `class` drops library `ui-` tokens. An animation is dropped with its content when its `attributeName` names a link, `style`, `class`, `id`, a namespace or an attribute the policy drops. Nested elements of the same name do not end a drop early.

Implementation: `src/components/svg-markup/parse-svg-markup.ts`, `src/components/svg-markup/svg-policy.ts`, `src/utils/markup.ts`
Verification: `src/components/svg-markup/parse-svg-markup.test.ts`, `src/components/svg-markup/svg-markup.test.tsx`, `e2e/svg-markup.spec.ts`

### UIC-SVG-MARKUP-1.3 - Cached parsing

`parseSvgMarkup` shall cache its result by markup string and return the same tree for the same markup, keeping the 256 most recently used entries.

Implementation: `src/components/svg-markup/parse-svg-markup.ts`, `src/utils/markup.ts`
Verification: `src/components/svg-markup/parse-svg-markup.test.ts`

## UIC-SVG-MARKUP-2 - Rendering

### UIC-SVG-MARKUP-2.1 - React elements

`SvgMarkup` shall render the parsed tree as React elements, converting attribute names to React props (`class` to `className`, hyphenated names such as `stroke-width` to camel case, `xlink:href` to `xlinkHref`, `data-*` and `aria-*` unchanged) and `style` text to style objects, so the rendered markup matches the source. Large sibling lists, at the root or inside a group, shall not be limited by the runtime's function argument count. It never sets `innerHTML`.

Implementation: `src/components/svg-markup/svg-markup.tsx`
Verification: `src/components/svg-markup/svg-markup.test.tsx`, `e2e/svg-markup.spec.ts`

### UIC-SVG-MARKUP-2.2 - Root attributes

The root `<svg>` shall keep the markup's drawing attributes (`viewBox`, `fill`, `stroke`, `xmlns` and the like) and drop the markup's `class`, `style`, `width`, `height`, `id`, `role`, `focusable`, `tabindex`, `aria-*` and `data-*`, which the component and its caller own. The stylesheet sizes the drawing; the reference sheet uses 24 pixels on its own, and inside an `Icon` the drawing fills the icon box.

Implementation: `src/components/svg-markup/svg-markup.tsx`, `labs/reference/svg-markup.css`
Verification: `src/components/svg-markup/svg-markup.test.tsx`, `e2e/svg-markup.spec.ts`

### UIC-SVG-MARKUP-2.3 - Accessibility

`SvgMarkup` without `label` shall be decorative: `aria-hidden="true"`, `focusable="false"` and no role. With `label` it shall render `role="img"` named by the label. Inside an `Icon`, the `Icon`'s `label` names the icon and the drawing stays decorative.

Implementation: `src/components/svg-markup/svg-markup.tsx`
Verification: `src/components/svg-markup/svg-markup.test.tsx`, `e2e/svg-markup.spec.ts`

### UIC-SVG-MARKUP-2.4 - Markup without a drawing

`SvgMarkup` shall render nothing when its markup has no root `<svg>` element, for example a missing registry entry.

Implementation: `src/components/svg-markup/svg-markup.tsx`
Verification: `src/components/svg-markup/svg-markup.test.tsx`, `e2e/svg-markup.spec.ts`

### UIC-SVG-MARKUP-2.5 - Hooks and caller attributes

`SvgMarkup` shall carry the hook below on its root `<svg>`, append the caller's `className`, and forward caller `data-*` attributes and `id`.

Implementation: `src/components/svg-markup/svg-markup.tsx`
Verification: `src/components/svg-markup/svg-markup.test.tsx`

## Hooks

| Hook            | Kind | Values | Description                |
| --------------- | ---- | ------ | -------------------------- |
| `ui-svg-markup` | root |        | The rendered root `<svg>`. |
