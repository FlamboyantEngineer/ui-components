# Text Match

`TextMatch` highlights a query inside a text label. A host that filters or searches a view wraps it in a `TextMatchProvider` holding the query; every `TextMatch` below marks each occurrence of the query's terms with a native `<mark>`. Text Match hides nothing and announces nothing: filtering rows and reporting results stay with the host. The pure helpers it uses are exported for hosts that match text themselves.

## UIC-TEXT-MATCH-1 - Matching

### UIC-TEXT-MATCH-1.1 - Normalized terms

`normalizeMatchText` shall lower-case a text, compose each letter with its combining marks (NFC) and turn `/`, `_` and `-` into spaces, so a letter matches whether the text writes it composed or with combining marks. `splitMatchTerms` shall split a query into normalized, non-empty terms on whitespace, and the matching functions normalize the terms they are given the same way. Matching therefore ignores letter case and composition, and `line height` matches both words of `Line-height`.

Implementation: `src/components/text-match/match-ranges.ts`
Verification: `src/components/text-match/text-match.test.tsx`

### UIC-TEXT-MATCH-1.2 - Ranges

`findTermRanges(text, terms)` shall return every occurrence of every non-empty term as `{ start, end, term }` ranges into the original text, where `term` is the index of the matching term in `terms`, sorted, with overlapping or touching ranges merged into one that keeps the `term` of the range that starts first. Matching works on the normalized text, and each range maps back to whole characters of the original: it never splits a surrogate pair, and it takes in every combining mark of the letters it covers. Without `ignoreAccents`, a match that would stop before a combining mark left after composing does not count ([UIC-TEXT-MATCH-1.4](#uic-text-match-14---accent-insensitive-matching)). No terms, or only empty terms, give no ranges. `textMatchesTerms(text, terms)` shall report whether every term occurs; no terms means no filter, so every text matches, while an empty term matches nothing.

Implementation: `src/components/text-match/match-ranges.ts`
Verification: `src/components/text-match/text-match.test.tsx`

### UIC-TEXT-MATCH-1.3 - Word matching

With `matchWords`, a term shall match only where a word starts (the previous character is not a letter, digit or combining mark, read as a whole code point, so an astral letter or an accented letter written with a combining mark continues its word), and shall end the word unless it has three or more characters, so `to` marks the word "to" but not "top" or "separator", while `fav` marks the start of "Favorites". `isWordMatchAt` and `findWordMatches` expose the same rule. Terms are text, never patterns. Without `matchWords` a term matches anywhere, as a filter box needs.

Implementation: `src/components/text-match/match-ranges.ts`, `src/components/text-match/text-match.tsx`
Verification: `src/components/text-match/text-match.test.tsx`, `e2e/text-match.spec.ts`

### UIC-TEXT-MATCH-1.4 - Accent-insensitive matching

With `ignoreAccents` (on `TextMatchProvider`, or in the options of `normalizeMatchText`, `splitMatchTerms`, `findTermRanges` and `textMatchesTerms`), matching shall fold each accented letter to its base letter in the text and in the query, whether either writes it composed or with combining marks, so `cafe` matches `Café`, `CAFÉ` matches `cafe`, and `resume` matches `résumé` written either way. Without `ignoreAccents`, accents count but composition does not: `café` matches `cafe` followed by U+0301, and `cafe` matches neither.

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

When the provider has `registerText`, each `TextMatch` shall register its text with it on mount, re-register when its text changes and unregister on unmount, through the cleanup function `registerText` returns, so the host can tell which groups hold a match. The provider renders no element. A provider with `isInherited` passes the enclosing provider's query and options through unchanged, ignoring its own, so a wrapper that highlights only sometimes can stay mounted while it does not.

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
