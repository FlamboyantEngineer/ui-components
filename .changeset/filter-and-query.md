---
'@flamboyantengineer/ui-components': minor
---

Add `FilterBar`, `ConditionBuilder`, `QueryField` and `FacetList`.

- `FilterBar`: active filters as chips (`{ field, operator, value }[]`) with a typed popover editor per field (text, number, date, choice, person, boolean), an add menu, remove and clear all, and a `search` slot. `createFilterMatcher`, `matchesFilterCondition` and `isFilterConditionComplete` filter records with the same model.
- `ConditionBuilder`: nested all/any groups of rules on the same field definitions, with add, duplicate, move (menu or Alt+Arrow), delete, `maxDepth` and `validate`; `matchesConditionGroup` evaluates the tree.
- `QueryField`: a one-line query input on `CodeEditor` driven by a caller `grammar` (`tokenize`, `complete`, `diagnose`), submitting on Enter or the run button.
- `FacetList`: facet values with counts as checkboxes, with search, a "show more" fold (`limit`) and `selectedFirst`.
- `CodeEditor`: `multiline={false}` keeps the source on one line (`data-single-line`), leaving Enter to the caller.
- New provider strings for filters, conditions, queries and facets (`QueryStrings`).
