# Format Bytes

`formatBytes` turns a byte count into the size a reader sees. [File Upload](FILE-UPLOAD.md) uses it for its size limit and for the size of each file, and hosts can use it for any size they show.

## UIC-FORMAT-BYTES-1 - Formatting

### UIC-FORMAT-BYTES-1.1 - Units

`formatBytes(bytes, locale)` shall show the size in the largest binary unit (steps of 1024) that keeps it at 1 or more: `B`, `KB`, `MB`, `GB` or `TB`, the largest unit holding any bigger size. Bytes show as a whole number; larger units show exactly one decimal (`512 B`, `1.0 KB`, `1.5 KB`, `5.0 MB`).

Implementation: `src/utils/format-bytes.ts`
Verification: `src/utils/format-bytes.test.ts`

### UIC-FORMAT-BYTES-1.2 - Locale

The number shall be written with the decimal and grouping separators of `locale` (`1,5 KB` in German), or of the runtime's default locale without one.

Implementation: `src/utils/format-bytes.ts`
Verification: `src/utils/format-bytes.test.ts`

### UIC-FORMAT-BYTES-1.3 - Unusable sizes

A size that is negative or not a finite number shall read as `0 B`.

Implementation: `src/utils/format-bytes.ts`
Verification: `src/utils/format-bytes.test.ts`
