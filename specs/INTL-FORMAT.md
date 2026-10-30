# Intl Format

The shared Intl formatters behind every date, number, list and relative time the library writes. Building an Intl formatter costs far more than formatting with it, and lists, tables and transcripts format a value per row on every render.

## UIC-INTL-FORMAT-1 - Sharing

### UIC-INTL-FORMAT-1.1 - One formatter per locale and options

`getDateFormatter`, `getDateTimeFormat`, `getNumberFormat`, `getListFormat` and `getRelativeTimeFormat` in `src/utils/intl-format.ts` shall return a `DateFormatter`, `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.ListFormat` or `Intl.RelativeTimeFormat` for a locale and options, and the same formatter for every later call with that locale and equal options. Library code that formats outside a React Aria formatter hook shall take its formatters from them.

Implementation: `src/utils/intl-format.ts`
Verification: `src/utils/intl-format.test.ts`
