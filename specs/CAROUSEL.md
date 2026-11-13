# Carousel

`Carousel` shows a set of slides one at a time, such as featured items or a sequence of pictures, following the ARIA carousel pattern. Each child is one slide. The reader moves with previous and next buttons, picks a slide from dots or thumbnails, or uses the arrow keys; with `autoplay` the slides also advance on their own, pausing whenever the reader points at or works inside the carousel, and a button stops rotation for good.

## UIC-CAROUSEL-1 - Slides and navigation

### UIC-CAROUSEL-1.1 - One slide at a time

`Carousel` shall render a `<section>` with `aria-roledescription` set to the provider's `carousel` string, named by the caller's `aria-label` or `aria-labelledby`, holding a viewport (`ui-carousel__viewport`) with one slide (`ui-carousel__slide`) per child, in order. Each slide is a `role="group"` with `aria-roledescription` set to the provider's `slide` string and named by its position (`stepOfTotal`, `2 of 5`). Only the shown slide is visible, carrying `data-current`; the others are `hidden` and `inert`, so they stay mounted but cannot be reached. A slide keeps its element across renders by its child's key. The reference stylesheet stacks every slide in the viewport's one grid cell and keeps the hidden ones' boxes without drawing them, so all pages take the size of the largest at the available width and moving between them shifts neither the viewport, its controls nor the content below; pictures fit whole in one frame shape (`object-fit: contain`) and captions wrap rather than clip.

Implementation: `src/components/carousel/carousel.tsx`, `src/core/strings/presentation.ts`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-1.2 - Previous and next

Before the viewport, the controls (`ui-carousel__controls`) shall hold a previous button (`ui-carousel__previous`, `chevron-left` glyph, `chevron-right` right to left, provider string `previousSlide`) and a next button (`ui-carousel__next`, `chevron-right`, `chevron-left` right to left, `nextSlide`), both controlling the viewport (`aria-controls`). At the first and last slides they are disabled but stay focusable (`aria-disabled`), unless `loop` is set, which makes previous on the first slide show the last and next on the last show the first. `index` (controlled) or `defaultIndex` (uncontrolled, `0` by default) chooses the shown slide, kept within the slides, and `onIndexChange` receives the index of each slide moved to.

Implementation: `src/components/carousel/carousel.tsx`, `src/components/carousel/carousel-parts.tsx`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-1.3 - Dots and thumbnails

`pagination` shall publish `data-pagination` and add, after the viewport, a group (`ui-carousel__pagination`) named by the provider's `chooseSlide` string with one React Aria button per slide, named by `goToSlide` (`Slide 3`) and controlling the viewport: an empty dot (`ui-carousel__dot`) with `dots` (the default), or the content `renderThumbnail(index)` returns (`ui-carousel__thumbnail`) with `thumbnails`, whose images should be decorative since the button is named. The shown slide's button carries `aria-current` and `data-current`; pressing a button shows its slide. `none` draws no pagination.

Implementation: `src/components/carousel/carousel-parts.tsx`, `src/core/strings/presentation.ts`, `labs/reference/carousel.css`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-1.4 - A single slide

With one slide or none, or no more slides than a page shows (UIC-CAROUSEL-1.5), `Carousel` shall draw no controls, no pagination and no rotation, and not rotate.

Implementation: `src/components/carousel/carousel.tsx`
Verification: `src/components/carousel/carousel.test.tsx`

### UIC-CAROUSEL-1.5 - Several slides a page

`slidesPerPage` (1 by default; a value under 1 or not a number counts as 1, a fraction is truncated) shall show that many slides together, from `index` on, each carrying `data-current` and its column among them (1 up) in `--ui-carousel-slot`; the root carries `--ui-carousel-per-page`, so the stylesheet lays the shown slides side by side while the hidden ones keep stacking in the first column (UIC-CAROUSEL-1.1). `index` is always the first shown slide. A move (the previous and next buttons, the arrow keys, a swipe and rotation) advances `slidesPerMove` slides (`slidesPerPage` by default), stopping at the last start, `count − slidesPerPage`, so the last page is full and may overlap the one before it: with 7 slides, 3 a page and 2 a move, the pages start at 0, 2 and 4. Without `loop` the next button is disabled on the last start and the previous button on the first slide; with `loop`, next on the last start shows the first page and previous on the first slide shows the last. A controlled or default `index` past the last start shows the last page. Dots and thumbnails are one per page, each named by `goToSlide` with the page's first slide and showing that page; the page holding the shown slides is current, and `renderThumbnail` receives the page's first slide. Every shown slide stays named and reachable; slides off the page are hidden and inert. Changing `slidesPerPage` or `slidesPerMove` keeps each slide's element by its key, and focus inside a slide that stays shown stays there.

