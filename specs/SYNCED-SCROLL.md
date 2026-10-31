# Synced Scroll

`useSyncedScroll(targets, options)` keeps the vertical scroll position of two or more scroll containers aligned, as side-by-side panes of a compare view need: scrolling one container scrolls the others. Without anchors the containers align the same fraction of their scroll range; with `getAnchors` they align matched points of their content, so panes whose rows differ in height (a comment under a line on one side only) stay level at the rows they share. `mapScrollOffset` is the pure mapping it applies. [Text Diff](TEXT-DIFF.md) aligns its split panes with it.

## UIC-SYNCED-SCROLL-1 - Alignment

### UIC-SYNCED-SCROLL-1.1 - Same fraction of the range

When one container scrolls and no `getAnchors` is given, `useSyncedScroll` shall scroll every other container to the same fraction of its own scroll range (`scrollHeight` less `clientHeight`): a container scrolled halfway puts the others halfway. Targets are elements or refs, read after every commit. Unchanged elements retain their listeners, and repeated targets count as one container.

Implementation: `src/utils/use-synced-scroll.ts`
Verification: `src/utils/use-synced-scroll.test.ts`

### UIC-SYNCED-SCROLL-1.2 - Matched anchors

With `getAnchors(container)`, which returns a container's anchors in reading order as keys and offsets from the top of its content, the hook shall map the scrolled container's position onto each other container with `mapScrollOffset(offset, from, to)` and clamp it to that container's scroll range. `mapScrollOffset` pairs the anchors whose keys both lists hold; between two pairs the offset moves in proportion, before the first pair and after the last it keeps its distance from that anchor, and with no pair it is returned unchanged.

Implementation: `src/utils/use-synced-scroll.ts`
Verification: `src/utils/use-synced-scroll.test.ts`

### UIC-SYNCED-SCROLL-1.3 - No echoes, and stopping

A position the hook sets shall not scroll the containers again when its own scroll event arrives, so containers never chase each other, including when a re-render occurs before the event arrives. With `enabled` false, or fewer than two containers present, nothing aligns; unmounting removes every listener.

Implementation: `src/utils/use-synced-scroll.ts`
Verification: `src/utils/use-synced-scroll.test.ts`

### UIC-SYNCED-SCROLL-1.4 - Kept anchors

The hook shall read a container's anchors once and keep them until the container or its content changes: a `ResizeObserver` on the container and its direct children, a `MutationObserver` on its subtree (nodes, text and attributes), a change of its `scrollHeight` or `clientHeight`, or a new `getAnchors` function forgets them. A scroll then only maps the offset, without reading the layout of the rows; `getAnchors` should therefore be a stable function. `mapScrollOffset` pairs two anchor lists once and reuses the pairs for as long as both lists are kept, so it expects lists it is given not to be edited afterwards. Where `ResizeObserver` is missing, each container's anchors are read once per handled scroll.

Implementation: `src/utils/use-synced-scroll.ts`, `src/utils/scroll-offset-map.ts`
Verification: `src/utils/use-synced-scroll.test.ts`, `e2e/text-diff.spec.ts`
