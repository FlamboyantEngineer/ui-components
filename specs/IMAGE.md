# Image

`Image` is a general-purpose image that owns its request: it forwards the native responsive, lazy-loading and decoding attributes to an `<img>`, publishes whether the image is loading, loaded or failed, shows caller content while it loads and in its place once it fails, tries one backup address, and can offer a retry. [Avatar](AVATAR.md) and [Media Viewer](MEDIA-VIEWER.md) keep their own pictures; the request tracking is shared with Avatar.

## UIC-IMAGE-1 - Contract

### UIC-IMAGE-1.1 - Element and native attributes

`Image` shall render a `<span>` (`ui-image`) holding an `<img>` (`ui-image__img`) while the image is loading or loaded. The `<img>` receives `src`, `srcSet`, `sizes`, `loading`, `decoding`, `crossOrigin`, `referrerPolicy`, `width` and `height` unchanged, so the browser chooses, fetches, lazily loads and decodes the image itself; the component never fetches it through script.

Implementation: `src/components/image/image.tsx`
Verification: `src/components/image/image.test.tsx`, `e2e/image.spec.ts`

### UIC-IMAGE-1.2 - Text alternative

`alt` is required: the `<img>` carries it, so a meaningful image is named by it. An empty `alt` marks the image decorative: the `<img>` has `alt=""` and its fallback is hidden from assistive technology.

Implementation: `src/components/image/image.tsx`
Verification: `src/components/image/image.test.tsx`, `e2e/image.spec.ts`

### UIC-IMAGE-1.3 - Loading status

The root shall publish `data-status`: `loading` from a new request until the image loads or fails, then `loaded`, or `error` once every source failed. `onLoadingStatusChange` is called with the status once on mount and once each time it changes. A blank `src` without a `fallbackSrc` is `error` at once.

Implementation: `src/components/image/image.tsx`, `src/utils/use-image-loading.ts`
Verification: `src/components/image/image.test.tsx`, `e2e/image.spec.ts`

### UIC-IMAGE-1.4 - Placeholder

While the image loads, `placeholder` content shall render in a `ui-image__placeholder` slot after the `<img>`, hidden from assistive technology; the `<img>` keeps the image's name. The slot leaves when the image loads or fails. Content that renders nothing draws no slot.

Implementation: `src/components/image/image.tsx`, `labs/reference/image.css`
Verification: `src/components/image/image.test.tsx`, `e2e/image.spec.ts`

### UIC-IMAGE-1.5 - Reserved dimensions

`width` and `height` shall set the `<img>`'s attributes, so the page reserves the image's box before it loads, and publish `--ui-image-width` and `--ui-image-height` (in pixels) on the root, so the stylesheet can give the placeholder and the fallback the same box. A missing or non-finite dimension publishes nothing.

Implementation: `src/components/image/image.tsx`, `labs/reference/image.css`
Verification: `src/components/image/image.test.tsx`, `e2e/image.spec.ts`

### UIC-IMAGE-1.6 - Hooks and caller attributes

`Image` shall carry the hooks below, append the caller's `className` to its root, and forward `id`, `ref` (the root `<span>`) and caller `data-*` attributes to it; caller attributes never replace a hook attribute.

Implementation: `src/components/image/image.tsx`
Verification: `src/components/image/image.test.tsx`

## UIC-IMAGE-2 - Requests

### UIC-IMAGE-2.1 - Settled before listening

An image the browser settled before the component could listen, such as one cached or loaded before hydration, shall count as loaded, or as failed when it has no image data. A lazy image the browser has not fetched yet stays loading until it settles.

Implementation: `src/components/image/image.tsx`, `src/utils/use-image-loading.ts`
Verification: `src/components/image/image.test.tsx`, `e2e/image.spec.ts`

### UIC-IMAGE-2.2 - New requests

A change to `src`, `srcSet`, `sizes`, `crossOrigin` or `referrerPolicy` shall start a new request with its own `<img>`, back at `src` and `loading`, so a failure of the old request never carries over; a load or error event of a request that has since changed is ignored. Giving the same values again keeps the request and its `<img>`.

Implementation: `src/components/image/image.tsx`, `src/utils/use-image-loading.ts`
Verification: `src/components/image/image.test.tsx`

### UIC-IMAGE-2.3 - Backup address

When `src` fails, or is blank, a `fallbackSrc` shall be requested once, without `srcSet` or `sizes`, in the same render, so the status goes from `loading` to `loading` without passing `error`. When the backup fails too, the image is `error`: no address is requested again until the request changes or the reader retries, so failures never loop.

Implementation: `src/components/image/image.tsx`
Verification: `src/components/image/image.test.tsx`, `e2e/image.spec.ts`

### UIC-IMAGE-2.4 - Fallback

Once every source failed, the `<img>` shall leave and a `ui-image__fallback` slot take its place, holding the caller's decorative `fallback` content. A meaningful image's fallback has `role="img"` and is named by `alt`, so the reader hears the image's name once and not the fallback content; a decorative image's fallback is hidden from assistive technology.

Implementation: `src/components/image/image.tsx`, `labs/reference/image.css`
Verification: `src/components/image/image.test.tsx`, `e2e/image.spec.ts`

### UIC-IMAGE-2.5 - Retry

With `showRetry`, a failed image shall offer a button (`ui-image__retry`, the provider's `imageRetry` text, `Reload image` in English) after its fallback that requests the image again from `src`, with a fresh `<img>`, and moves to the backup address again if `src` still fails.

Implementation: `src/components/image/image.tsx`, `src/core/strings/media.ts`
Verification: `src/components/image/image.test.tsx`, `e2e/image.spec.ts`

## Hooks

| Hook                    | Kind      | Values                       | Description                                               |
| ----------------------- | --------- | ---------------------------- | --------------------------------------------------------- |
| `ui-image`              | root      |                              | The `<span>` around the image.                            |
| `ui-image__img`         | slot      |                              | The `<img>`, while loading or loaded.                     |
| `ui-image__placeholder` | slot      |                              | Decorative content shown while the image loads.           |
| `ui-image__fallback`    | slot      |                              | What shows in the image's place once every source failed. |
| `ui-image__retry`       | slot      |                              | The button that requests a failed image again.            |
| `data-status`           | attribute | `loading`, `loaded`, `error` | Where the image's request stands.                         |
| `--ui-image-width`      | property  |                              | The image's `width`, in pixels.                           |
| `--ui-image-height`     | property  |                              | The image's `height`, in pixels.                          |
