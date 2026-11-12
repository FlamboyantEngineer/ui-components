# Measurement

Four hooks measure for components and hosts: `useResizeObserver` observes elements' sizes, `useElementSize` reads one element's size into state, `useWidestTextWidth` measures the widest of several texts in an element's font, and `useInView` reports whether an element is visible. The first two use the observer and animation frames of the element's own window, so content rendered into an iframe is measured there.

## UIC-MEASUREMENT-1 - Resize observer

### UIC-MEASUREMENT-1.1 - Shared observation

`useResizeObserver(targets, onResize)` shall observe the committed target elements (elements, refs, or elements with a box) with one observer per window and box, observe an element listed twice once, and call the latest `onResize`. A fresh targets array or callback does not restart the observation of unchanged elements.

Implementation: `src/utils/use-resize-observer.ts`
Verification: `src/utils/use-resize-observer.test.ts`

### UIC-MEASUREMENT-1.2 - Changing targets

Targets, or a function returning them, shall be resolved after every commit: removed elements are unobserved, new ones observed, and an observer left with no targets disconnects. Reports arriving after a disconnect or unmount are ignored.

Implementation: `src/utils/use-resize-observer.ts`
Verification: `src/utils/use-resize-observer.test.ts`

### UIC-MEASUREMENT-1.3 - Windows and boxes

Each element shall be observed with the `ResizeObserver` of its own window; an element in a window without one is skipped, never observed with another window's constructor. One element may be observed in the content box and the border box at once.

Implementation: `src/utils/use-resize-observer.ts`
Verification: `src/utils/use-resize-observer.test.ts`

## UIC-MEASUREMENT-2 - Element size

### UIC-MEASUREMENT-2.1 - Reading a size

`useElementSize(target)` shall return `null` until the first report, apply the first report at once, coalesce later reports to one update per animation frame (the last report wins), and keep the same object when the size is unchanged, so the result is a stable effect dependency.

Implementation: `src/utils/use-element-size.ts`
Verification: `src/utils/use-element-size.test.tsx`

### UIC-MEASUREMENT-2.2 - Boxes and parent

`box` shall choose `content-box` (the default), `border-box`, or `client` (`clientWidth` × `clientHeight`, observed in both boxes so a scrollbar that appears or leaves updates it); `parent` measures the element's parent. Switching box rereads the last report instead of waiting for another resize.

Implementation: `src/utils/use-element-size.ts`
Verification: `src/utils/use-element-size.test.tsx`

### UIC-MEASUREMENT-2.3 - Disabled and unsupported

With `enabled={false}`, or in a window without `ResizeObserver`, the hook shall return `null` and observe nothing; disabling disconnects and cancels a pending frame, and re-enabling starts unmeasured.

Implementation: `src/utils/use-element-size.ts`
Verification: `src/utils/use-element-size.test.tsx`

### UIC-MEASUREMENT-2.4 - Own window

Content in an iframe shall be measured with the iframe window's observer and animation frames.

Implementation: `src/utils/use-element-size.ts`
Verification: `src/utils/use-element-size.test.tsx`

### UIC-MEASUREMENT-2.5 - Changing elements

An element held in state (through a callback ref), or held by a ref, which is read again after every commit, shall be measured when it mounts; a replacement starts unmeasured, ignores late reports from the element it replaced and gets its first measurement at once; and when the element leaves, the hook returns `null` and disconnects.

Implementation: `src/utils/use-element-size.ts`
Verification: `src/utils/use-element-size.test.tsx`

## UIC-MEASUREMENT-3 - Text width

### UIC-MEASUREMENT-3.1 - Widest text

`useWidestTextWidth(ref, texts, fontKey)` shall return the width, in whole pixels rounded up, of the widest of `texts` drawn in the computed font of the ref's element, measured on an offscreen canvas after the element mounts. It measures each complete string, including embedded newlines, and returns zero for an empty list. It measures again when the set of texts changes, when its optional `fontKey` changes (a value that changes when the element's font may have, such as a choice a stylesheet draws in its own font), once the document's fonts are ready, and again each time fonts finish loading in the element's document later on (a stylesheet or `FontFace` added after mount, through `listenFontsLoaded`), never for a fresh array holding the same texts; it ignores font readiness and stops listening after unmount, and returns `null` where no offscreen canvas is available. Components publish the result as a measured property so a control keeps its width as the shown text changes.

Implementation: `src/utils/use-widest-text-width.ts`, `src/utils/listen-fonts-loaded.ts`
Verification: `src/utils/use-widest-text-width.test.tsx`, `src/components/select-field/select-field.test.tsx`, `src/components/select-field/select-field-font.test.tsx`

## UIC-MEASUREMENT-4 - Visibility

### UIC-MEASUREMENT-4.1 - In view

`useInView(target)` shall return whether any part of the target element is visible in the viewport after clipping by the scrolling ancestors it sits in, from the `IntersectionObserver` of the element's own window: false until the first report, then each report for that element. Replacing the target, disabling or unmounting disconnects the old observer; its later reports are ignored. Components use it to load more content as it scrolls into view ([Load More](LOAD-MORE.md#uic-load-more-17---loading-on-view)) and hosts to render content lazily.

Implementation: `src/utils/use-in-view.ts`
Verification: `src/utils/use-in-view.test.ts`, `e2e/load-more.spec.ts`

### UIC-MEASUREMENT-4.2 - Targets, disabled and unsupported

The target shall be an element or a ref, which is read again after every commit: an element that mounts late or replaces the previous one under the same ref is observed instead, starting out of view. With `enabled={false}`, without an element, or in a window without `IntersectionObserver`, the hook shall return false and observe nothing; disabling disconnects, and re-enabling starts out of view until the next report.

Implementation: `src/utils/use-in-view.ts`
Verification: `src/utils/use-in-view.test.ts`

### UIC-MEASUREMENT-4.3 - Scroll offset

With `scrollOffset`, the hook shall observe the target against its nearest scrolling ancestor (the viewport when it has none), extended past the visible area's end and sides by that many of the container's heights or widths (React Aria's `scrollOffset`: 1 is one full height; negative values count as 0), so content can load before the reader reaches it. Vertical distances use the container's height and horizontal distances its width, updating when the container or viewport resizes. Without it, the hook reports actual visibility.

Implementation: `src/utils/use-in-view.ts`
Verification: `src/utils/use-in-view.test.ts`, `e2e/load-more.spec.ts`
