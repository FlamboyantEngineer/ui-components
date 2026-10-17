# Enter and Exit

`useEnterExit(ref, isOpen)` gives an element that the library or a host shows and hides the entering and exiting states React Aria overlays publish, so one stylesheet animates both the same way: `data-entering` while the element appears, and `data-exiting` while it leaves, kept mounted until its exit ends. The hook only times the phases; the component that renders the element publishes them as its `data-entering` and `data-exiting` states ([HOOK-CONTRACT.md](HOOK-CONTRACT.md#uic-hooks-22---states)), and the stylesheet draws the animation. [Banner](BANNER.md#uic-banner-32---entering-exiting-and-hidden) takes both states.

## UIC-ENTER-EXIT-1 - Phases

### UIC-ENTER-EXIT-1.1 - Mounting

`isMounted` shall be true while `isOpen` is true and, after `isOpen` turns false, until the element's exit ends; it starts false when the element starts closed. An element with no running animation enters and exits within the commit that opens or closes it, before the browser paints, so a component without a stylesheet behaves as if it rendered conditionally.

Implementation: `src/utils/use-enter-exit.ts`
Verification: `src/utils/use-enter-exit.test.tsx`

### UIC-ENTER-EXIT-1.2 - Entering

`isEntering` shall be true from the commit that shows the element (mounting it open, or opening it again after its exit ended) until every CSS animation and transition running on the element (`ref`'s element, not its descendants) at the end of that commit has finished.

Implementation: `src/utils/use-enter-exit.ts`
Verification: `src/utils/use-enter-exit.test.tsx`, `e2e/banner.spec.ts`

### UIC-ENTER-EXIT-1.3 - Exiting

When `isOpen` turns false, `isExiting` shall be true and the element stay mounted until every animation and transition running on it once it publishes the exiting state has finished or been cancelled; it then unmounts in the same frame, so it never paints again in its resting style.

Implementation: `src/utils/use-enter-exit.ts`
Verification: `src/utils/use-enter-exit.test.tsx`, `e2e/banner.spec.ts`

### UIC-ENTER-EXIT-1.4 - Reopening while exiting

When `isOpen` turns true again during the exit, the element shall stay mounted, stop exiting without entering again, and ignore the end of the exit animations it was waiting for.

Implementation: `src/utils/use-enter-exit.ts`
Verification: `src/utils/use-enter-exit.test.tsx`
