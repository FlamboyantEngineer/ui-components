# Stat Tile

`StatTile` is a compact metric for dashboards and summaries: a label, a formatted value, its change since the previous period with a trend and a tone that judges it, a secondary line, and room for a small chart such as a [Sparkline](SPARKLINE.md), [Segmented Bar](SEGMENTED-BAR.md) or [Meter](METER.md). It renders a [Card](CARD.md), so it carries the card's hooks, its loading skeleton and its whole-card link or press action.

## UIC-STAT-TILE-1 - Stat tile

### UIC-STAT-TILE-1.1 - Parts

`StatTile` shall render a `Card` whose root also carries `ui-stat-tile` and whose title is the `label`, with a body holding the value in a `ui-stat-tile__value` slot, the delta in a `ui-stat-tile__delta` slot, the `description` in a `ui-stat-tile__description` slot and the `chart` in a `ui-stat-tile__chart` slot, each only when it has content.

Implementation: `src/components/stat-tile/stat-tile.tsx`
Verification: `src/components/stat-tile/stat-tile.test.tsx`, `e2e/stat-tile.spec.ts`

### UIC-STAT-TILE-1.2 - Value

The value shall be formatted for the locale with `formatOptions` (`Intl.NumberFormatOptions`, as for a number field); `valueLabel` replaces it, such as for a value that is not a number.

Implementation: `src/components/stat-tile/stat-tile.tsx`
Verification: `src/components/stat-tile/stat-tile.test.tsx`, `e2e/stat-tile.spec.ts`

### UIC-STAT-TILE-1.3 - Delta and trend

A finite `delta` shall show with its sign (`+12`, `-3`, `0`), formatted with `deltaFormatOptions` or else `formatOptions`, after a decorative trend glyph (`trend-up`, `trend-down` or `trend-flat`) in a `ui-stat-tile__trend-icon` slot. The root publishes `data-trend`: `up` for a positive delta, `down` for a negative one and `flat` for zero. Without a finite delta neither the delta nor the trend renders.

Implementation: `src/components/stat-tile/stat-tile.tsx`, `src/core/glyphs.tsx`
Verification: `src/components/stat-tile/stat-tile.test.tsx`, `e2e/stat-tile.spec.ts`

### UIC-STAT-TILE-1.4 - Tone

With a delta, the root shall publish `data-tone` judging the change against `goal`: with `increase` (the default) a rise is `success` and a fall `danger`, with `decrease` the reverse, and with `none`, like any flat trend, `neutral`. The sign of the delta, not the tone, carries its direction for every reader.

Implementation: `src/components/stat-tile/stat-tile.tsx`, `labs/reference/stat-tile.css`
Verification: `src/components/stat-tile/stat-tile.test.tsx`, `e2e/stat-tile.spec.ts`

### UIC-STAT-TILE-1.5 - Card behaviour

`isLoading` shall show the card's loading skeleton in place of the body, and `href` (with `target` and `rel`) or `onAction` shall make the whole tile a link or press target whose title is the action, as for a card ([UIC-CARD](CARD.md)).

Implementation: `src/components/stat-tile/stat-tile.tsx`, `src/components/card/card.tsx`
Verification: `src/components/stat-tile/stat-tile.test.tsx`, `e2e/stat-tile.spec.ts`

### UIC-STAT-TILE-1.6 - Hooks and caller attributes

`StatTile` shall carry the hooks below beside the card's, append the caller's `className`, and forward `id` and caller `data-*` attributes to the card's root; caller attributes never replace a hook attribute.

Implementation: `src/components/stat-tile/stat-tile.tsx`
Verification: `src/components/stat-tile/stat-tile.test.tsx`

## UIC-STAT-TILE-2 - Accessibility

### UIC-STAT-TILE-2.1 - Named region

The tile shall be a region named by its label, which is its heading, as a titled card is. The value, delta and description follow the heading in reading order.

Implementation: `src/components/stat-tile/stat-tile.tsx`, `src/components/card/card.tsx`
Verification: `src/components/stat-tile/stat-tile.test.tsx`, `e2e/stat-tile.spec.ts`

## Hooks

| Hook                        | Kind  | Values                         | Description                               |
| --------------------------- | ----- | ------------------------------ | ----------------------------------------- |
| `ui-stat-tile`              | root  |                                | The card's `<section>` (also `ui-card`).  |
| `ui-stat-tile__value`       | slot  |                                | The formatted value.                      |
| `ui-stat-tile__delta`       | slot  |                                | The signed change, with its trend glyph.  |
| `ui-stat-tile__trend-icon`  | slot  |                                | The decorative trend glyph.               |
| `ui-stat-tile__description` | slot  |                                | The secondary line.                       |
| `ui-stat-tile__chart`       | slot  |                                | The small chart.                          |
| `data-trend`                | state | `up`, `down`, `flat`           | Which way the value moved, with a delta.  |
| `data-tone`                 | state | `neutral`, `success`, `danger` | Whether the change is good, with a delta. |
