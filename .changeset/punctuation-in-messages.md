---
'@flamboyantengineer/ui-components': minor
---

Punctuation and word order around built-in text now come from the language files, so each language sets its own. New messages: `loadMoreWithRemaining`, `loadMoreOf`, `overflowCount`, `valueRange`, `rangeSeparator`, `labelColon`, `countsSummary`, `itemsAndSelected`, `signatureMeaningIs` and `problemSeverityLead`. `remainingCount` and `problemSeverity` are removed. The avatar group overflow count now uses the locale's number format. Range fallbacks, date range separators, the field label colon and the summaries of load more, transfer lists, mapping tables, problem lists and signature dialogs use these messages. `EmptyState` renders its `description` unchanged and no longer turns `...` into `…`. `formatDescriptionValue` takes an optional `joinRange`.
