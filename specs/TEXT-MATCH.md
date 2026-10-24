# Text Match

`TextMatch` highlights a query inside a text label. A host that filters or searches a view wraps it in a `TextMatchProvider` holding the query; every `TextMatch` below marks each occurrence of the query's terms with a native `<mark>`. Text Match hides nothing and announces nothing: filtering rows and reporting results stay with the host. The pure helpers it uses are exported for hosts that match text themselves.

## UIC-TEXT-MATCH-1 - Matching

### UIC-TEXT-MATCH-1.1 - Normalized terms

`normalizeMatchText` shall lower-case a text and turn `/`, `_` and `-` into spaces one code unit at a time, keeping every index aligned with the original (a character whose lower-case form has another length is kept). `splitMatchTerms` shall split a query into normalized, non-empty terms on whitespace. Matching therefore ignores letter case, and `line height` matches both words of `Line-height`.

Implementation: `src/components/text-match/match-ranges.ts`
Verification: `src/components/text-match/text-match.test.tsx`

### UIC-TEXT-MATCH-1.2 - Ranges

`findTermRanges(text, terms)` shall return every occurrence of every non-empty term as `{ start, end, term }` ranges into the original text, where `term` is the index of the matching term in `terms`, sorted, with overlapping or touching ranges merged into one that keeps the `term` of the range that starts first. With `ignoreAccents`, a range that ends right before a combining mark extends over it; without it, such a match does not count ([UIC-TEXT-MATCH-1.4](#uic-text-match-14---accent-insensitive-matching)). Either way a letter is never split from its accent. No terms, or only empty terms, give no ranges. `textMatchesTerms(text, terms)` shall report whether every term occurs; no terms means no filter, so every text matches, while an empty term matches nothing.

Implementation: `src/components/text-match/match-ranges.ts`
Verification: `src/components/text-match/text-match.test.tsx`

### UIC-TEXT-MATCH-1.3 - Word matching

With `matchWords`, a term shall match only where a word starts (the previous character is not a letter or digit), and shall end the word unless it has three or more characters, so `to` marks the word "to" but not "top" or "separator", while `fav` marks the start of "Favorites". `isWordMatchAt` and `findWordMatches` expose the same rule. Terms are text, never patterns. Without `matchWords` a term matches anywhere, as a filter box needs.

Implementation: `src/components/text-match/match-ranges.ts`, `src/components/text-match/text-match.tsx`
Verification: `src/components/text-match/text-match.test.tsx`, `e2e/text-match.spec.ts`

### UIC-TEXT-MATCH-1.4 - Accent-insensitive matching

With `ignoreAccents` (on `TextMatchProvider`, or in the options of `normalizeMatchText`, `splitMatchTerms`, `findTermRanges` and `textMatchesTerms`), matching shall fold each accented letter to its base letter, so `cafe` matches `Café` and `CAFÉ` matches `cafe`. In the text, a character folds only when its base letter has the same length, keeping indexes aligned; a combining mark written as its own character stays. In a query, every accent is dropped. Without `ignoreAccents`, accents count, whether the text writes them composed or as combining marks: a match that would stop before a combining mark does not count, so `cafe` matches neither `Café` nor `Cafe` followed by U+0301. A query typed with a different composition than the text still does not match it.

Implementation: `src/components/text-match/match-ranges.ts`, `src/components/text-match/text-match.tsx`
Verification: `src/components/text-match/text-match.test.tsx`, `e2e/text-match.spec.ts`

## UIC-TEXT-MATCH-2 - Highlighting

### UIC-TEXT-MATCH-2.1 - Marks

`TextMatch` shall render its string child with each range of the nearest `TextMatchProvider`'s terms wrapped in a `<mark>` carrying the `ui-text-match` class, the text between marks staying plain. It draws no wrapper element, so each mark carries the root hook, the caller's `className` and caller `data-*` attributes.

Implementation: `src/components/text-match/text-match.tsx`, `labs/reference/text-match.css`
Verification: `src/components/text-match/text-match.test.tsx`, `e2e/text-match.spec.ts`

### UIC-TEXT-MATCH-2.2 - Plain without a hit

Without a provider, with an empty query, or when no term occurs, `TextMatch` shall return the plain string, with no mark and no element, so a label that is never filtered keeps the same markup.

Implementation: `src/components/text-match/text-match.tsx`
Verification: `src/components/text-match/text-match.test.tsx`

### UIC-TEXT-MATCH-2.3 - Registration

When the provider has `registerText`, each `TextMatch` shall register its text with it on mount, re-register when its text changes and unregister on unmount, through the cleanup function `registerText` returns, so the host can tell which groups hold a match. The provider renders no element.

Implementation: `src/components/text-match/text-match.tsx`
Verification: `src/components/text-match/text-match.test.tsx`

### UIC-TEXT-MATCH-2.4 - Accessibility

A mark shall only split the label's text: the text, its accessible name and the control it labels are unchanged while terms are marked. Text Match adds no role, live region or announcement.

Implementation: `src/components/text-match/text-match.tsx`
Verification: `src/components/text-match/text-match.test.tsx`, `e2e/text-match.spec.ts`

### UIC-TEXT-MATCH-2.5 - Term hook

Each mark shall publish `data-term`, the index of the query term it matched (`0` for the first term), so a stylesheet can tell the terms of a multi-term query apart. A mark merged from several terms publishes the term that starts first.

Implementation: `src/components/text-match/text-match.tsx`, `labs/reference/text-match.css`
Verification: `src/components/text-match/text-match.test.tsx`, `e2e/text-match.spec.ts`

## Hooks

| Hook            | Kind      | Values | Description                                               |
| --------------- | --------- | ------ | --------------------------------------------------------- |
| `ui-text-match` | root      |        | Each `<mark>` around a hit. The component has no wrapper. |
| `data-term`     | attribute |        | The index of the query term the mark matched.             |
