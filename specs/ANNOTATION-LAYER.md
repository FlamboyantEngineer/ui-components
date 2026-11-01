# Annotation Layer

`AnnotationLayer` anchors annotations (comments, suggestions, flags) to parts of the content it wraps and draws each anchor as highlight marks over it. An anchor is a set of rectangles the caller supplies, or an element inside the layer whose boxes the layer measures. `AnnotationMargin`, placed inside the layer beside the content, lays out a card for each annotation level with its anchor, stacked without overlap and keeping the active card aligned, and moves between them from the keyboard. Both share the active annotation, which the caller may control. Cards usually hold a [Comment Thread](COMMENT-THREAD.md).

## UIC-ANNOTATION-LAYER-1 - Layer

### UIC-ANNOTATION-LAYER-1.1 - Content and marks

`AnnotationLayer` shall render a root (`position: relative`) holding its `children`, then a `ui-annotation-layer__marks` element covering it (`position: absolute`, `inset: 0`, `pointer-events: none`) and hidden from assistive technology, which holds one `ui-annotation-layer__mark` per rectangle of each anchor, in the order of `annotations`, placed with its `top`, `left`, `width` and `height` inline. A mark of the active annotation publishes `data-active`.

Implementation: `src/components/annotation-layer/annotation-layer.tsx`
Verification: `src/components/annotation-layer/annotation-layer.test.tsx`, `e2e/annotation-layer.spec.ts`

### UIC-ANNOTATION-LAYER-1.2 - Anchors by rectangles or elements