Implementation: `src/components/carousel/carousel.tsx`, `src/components/carousel/carousel-pages.ts`, `src/components/carousel/carousel-viewport.tsx`, `src/components/carousel/carousel-parts.tsx`, `labs/reference/carousel.css`
Verification: `src/components/carousel/carousel.test.tsx`, `src/components/carousel/carousel-pages.test.ts`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-1.6 - Mounting slides when shown

`mountSlides` shall choose which slides render their content: `all` (the default) renders every slide, so a hidden slide's content is ready and sized; `visited` renders a slide's content once it is first shown and keeps it while the slide stays (its group carries `data-mounted`), so content inside a visited slide (a draft, a scroll position, an editor) survives moving away and back. A slide not yet shown renders its empty group, hidden and inert. Visits follow slide keys: a removed slide forgets its visit, a slide under a reused position starts unvisited, and looping or a controlled `index` mount only what they show. Rotation, focus recovery (UIC-CAROUSEL-2.2) and reduced motion work as with every slide mounted. Because an unmounted slide has no content to measure, the viewport takes the size of the slides mounted so far (UIC-CAROUSEL-1.1): a host whose slides differ in height gives the viewport a fixed size or aspect ratio so visiting a taller slide does not shift the page.

Implementation: `src/components/carousel/carousel-viewport.tsx`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

## UIC-CAROUSEL-2 - Keyboard and focus

### UIC-CAROUSEL-2.1 - Arrow keys

With focus inside the carousel, Arrow Left and Arrow Right shall show the previous and next slide (mirrored in a right-to-left locale), with the same ends or looping as the buttons. Presses with Control, Command or Alt, presses inside an element that uses the keys itself (an input, a text area, a select, a slider, or editable content with any `contenteditable` value but `false`), and presses a widget inside a slide already handled (its default prevented) are left alone.

Implementation: `src/components/carousel/carousel.tsx`, `src/utils/is-editable-target.ts`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-2.2 - Focus follows a hidden slide

When the shown slide changes while focus is inside the slide being hidden, focus shall move to the newly shown slide (focusable with `tabIndex="-1"`), so it is never lost to the page. This holds however the shown slide changes: a move of the reader's, a new controlled `index` from the host, or the removal of the focused slide (the first, the last, or one whose index stays the same), and for focus deep inside the slide, also within a shadow root. Focus on a control stays there, and once focus has left the slides for anywhere else, a later change of the shown slide does not take it back.

Implementation: `src/components/carousel/carousel.tsx`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-2.3 - Swiping

With `allowsSwiping`, the root shall carry `data-swipeable` and a touch, pen or mouse drag on the viewport that travels at least 10 pixels mostly across the slides becomes a swipe: the viewport captures the pointer, carries `data-swiping` and the drag's horizontal offset in `--ui-carousel-swipe-offset` (in pixels, for the stylesheet to follow the finger), and the drag selects no text. Released after travelling 48 pixels or a fifth of the viewport's width, whichever is less, it moves one step (UIC-CAROUSEL-1.5): toward the end of the slides for a drag toward the reading start (leftward left to right, rightward right to left), with the buttons' ends and looping. A shorter drag, a cancelled pointer, a lost pointer capture or a second finger (a pinch) moves nothing. A press released where the viewport never saw it, before the swipe took the pointer, ends there too: the pointer moving again with no button held carries no swipe offset, and the same pointer pressing again starts a new drag. A drag that travels mostly along the page is left to the page's scrolling, and the viewport's `touch-action` (`pan-y pinch-zoom`) keeps vertical scrolling and pinch zoom the browser's. A drag that starts on a link, a button, a form control, a slider, editable content, draggable content or an element marked `data-carousel-no-swipe` stays that element's. A press that ends a swipe is no click on what it started over. Rotation pauses while a swipe is under way. Without `allowsSwiping`, or with nothing to move to, the viewport takes no swipe.

Implementation: `src/components/carousel/use-carousel-swipe.ts`, `src/components/carousel/carousel-viewport.tsx`, `src/components/carousel/carousel.tsx`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

## UIC-CAROUSEL-3 - Automatic rotation

### UIC-CAROUSEL-3.1 - Rotating

With `autoplay`, the carousel shall show the next slide every `interval` milliseconds (5000 by default; a value that is not a positive number uses the default), going from the last slide back to the first whatever `loop` says; every slide gets a whole interval, however it was reached. While it rotates, the root carries `data-rotating` and the viewport's live region is `off`; otherwise it is `polite`, so slides the reader moves to are announced but automatic changes are not.

