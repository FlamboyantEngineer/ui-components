# Measurement

Two hooks measure elements for components and hosts: `useResizeObserver` observes elements' sizes, and `useElementSize` reads one element's size into state. Both use the observer and animation frames of the element's own window, so content rendered into an iframe is measured there.

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
Verification: `src/utils/use-element-size.test.ts`

### UIC-MEASUREMENT-2.2 - Boxes and parent

`box` shall choose `content-box` (the default), `border-box`, or `client` (`clientWidth` × `clientHeight`, observed in both boxes so a scrollbar that appears or leaves updates it); `parent` measures the element's parent. Switching box rereads the last report instead of waiting for another resize.

Implementation: `src/utils/use-element-size.ts`
Verification: `src/utils/use-element-size.test.ts`

### UIC-MEASUREMENT-2.3 - Disabled and unsupported

With `enabled={false}`, or in a window without `ResizeObserver`, the hook shall return `null` and observe nothing; disabling disconnects and cancels a pending frame, and re-enabling starts unmeasured.

Implementation: `src/utils/use-element-size.ts`
Verification: `src/utils/use-element-size.test.ts`

### UIC-MEASUREMENT-2.4 - Own window

Content in an iframe shall be measured with the iframe window's observer and animation frames.

Implementation: `src/utils/use-element-size.ts`
Verification: `src/utils/use-element-size.test.ts`

### UIC-MEASUREMENT-2.5 - Changing elements

An element held in state (through a callback ref) shall be measured when it mounts; a replacement starts unmeasured, ignores late reports from the element it replaced and gets its first measurement at once; and when the element leaves, the hook returns `null` and disconnects.

Implementation: `src/utils/use-element-size.ts`
Verification: `src/utils/use-element-size.test.ts`