An annotation's `rects` shall be its anchor, in pixels from the top left corner of the layer's content (inside its border, scrolling with it). Without `rects`, an annotation with a `targetId` naming an element inside the layer is anchored by that element's boxes (`getClientRects`, one per line of an inline element), measured in the same coordinates after each commit that changes the layer's `annotations` or `children` (its own state, such as the active annotation, measures nothing) and again as [UIC-ANNOTATION-LAYER-1.4](#uic-annotation-layer-14---keeping-measured-anchors-current) describes. The element is looked up by id in the layer's own tree (the shadow root holding the layer, else its document), so a layer inside a web component finds its targets and never anchors to an element of the same id elsewhere. An annotation with neither, or whose element is missing or outside the layer, has no anchor.

Implementation: `src/components/annotation-layer/annotation-layer.tsx`, `src/components/annotation-layer/anchor-geometry.ts`
Verification: `src/components/annotation-layer/annotation-layer.test.tsx`, `e2e/annotation-layer.spec.ts`

### UIC-ANNOTATION-LAYER-1.3 - The active annotation

The active annotation shall be `currentKey` when set (`null` for none), else held by the layer from `defaultCurrentKey`, and `onCurrentKeyChange` is called with each annotation that becomes active. A press inside the layer, outside its margin, that lands within a mark's rectangle makes that annotation active; where marks overlap, the annotation listed last wins.

Implementation: `src/components/annotation-layer/annotation-layer.tsx`, `src/components/annotation-layer/anchor-geometry.ts`
Verification: `src/components/annotation-layer/annotation-layer.test.tsx`, `e2e/annotation-layer.spec.ts`

### UIC-ANNOTATION-LAYER-1.4 - Keeping measured anchors current

The layer shall measure its target elements again, and so redraw their marks and hit test where they are now, when its content changes without the layer rendering: a node added, removed or edited anywhere inside it (other than its own marks and margin), a scroll of an element inside it, or a resize of the layer, of a target or of an ancestor of a target inside the layer. Content changes and scrolls are coalesced into one measurement on the next animation frame; resizes measure when observed. Scrolling the layer itself measures nothing, since anchors are in its content coordinates. A target that appears or disappears with such a change gains or loses its marks. The observers and listeners stop when the layer unmounts. For a change none of these report, such as a CSS transform or a web font loading, `handleRef` gives an `AnnotationLayerHandle` whose `remeasure()` measures every target at once. Caller `rects` are never measured.

Implementation: `src/components/annotation-layer/annotation-layer.tsx`, `src/components/annotation-layer/observe-targets.ts`
Verification: `src/components/annotation-layer/annotation-layer.test.tsx`, `e2e/annotation-layer.spec.ts`

## UIC-ANNOTATION-LAYER-2 - Margin

### UIC-ANNOTATION-LAYER-2.1 - Cards

`AnnotationMargin` shall render a `ui-annotation-layer__margin` element (`role="list"`, named by the caller's labelling props or the provider's `annotations` string) holding one `ui-annotation-layer__card` (`role="listitem"`) per annotation of the layer around it, in the order of their anchors from the top and then the annotations without an anchor. Each card holds what `renderCard(annotation, { isActive, isOrphaned })` returns and publishes `data-active` for the active annotation and `data-orphaned` for one without an anchor. A margin outside an `AnnotationLayer` throws.

Numeric and text IDs, such as `1` and `'1'`, identify distinct entries, for the cards and for the layer's marks; removing one preserves the other entry's rendered card and marks.

Implementation: `src/components/annotation-layer/annotation-margin.tsx`, `src/components/annotation-layer/annotation-context.ts`, `src/components/annotation-layer/annotation-layer.tsx`, `src/core/strings/diff.ts`
Verification: `src/components/annotation-layer/annotation-layer.test.tsx`, `e2e/annotation-layer.spec.ts`

### UIC-ANNOTATION-LAYER-2.2 - Stacking without overlap

`stackAnnotationCards` shall place each anchored card at the top of its anchor, measured from the top of the margin, unless the card before it reaches lower, then `gap` pixels (8 by default) under that card. No card starts above the margin's top. The active card stays level with its anchor where the cards before it fit above it: they move up from it, and the cards after it move down; where they do not fit, they start at the margin's top and push the active card down. Cards without an anchor follow the lowest card, one under another. Each card is placed with `position: absolute` and its `top` inline, and the margin (`position: relative`) takes the `min-height` that holds every card.

Finding an anchor’s first rectangle shall use a reduction without allocating a list of tops or depending on an argument limit.

Implementation: `src/components/annotation-layer/stack-cards.ts`, `src/components/annotation-layer/annotation-margin.tsx`
Verification: `src/components/annotation-layer/annotation-margin.test.tsx`, `src/components/annotation-layer/stack-cards.test.ts`, `src/components/annotation-layer/annotation-layer.test.tsx`, `e2e/annotation-layer.spec.ts`

### UIC-ANNOTATION-LAYER-2.3 - Measuring

The margin shall measure its own top in the layer's content and the height of each card after each commit and again when the margin or a card resizes, and lay the cards out again when those change.

Implementation: `src/components/annotation-layer/annotation-margin.tsx`
Verification: `src/components/annotation-layer/annotation-layer.test.tsx`, `e2e/annotation-layer.spec.ts`

### UIC-ANNOTATION-LAYER-2.4 - Keyboard

The cards shall form one tab stop (`tabIndex` 0 on the active card, else the first, -1 on the others). While a card itself has focus, ArrowDown and ArrowUp focus the next and the previous card, and Home and End the first and the last. Focus moving into a card, from the keyboard or a press, makes its annotation active.

Implementation: `src/components/annotation-layer/annotation-margin.tsx`
Verification: `src/components/annotation-layer/annotation-layer.test.tsx`, `e2e/annotation-layer.spec.ts`

## UIC-ANNOTATION-LAYER-3 - Accessibility and hooks

### UIC-ANNOTATION-LAYER-3.1 - Decorative marks, listed cards

Marks shall be decoration only: the anchored content keeps its own semantics and the marks are hidden from assistive technology. The cards are a named list in reading order, reachable in one tab stop, with each card's own controls inside.

Implementation: `src/components/annotation-layer/annotation-layer.tsx`, `src/components/annotation-layer/annotation-margin.tsx`
Verification: `src/components/annotation-layer/annotation-layer.test.tsx`, `e2e/annotation-layer.spec.ts`

### UIC-ANNOTATION-LAYER-3.2 - Hooks and caller attributes

`AnnotationLayer` and `AnnotationMargin` shall carry the hooks below, append the caller's `className`, and forward `id` and caller `data-*` attributes to their roots.

Implementation: `src/components/annotation-layer/annotation-layer.tsx`, `src/components/annotation-layer/annotation-margin.tsx`
Verification: `src/components/annotation-layer/annotation-layer.test.tsx`

## Hooks

| Hook                          | Kind  | Values | Description                                          |
| ----------------------------- | ----- | ------ | ---------------------------------------------------- |
| `ui-annotation-layer`         | root  |        | The `AnnotationLayer` element around the content.    |
| `ui-annotation-layer__marks`  | slot  |        | The element covering the layer that holds the marks. |
| `ui-annotation-layer__mark`   | slot  |        | One rectangle of an anchor.                          |
| `ui-annotation-layer__margin` | slot  |        | The `AnnotationMargin` list of cards.                |
| `ui-annotation-layer__card`   | slot  |        | One annotation's card.                               |
| `data-active`                 | state | `true` | On the marks and the card of the active annotation.  |
| `data-orphaned`               | state | `true` | On the card of an annotation without an anchor.      |
