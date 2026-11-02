# Scroll Strip

`useScrollStripOverflow` serves a strip that scrolls along one axis, such as a row of tabs or tools: it reports whether content is hidden past either edge, so the stylesheet can draw a fade there, and lets the vertical wheel scroll a horizontal strip, keeping the wheel from the page while it overflows. Scrolling stays free: no snapping, paging or stepper buttons.

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

A horizontal strip shall turn wheel input on it into horizontal scrolling along the dominant wheel axis, in pixels, lines (16 pixels) or pages (the visible width), clamped to the scroll range, and call `onWheelScroll` after scrolling. While the strip overflows, it owns wheel input over it at both bounds as well: wheel travel toward a bound the strip already reached is cancelled, so the page behind never scrolls while the pointer is over the strip, whether the input is a vertical mouse wheel or a horizontal or diagonal trackpad swipe. A strip that fits (nothing overflows) leaves the wheel to the page. It also leaves the wheel alone with Ctrl or Meta held (browser zoom), inside a menu, listbox or dialog open in the strip (which scrolls itself), for a vertical strip, and with `wheel: false`, for a strip that already takes the wheel and only needs its edges measured. A strip element that mounts after the first render takes wheel input too.

Implementation: `src/utils/use-scroll-strip-overflow.ts`
Verification: `src/utils/use-scroll-strip-overflow.test.ts`, `e2e/scroll-region.spec.ts`

### UIC-SCROLL-STRIP-1.4 - Right to left

In a right-to-left strip, edges shall be reported from the inline start. Vertical wheel travel shall scroll toward the inline end (leftward), while horizontal wheel travel follows the pointer as in a native scroller: a swipe left scrolls leftward, toward the inline end, and a swipe right scrolls back toward the inline start.

Implementation: `src/utils/use-scroll-strip-overflow.ts`
Verification: `src/utils/use-scroll-strip-overflow.test.ts`

## UIC-SCROLL-STRIP-2 - Edge controls

### UIC-SCROLL-STRIP-2.1 - One part for every scrolling strip

Toolbar Scroller, Toolbar Row and Tabs shall draw the edge controls of their scrolling strip with one internal `ScrollStrip` part, under their own hook classes. Around the strip its owner renders, the part draws at each edge a decorative fade (`aria-hidden`), when the owner asks for fades, then a scroll button (a `ghost` [Icon Button](BUTTON.md) named by the provider's `scrollBackward` or `scrollForward` string, out of the tab order), when it asks for buttons, in the order start fade, start button, strip, end fade, end button. Each carries `data-edge` and the native `hidden` attribute while its edge hides nothing, as `useToolbarScroll` measures it with this hook; pressing a button pages the strip toward its edge. Adding or removing the controls never remounts the strip. `isOverflowing(element, axis)` is the one test, also used by tab lists, code blocks and truncation tooltips, for content more than one pixel past an element's box.

The reference sheets draw the toolbar strips' buttons as discreet chevrons over their fades: no border or fill at rest, a soft fill and full-strength glyph on hover or press, and the button's own focus ring. Each fade lies above the strip's tools and under its button, its inner half solid canvas behind the chevron.

Implementation: `src/components/toolbar-scroller/scroll-strip.tsx`, `src/components/button/scroll-strip-button.tsx`, `src/components/toolbar-scroller/use-toolbar-scroll.ts`, `src/utils/is-overflowing.ts`, `labs/reference/layout.css`, `labs/reference/toolbar-scroller.css`
Verification: `src/components/toolbar-scroller/scroll-strip.test.tsx`, `e2e/layout.spec.ts`
