# Scroll Strip

`useScrollStripOverflow` serves a strip that scrolls along one axis, such as a row of tabs or tools: it reports whether content is hidden past either edge, so the stylesheet can draw a fade there, and lets the vertical wheel scroll a horizontal strip. Scrolling stays free: no snapping, paging or stepper buttons.

## UIC-SCROLL-STRIP-1 - Strip overflow

### UIC-SCROLL-STRIP-1.1 - Overflow edges

The hook shall report `overflow.start` while the strip is scrolled more than one pixel from its start and `overflow.end` while more than one pixel of content lies past its end, a partly visible item included, along the strip's `orientation` (`horizontal` by default, `vertical`).

Implementation: `src/utils/use-scroll-strip-overflow.ts`
Verification: `src/utils/use-scroll-strip-overflow.test.ts`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-STRIP-1.2 - Measurement

Measurements shall coalesce to one geometry read per animation frame and never read layout synchronously. `syncOverflow` schedules one, for the strip's scroll handler and content changes the host knows of; resizes of the strip or its direct children, children mounting or unmounting and an orientation change resync on their own, also for a strip element that mounts after the first render or replaces the first one. Unmounting cancels the pending frame and disconnects the observers.

Implementation: `src/utils/use-scroll-strip-overflow.ts`
Verification: `src/utils/use-scroll-strip-overflow.test.ts`

### UIC-SCROLL-STRIP-1.3 - Wheel scrolling

A horizontal strip shall turn wheel input on it into horizontal scrolling along the dominant wheel axis, in pixels, lines (16 pixels) or pages (the visible width), clamped to the scroll range, and call `onWheelScroll` after scrolling. It leaves the wheel alone with Ctrl or Meta held, inside a menu, listbox or dialog open in the strip, at the end it is scrolling toward, and for a vertical strip. A strip element that mounts after the first render takes wheel input too.

Implementation: `src/utils/use-scroll-strip-overflow.ts`
Verification: `src/utils/use-scroll-strip-overflow.test.ts`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-STRIP-1.4 - Right to left

In a right-to-left strip, edges shall be reported from the inline start and the wheel shall scroll toward the inline end.

Implementation: `src/utils/use-scroll-strip-overflow.ts`
Verification: `src/utils/use-scroll-strip-overflow.test.ts`
