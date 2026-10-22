# Synced Scroll

`useSyncedScroll(targets, options)` keeps the vertical scroll position of two or more scroll containers aligned, as side-by-side panes of a compare view need: scrolling one container scrolls the others. Without anchors the containers align the same fraction of their scroll range; with `getAnchors` they align matched points of their content, so panes whose rows differ in height (a comment under a line on one side only) stay level at the rows they share. `mapScrollOffset` is the pure mapping it applies. [Text Diff](TEXT-DIFF.md) aligns its split panes with it.

## UIC-SYNCED-SCROLL-1 - Alignment

### UIC-SYNCED-SCROLL-1.1 - Same fraction of the range

When one container scrolls and no `getAnchors` is given, `useSyncedScroll` shall scroll every other container to the same fraction of its own scroll range (`scrollHeight` less `clientHeight`): a container scrolled halfway puts the others halfway. Targets are elements or refs, read after every commit. Unchanged elements retain their listeners, and repeated targets count as one container.

Implementation: `src/utils/use-synced-scroll.ts`
Verification: `src/utils/use-synced-scroll.test.ts`

### UIC-SYNCED-SCROLL-1.2 - Matched anchors

With `getAnchors(container)`, which returns a container's anchors in reading order as keys and offsets from the top of its content, the hook shall map the scrolled container's position onto each other container with `mapScrollOffset(offset, from, to)` and clamp it to that container's scroll range. Each container’s anchors are read once per handled scroll. `mapScrollOffset` pairs the anchors whose keys both lists hold; between two pairs the offset moves in proportion, before the first pair and after the last it keeps its distance from that anchor, and with no pair it is returned unchanged.

Implementation: `src/utils/use-synced-scroll.ts`
Verification: `src/utils/use-synced-scroll.test.ts`

### UIC-SYNCED-SCROLL-1.3 - No echoes, and stopping

A position the hook sets shall not scroll the containers again when its own scroll event arrives, so containers never chase each other, including when a re-render occurs before the event arrives. With `enabled` false, or fewer than two containers present, nothing aligns; unmounting removes every listener.

Implementation: `src/utils/use-synced-scroll.ts`
Verification: `src/utils/use-synced-scroll.test.ts`
