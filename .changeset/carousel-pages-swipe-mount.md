---
'@flamboyantengineer/ui-components': minor
---

`Carousel` gains three opt-in props.

- `slidesPerPage` and `slidesPerMove` show several slides a page and advance several slides a move. The last page ends on the last slide. Dots and thumbnails pick pages. The root carries `--ui-carousel-per-page`, and each shown slide carries `--ui-carousel-slot`.
- `allowsSwiping` makes a touch, pen or mouse swipe across the viewport move one page, in reading direction. It leaves vertical scrolling, pinch zoom, controls and draggable content alone. Hooks: `data-swipeable`, `data-swiping` and `--ui-carousel-swipe-offset`.
- `mountSlides="visited"` renders a slide's content once it is first shown and keeps it. Mounted slides carry `data-mounted`.
