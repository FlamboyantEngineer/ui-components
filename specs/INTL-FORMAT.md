# Intl Format

The shared Intl formatters behind every date, number, list and relative time the library writes. Building an Intl formatter costs far more than formatting with it, and lists, tables and transcripts format a value per row on every render.

## UIC-INTL-FORMAT-1 - Sharing

### UIC-INTL-FORMAT-1.1 - One formatter per locale and options

`getDateFormatter`, `getDateTimeFormat`, `getNumberFormat`, `getListFormat`, `getRelativeTimeFormat` and `getCollator` in `src/utils/intl-format.ts` shall return a `DateFormatter`, `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.ListFormat`, `Intl.RelativeTimeFormat` or `Intl.Collator` for a locale and options, and the same cached formatter for later calls with that locale and equal options. Library code that formats outside a React Aria formatter hook, or collates text for people to read, shall take its formatters and collators from them.

Implementation: `src/utils/intl-format.ts`
Verification: `src/utils/intl-format.test.ts`

### UIC-INTL-FORMAT-1.2 - Bounded retention

Each formatter kind shall retain at most 128 locale and option configurations, evicting the least recently used when another is needed. Reading a cached formatter refreshes its position. An evicted formatter is recreated on demand with the same formatting behavior.

Implementation: `src/utils/intl-format.ts`, `src/utils/lru-cache.ts`
Verification: `src/utils/intl-format.test.ts`, `src/utils/lru-cache.test.ts`

### UIC-INTL-FORMAT-1.3 - Runtime-independent spaces

`normalizeIntlSpaces` shall write each plain, no-break, thin or narrow no-break space in a formatted text as a plain space, or as a no-break space when asked, so a text formatted on a server and in a browser whose runtimes write those spaces differently is the same text. The shared date formatters (`getDateFormatter` and `getDateTimeFormat`) pass every date, time and range text they format through it, so each caller's text, such as an AM/PM time or a day range with its dash, is the same on the server and in the browser that hydrates it.

Implementation: `src/utils/intl-format.ts`
Verification: `src/utils/intl-format.test.ts`
