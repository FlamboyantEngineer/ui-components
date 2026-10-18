---
'@flamboyantengineer/ui-components': minor
---

Add a line diff view, synced scrolling and annotation anchors with a margin.

- `TextDiff` (new): the line diff of `oldText` and `newText` in a `unified` or `split` `layout`, built on `diffLines` and `diffWords`: word changes inside paired lines, old and new line numbers, unchanged runs folded down to `context` lines behind "Show n more lines" buttons, `renderLineWidget` for content under a line (comments, notes), a header counting added and removed lines, previous and next change buttons and the `n`/`p` keys. Split panes are Scroll Regions kept level with `useSyncedScroll`. Each row reads as its change and line numbers. Hooks: `ui-text-diff` with `data-layout` and its `__header`, `__summary`, `__count`, `__navigation`, `__previous`, `__next`, `__panes`, `__pane`, `__table`, `__line`, `__filler`, `__number`, `__marker`, `__content`, `__text`, `__word`, `__fold`, `__expand` and `__widget` slots, plus `data-side`, `data-change` and `data-current`.
- `useSyncedScroll` and `mapScrollOffset` (new): keep the vertical scroll of two or more containers aligned, by the same fraction of their range or through matched anchors (`getAnchors`), without echoes.
- `AnnotationLayer` and `AnnotationMargin` (new): anchors given as rectangles or as elements inside the layer (`targetId`, measured again on resize), drawn as highlight marks; a press on a mark makes its annotation active (`activeId`, `defaultActiveId`, `onActiveChange`). The margin lays out a card per annotation (`renderCard`) beside its anchor, stacked without overlap with `gap`, the active card kept level with its anchor, orphaned annotations last, as a list with one tab stop and arrow-key, Home and End navigation. Hooks: `ui-annotation-layer` with its `__marks`, `__mark`, `__margin` and `__card` slots, plus `data-active` and `data-orphaned`.
- Provider strings: `textDiffSummary`, `textDiffLine`, `textDiffShowLines`, `textDiffPreviousChange`, `textDiffNextChange`, `textDiffLines` and `annotations`, in a new diff strings module.
- Labs: a new `Content` group holds the Text Diff and Annotation Layer labs.
