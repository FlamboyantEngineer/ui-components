# Link

`Link` navigates to another page or resource, in running text or on its own. It is built on React Aria's `Link`, so it navigates client-side through the provider's `navigate` and `useHref` ([PROVIDER.md](PROVIDER.md#uic-provider-52---client-side-navigation-for-react-aria-links)), and its anchor is drawn through the provider's link renderer like the library's other links. `variant` sets its emphasis, `isStandalone` tells running-text links from links that stand alone, and `underline` sets when it is underlined. A link that opens a new tab gets a safe `rel`, an external glyph and visually hidden text that says so. Without `href` it is a pressable link (`role="link"`). A command that looks like a link is a [Button](BUTTON.md) with the `link` variant; a button that navigates is a Button with `href`.

## UIC-LINK-1 - Contract

### UIC-LINK-1.1 - Element

`Link` shall render an `<a>` with its `href` and children, drawn through the provider's link renderer ([UIC-PROVIDER-5.1](PROVIDER.md#uic-provider-51---link-renderer)) so a host router's link component renders it. The `ref` reaches the element.

Implementation: `src/components/link/link.tsx`
Verification: `src/components/link/link.test.tsx`, `e2e/link.spec.ts`

### UIC-LINK-1.2 - Variants

`variant` shall publish `data-variant`: `primary` (the default), drawn in the accent colour, or `secondary`, drawn in the surrounding text colour for links that should not compete with the content around them.

Implementation: `src/components/link/link.tsx`, `labs/reference/link.css`
Verification: `src/components/link/link.test.tsx`, `e2e/link.spec.ts`

### UIC-LINK-1.3 - Standalone links

`isStandalone` shall publish `data-standalone` for a link that stands on its own (a "View all" link, a list of links, a card footer) rather than inside a sentence. The stylesheet may give it its own weight and spacing.

Implementation: `src/components/link/link.tsx`, `labs/reference/link.css`
Verification: `src/components/link/link.test.tsx`, `e2e/link.spec.ts`

### UIC-LINK-1.4 - Underline

`underline` shall publish `data-underline`: `always`, `hover` (underlined while hovered or keyboard focused) or `none`. It defaults to `always` for a link in running text, so colour is never the only thing that tells it from the text around it, and to `hover` for a standalone link.

Implementation: `src/components/link/link.tsx`, `labs/reference/link.css`
Verification: `src/components/link/link.test.tsx`, `e2e/link.spec.ts`

### UIC-LINK-1.5 - Hooks and caller attributes

`Link` shall carry the hooks below, append the caller's `className`, forward `id`, caller `data-*` attributes, the ARIA labelling attributes and its link props (`target`, `rel`, `download`, `title`, `routerOptions`, and the press, hover and focus handlers with the library's event types), and keep its own hook values over caller attributes of the same name.

Implementation: `src/components/link/link.tsx`
Verification: `src/components/link/link.test.tsx`

### UIC-LINK-1.6 - Element swapping

`render(props, state)`, typed `ElementRender<'a', LinkRenderState>`, shall replace the provider's link renderer ([COMPOSITION.md](COMPOSITION.md#uic-composition-11---components-on-building-blocks)): it receives the element's props with the hook classes and data attributes, and an `href` when the link navigates, and a `LinkRenderState` (`isCurrent`, `isHovered`, `isPressed`, `isFocused`, `isFocusVisible`, `isDisabled`).

Implementation: `src/components/link/link.tsx`
Verification: `src/components/link/link.test.tsx`

## UIC-LINK-2 - Navigation

### UIC-LINK-2.1 - Client-side navigation

Under a `UiProvider` with `navigate`, activating a link to the same origin in the same tab shall call `navigate(href, routerOptions)` instead of loading the page, and the anchor's `href` shall be the provider's `useHref(href)` when given. Links that open a new tab, download, or are activated with a modifier key keep the browser's behaviour.

Implementation: `src/components/link/link.tsx`, `src/core/provider.tsx`
Verification: `src/components/link/link.test.tsx`, `e2e/link.spec.ts`

### UIC-LINK-2.2 - New tabs

`isExternal` shall open the link in a new tab (`target="_blank"`) unless the caller gives `target`. A link whose target is `_blank`, by either means, shall add `noopener` and `noreferrer` to the caller's `rel`, keeping the caller's tokens (`rel="nofollow"` becomes `nofollow noopener noreferrer`). This is the library's one `rel` policy for new tabs (`mergeSafeRel` in `src/utils/merge-safe-rel.ts`): [Button](BUTTON.md), [List Row](LIST-ROW.md), [Card](CARD.md) and the [HTML Markup](HTML-MARKUP.md) sanitizer follow it too. The link also shall draw the decorative `external-link` glyph in the `ui-link__external-icon` slot after its content, and add the provider's `opensInNewTab` text ("(opens in a new tab)") in a visually hidden `ui-link__new-tab-label` slot, a [Visually Hidden](VISUALLY-HIDDEN.md) element. A link without `href` or a disabled link opens nothing, so it draws neither the glyph nor the text.

Implementation: `src/components/link/link.tsx`, `src/utils/merge-safe-rel.ts`, `src/core/strings/common.ts`, `src/core/glyphs.tsx`
Verification: `src/components/link/link.test.tsx`, `src/utils/merge-safe-rel.test.ts`, `e2e/link.spec.ts`

### UIC-LINK-2.3 - Links without href

A link without `href` shall render a `<span>` with `role="link"` in the tab sequence that runs `onPress` when pressed or activated with Enter, for an in-page action that reads as a link.

Implementation: `src/components/link/link.tsx`
Verification: `src/components/link/link.test.tsx`, `e2e/link.spec.ts`

### UIC-LINK-2.4 - Disabled links

`isDisabled` shall render the link as a `<span>` with `role="link"` and `aria-disabled="true"`, out of the tab sequence, without `href`, `target` or `rel`, publishing `data-disabled`; presses neither run `onPress` nor navigate.

Implementation: `src/components/link/link.tsx`
Verification: `src/components/link/link.test.tsx`, `e2e/link.spec.ts`

## UIC-LINK-3 - Accessibility

### UIC-LINK-3.1 - Role and name

A link shall have the `link` role (native on an `<a href>`, set on a `<span>`) and be named by its content, including the hidden new-tab text; the external glyph is hidden from assistive technology. The caller's `aria-describedby` stays first in the link's description when a trigger around it, such as a [Hover Card](HOVER-CARD.md)'s, adds its own.

Implementation: `src/components/link/link.tsx`
Verification: `src/components/link/link.test.tsx`, `e2e/link.spec.ts`

### UIC-LINK-3.2 - Keyboard

An enabled link shall be one tab stop, and Enter shall follow it (or run `onPress` on a link without `href`). Space does not activate a link, as with native links.

Implementation: `src/components/link/link.tsx`
Verification: `src/components/link/link.test.tsx`, `e2e/link.spec.ts`

### UIC-LINK-3.3 - States

A link shall publish its states: `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-disabled`, and `data-current` while it has `aria-current` (the current page in a list of links).

Implementation: `src/components/link/link.tsx`
Verification: `src/components/link/link.test.tsx`, `e2e/link.spec.ts`

## Hooks

| Hook                     | Kind      | Values                    | Description                                               |
| ------------------------ | --------- | ------------------------- | --------------------------------------------------------- |
| `ui-link`                | root      |                           | The `<a>`, or a `<span>` without `href` or when disabled. |
| `ui-link__external-icon` | slot      |                           | The `external-link` glyph of a link to a new tab.         |
| `ui-link__new-tab-label` | slot      |                           | Visually hidden "(opens in a new tab)" text.              |
| `data-variant`           | attribute | `primary`, `secondary`    | Emphasis.                                                 |
| `data-underline`         | attribute | `always`, `hover`, `none` | When the link is underlined.                              |
| `data-standalone`        | state     | `true`                    | The link stands on its own, outside running text.         |
| `data-hovered`           | state     | `true`                    | Pointer over the link (React Aria).                       |
| `data-pressed`           | state     | `true`                    | Being pressed (React Aria).                               |
| `data-focused`           | state     | `true`                    | Focused (React Aria).                                     |
| `data-focus-visible`     | state     | `true`                    | Keyboard focus (React Aria).                              |
| `data-current`           | state     | `true`                    | The link has `aria-current` (React Aria).                 |
| `data-disabled`          | state     | `true`                    | Disabled (React Aria).                                    |
