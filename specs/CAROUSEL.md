# Carousel

`Carousel` shows a set of slides one at a time, such as featured items or a sequence of pictures, following the ARIA carousel pattern. Each child is one slide. The reader moves with previous and next buttons, picks a slide from dots or thumbnails, or uses the arrow keys; with `autoplay` the slides also advance on their own, pausing whenever the reader points at or works inside the carousel, and a button stops rotation for good.

## UIC-CAROUSEL-1 - Slides and navigation

### UIC-CAROUSEL-1.1 - One slide at a time

`Carousel` shall render a `<section>` with `aria-roledescription` set to the provider's `carousel` string, named by the caller's `aria-label` or `aria-labelledby`, holding a viewport (`ui-carousel__viewport`) with one slide (`ui-carousel__slide`) per child, in order. Each slide is a `role="group"` with `aria-roledescription` set to the provider's `slide` string and named by its position (`stepOfTotal`, `2 of 5`). Only the shown slide is visible, carrying `data-current`; the others are `hidden` and `inert`, so they stay mounted but cannot be reached. A slide keeps its element across renders by its child's key.

Implementation: `src/components/carousel/carousel.tsx`, `src/core/presentation-strings.ts`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-1.2 - Previous and next

Before the viewport, the controls (`ui-carousel__controls`) shall hold a previous button (`ui-carousel__previous`, `chevron-left` glyph, `chevron-right` right to left, provider string `previousSlide`) and a next button (`ui-carousel__next`, `chevron-right`, `chevron-left` right to left, `nextSlide`), both controlling the viewport (`aria-controls`). At the first and last slides they are disabled but stay focusable (`aria-disabled`), unless `loop` is set, which makes previous on the first slide show the last and next on the last show the first. `index` (controlled) or `defaultIndex` (uncontrolled, `0` by default) chooses the shown slide, kept within the slides, and `onIndexChange` receives the index of each slide moved to.

Implementation: `src/components/carousel/carousel.tsx`, `src/components/carousel/carousel-parts.tsx`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-1.3 - Dots and thumbnails

`pagination` shall publish `data-pagination` and add, after the viewport, a group (`ui-carousel__pagination`) named by the provider's `chooseSlide` string with one React Aria button per slide, named by `goToSlide` (`Slide 3`) and controlling the viewport: an empty dot (`ui-carousel__dot`) with `dots` (the default), or the content `renderThumbnail(index)` returns (`ui-carousel__thumbnail`) with `thumbnails`, whose images should be decorative since the button is named. The shown slide's button carries `aria-current` and `data-current`; pressing a button shows its slide. `none` draws no pagination.

Implementation: `src/components/carousel/carousel-parts.tsx`, `src/core/presentation-strings.ts`, `labs/reference/carousel.css`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-1.4 - A single slide

With one slide or none, `Carousel` shall draw no controls, no pagination and no rotation, and not rotate.

Implementation: `src/components/carousel/carousel.tsx`
Verification: `src/components/carousel/carousel.test.tsx`

## UIC-CAROUSEL-2 - Keyboard and focus

### UIC-CAROUSEL-2.1 - Arrow keys

With focus inside the carousel, Arrow Left and Arrow Right shall show the previous and next slide (mirrored in a right-to-left locale), with the same ends or looping as the buttons. Presses with Control, Command or Alt, presses inside an element that uses the keys itself (an input, a text area, a select, a slider, or editable content with any `contenteditable` value but `false`), and presses a widget inside a slide already handled (its default prevented) are left alone.

Implementation: `src/components/carousel/carousel.tsx`, `src/utils/is-editable-target.ts`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

### UIC-CAROUSEL-2.2 - Focus follows a hidden slide

When the shown slide changes while focus is inside the slide being hidden, focus shall move to the newly shown slide (focusable with `tabIndex="-1"`), so it is never lost to the page. Focus on a control stays there.

Implementation: `src/components/carousel/carousel.tsx`
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

When the reader prefers reduced motion (`prefers-reduced-motion: reduce`), an `autoplay` carousel shall start stopped, with the button offering to start it.

Implementation: `src/components/carousel/use-carousel-autoplay.ts`
Verification: `src/components/carousel/carousel.test.tsx`, `e2e/carousel.spec.ts`

## UIC-CAROUSEL-4 - Accessibility and hooks

### UIC-CAROUSEL-4.1 - ARIA carousel pattern

The carousel shall follow the ARIA carousel pattern: a named region described as a carousel, its controls before the slides in reading order, named slide groups, buttons that name what they do and control the slides, and no automatic change announced while rotating.

Implementation: `src/components/carousel/carousel.tsx`, `src/components/carousel/carousel-parts.tsx`
Verification: `e2e/carousel.spec.ts`

### UIC-CAROUSEL-4.2 - Hooks and caller attributes

`Carousel` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/carousel/carousel.tsx`
Verification: `src/components/carousel/carousel.test.tsx`

## Hooks

| Hook                      | Kind      | Values                       | Description                                                       |
| ------------------------- | --------- | ---------------------------- | ----------------------------------------------------------------- |
| `ui-carousel`             | root      |                              | The carousel (`<section>`).                                       |
| `ui-carousel__controls`   | slot      |                              | The rotation, previous and next buttons.                          |
| `ui-carousel__rotation`   | slot      |                              | The button that stops or starts rotation (also `ui-icon-button`). |
| `ui-carousel__previous`   | slot      |                              | The previous button (also `ui-icon-button`).                      |
| `ui-carousel__next`       | slot      |                              | The next button (also `ui-icon-button`).                          |
| `ui-carousel__viewport`   | slot      |                              | The live region holding the slides.                               |
| `ui-carousel__slide`      | slot      |                              | Each slide's group.                                               |
| `ui-carousel__pagination` | slot      |                              | The group of slide pickers.                                       |
| `ui-carousel__dot`        | slot      |                              | A slide's dot button.                                             |
| `ui-carousel__thumbnail`  | slot      |                              | A slide's thumbnail button.                                       |
| `data-pagination`         | attribute | `dots`, `thumbnails`, `none` | How the reader picks a slide directly.                            |
| `data-rotating`           | state     | `true`                       | The carousel is advancing on its own.                             |
| `data-current`            | state     | `true`                       | The shown slide, and its dot or thumbnail.                        |
| `data-hovered`            | state     | `true`                       | Pointer over a dot or thumbnail (React Aria).                     |
| `data-pressed`            | state     | `true`                       | A dot or thumbnail is pressed (React Aria).                       |
| `data-focused`            | state     | `true`                       | A dot or thumbnail has focus (React Aria).                        |
| `data-focus-visible`      | state     | `true`                       | A dot or thumbnail has keyboard focus (React Aria).               |