Implementation: `src/components/carousel/carousel.tsx`, `src/components/carousel/use-carousel-autoplay.ts`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-3.2 - Pausing on hover and focus

Rotation shall pause while a mouse pointer rests on the carousel and while focus is inside it, except on the rotation button itself, and resume when both end.

Implementation: `src/components/carousel/use-carousel-autoplay.ts`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-3.3 - Rotation button

With `autoplay`, the controls shall start with a rotation button (`ui-carousel__rotation`) that stops rotation (provider string `stopSlideRotation`, `pause` glyph) and, once stopped, restarts it (`startSlideRotation`, `play` glyph). A stopped carousel stays stopped, hover and focus aside, until the reader restarts it.

Implementation: `src/components/carousel/carousel-parts.tsx`, `src/components/carousel/use-carousel-autoplay.ts`, `src/core/glyphs.tsx`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-3.4 - Reduced motion

When the reader prefers reduced motion (`prefers-reduced-motion: reduce`), an `autoplay` carousel shall be stopped, with the button offering to start it. The carousel follows the preference while the page is open, stopping or resuming when the reader changes it, until the reader starts or stops rotation with the button; their choice then holds. The server renders the carousel rotating and the client applies the preference after hydration, so the server HTML and the first client render agree.

Implementation: `src/components/carousel/use-carousel-autoplay.ts`, `src/utils/prefers-reduced-motion.ts`
Verification: `src/components/carousel/carousel.test.tsx`, `src/utils/prefers-reduced-motion.test.tsx`, `e2e/carousel.spec.ts`

## UIC-CAROUSEL-4 - Accessibility and hooks

### UIC-CAROUSEL-4.1 - ARIA carousel pattern

The carousel shall follow the ARIA carousel pattern: a named region described as a carousel, its controls before the slides in reading order, named slide groups, buttons that name what they do and control the slides, and no automatic change announced while rotating.

Implementation: `src/components/carousel/carousel.tsx`, `src/components/carousel/carousel-parts.tsx`
Verification: `e2e/carousel.spec.ts`

### UIC-CAROUSEL-4.2 - Hooks and caller attributes

`Carousel` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its root.

Implementation: `src/components/carousel/carousel.tsx`
Verification: `src/components/carousel/carousel.test.tsx`

## Hooks

| Hook                         | Kind      | Values                       | Description                                                   |
| ---------------------------- | --------- | ---------------------------- | ------------------------------------------------------------- |
| `ui-carousel`                | root      |                              | The carousel (`<section>`).                                   |
| `ui-carousel__controls`      | slot      |                              | The rotation, previous and next buttons.                      |
| `ui-carousel__rotation`      | slot      |                              | The button that stops or starts rotation (also `ui-button`).  |
| `ui-carousel__previous`      | slot      |                              | The previous button (also `ui-button`).                       |
| `ui-carousel__next`          | slot      |                              | The next button (also `ui-button`).                           |
| `ui-carousel__viewport`      | slot      |                              | The live region holding the slides.                           |
| `ui-carousel__slide`         | slot      |                              | Each slide's group.                                           |
| `ui-carousel__pagination`    | slot      |                              | The group of slide pickers.                                   |
| `ui-carousel__dot`           | slot      |                              | A slide's dot button.                                         |
| `ui-carousel__thumbnail`     | slot      |                              | A slide's thumbnail button.                                   |
| `data-pagination`            | attribute | `dots`, `thumbnails`, `none` | How the reader picks a slide directly.                        |
| `data-swipeable`             | attribute | `true`                       | On the root: a swipe moves between pages.                     |
| `data-swiping`               | state     | `true`                       | On the viewport: a swipe is under way.                        |
| `data-mounted`               | state     | `true`                       | On a slide with `mountSlides="visited"`: its content renders. |
| `--ui-carousel-per-page`     | property  |                              | On the root: the slides a page shows.                         |
| `--ui-carousel-slot`         | property  |                              | On a shown slide: its column on the page, from 1.             |
| `--ui-carousel-swipe-offset` | property  |                              | On the viewport during a swipe: the drag's horizontal offset. |
| `data-rotating`              | state     | `true`                       | The carousel is advancing on its own.                         |
| `data-current`               | state     | `true`                       | The shown slide, and its dot or thumbnail.                    |
| `data-hovered`               | state     | `true`                       | Pointer over a dot or thumbnail (React Aria).                 |
| `data-pressed`               | state     | `true`                       | A dot or thumbnail is pressed (React Aria).                   |
| `data-focused`               | state     | `true`                       | A dot or thumbnail has focus (React Aria).                    |
| `data-focus-visible`         | state     | `true`                       | A dot or thumbnail has keyboard focus (React Aria).           |
