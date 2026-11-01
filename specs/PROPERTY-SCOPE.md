# Property Scope

`PropertyScope` filters the parts of a [Property Panel](PROPERTY-PANEL.md) below it by a query its caller owns, for a host that draws its own search box; a [Property Filter](PROPERTY-FILTER.md) composes it with one. Each section, group, card and row reports to the scope how many properties it holds, how many match and whether one overrides an inherited value, so containers can count their rows, mark overrides and hide when nothing inside matches. Without a scope above them nothing filters, and every part still counts and marks its rows.

## UIC-PROPERTY-SCOPE-1 - Filtering

### UIC-PROPERTY-SCOPE-1.1 - Matching rows

`PropertyScope` shall split its `query` into terms as [Text Match](TEXT-MATCH.md) does (ignoring case and turning `/`, `_` and `-` into spaces). A row shall match while every term occurs in the text of its enclosing section title, group heading and card name, its text label and its `keywords`, taken together. A row that does not match gets the native `hidden` attribute and stays mounted, so a draft in its control survives filtering; a stylesheet that gives the parts a `display` keeps `[hidden]` parts out of layout, as the reference sheet does. An empty or blank query hides nothing.

Implementation: `src/components/property-scope/property-scope.tsx`, `src/components/property-scope/scope-tally.ts`, `src/components/property-panel/property-row.tsx`, `labs/reference/property-panel.css`
Verification: `src/components/property-scope/property-scope.test.tsx`, `e2e/property-scope.spec.ts`

### UIC-PROPERTY-SCOPE-1.2 - Containers

While a query is active, a group and a section shall hide while no row inside matches, and a card while neither its name nor a row inside matches. A section or card that stays visible opens and ignores presses of its trigger; when the query clears, each returns to the open state it had before, whether the user chose it, it was stored or the caller controls it. Counts keep the number of properties inside, matching or not. Until every part mounted inside a container has reported, as in server rendering and the first client render, the container treats its match count as unknown and stays visible, so a preset query never hides a matching row before effects run.

Implementation: `src/components/property-scope/scope-tally.ts`, `src/components/property-panel/property-panel.tsx`, `src/components/property-panel/property-section.tsx`, `src/components/property-panel/property-card.tsx`, `src/components/property-panel/property-disclosure.tsx`
Verification: `src/components/property-scope/property-scope.test.tsx`, `e2e/property-scope.spec.ts`

### UIC-PROPERTY-SCOPE-1.3 - Marked text

Below a scope, each occurrence of a term shall be marked through `TextMatch` in section titles, group headings, card names, text row labels and any other `TextMatch` label, such as a field's. Marks leave the text and accessible names unchanged.

Implementation: `src/components/property-scope/property-scope.tsx`
Verification: `src/components/property-scope/property-scope.test.tsx`, `e2e/property-scope.spec.ts`

### UIC-PROPERTY-SCOPE-1.4 - No match

The scope shall keep a status region (`role="status"`, `ui-property-scope__status`) after its content. While a query is active and every part has reported that no row matches, the region holds a small `EmptyState` with the provider string `noPropertyMatches` for the trimmed query, followed, when `onClear` is given, by a button named by the provider string `clearFilter` that calls it. Otherwise the region is empty, also in server rendering and the first client render, before the parts have reported.

Implementation: `src/components/property-scope/property-scope.tsx`, `src/core/strings.ts`
Verification: `src/components/property-scope/property-scope.test.tsx`, `e2e/property-scope.spec.ts`

### UIC-PROPERTY-SCOPE-1.5 - Hooks and caller attributes

`PropertyScope` shall carry the hooks below on a `<div>` around its content, append the caller's `className`, and forward `id` and caller `data-*` attributes to it.

Implementation: `src/components/property-scope/property-scope.tsx`
Verification: `src/components/property-scope/property-scope.test.tsx`

### UIC-PROPERTY-SCOPE-1.6 - Custom matching

With `filter`, a row shall match while `filter(text, query)` returns true, where `text` joins the texts [UIC-PROPERTY-SCOPE-1.1](#uic-property-scope-11---matching-rows) names with single spaces and `query` is the query as typed, in place of holding every term; a card's name is matched the same way. Any nonblank query is then active, also one such as `/`, `_` or `-` that holds no terms, for rows, cards, containers and the no-match message alike; a blank query still filters nothing, and marks still show the query's terms.

Implementation: `src/components/property-scope/property-scope.tsx`, `src/components/property-scope/scope-tally.ts`
Verification: `src/components/property-scope/property-scope.test.tsx`, `e2e/property-scope.spec.ts`

## Hooks

| Hook                        | Kind | Values | Description                                     |
| --------------------------- | ---- | ------ | ----------------------------------------------- |
| `ui-property-scope`         | root |        | The `<div>` around the filtered content.        |
| `ui-property-scope__status` | slot |        | The status region holding the no-match message. |
