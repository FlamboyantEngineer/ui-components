# Time Zone Field

`TimeZoneField` chooses an IANA time zone, such as `Europe/Paris`, for a value that stores one: a [Select Field](SELECT-FIELD.md) whose options are the zones, each shown by its identifier with its offset from UTC at a reference instant and its generic name in the locale. It reads every zone through the platform's `Intl` data, so it ships no zone dataset.

## UIC-TIME-ZONE-FIELD-1 - Contract

### UIC-TIME-ZONE-FIELD-1.1 - Value

`TimeZoneField` shall be a single `SelectField` (UIC-SELECT-FIELD) on the field contract whose value is a zone identifier or `null`: `value`, `defaultValue`, `committedValue`, `onChange`, `onCommit` and `validate` read and write the identifier, Clear and Reset follow the field (UIC-FIELD-2), and `name` submits the identifier with a form (with `form`, UIC-FIELD-8.5). The root carries `ui-time-zone-field` alongside `ui-select-field`; every other select prop and hook applies, the filter shows from the start and the list is virtualized.

Implementation: `src/components/time-zone-field/time-zone-field.tsx`
Verification: `src/components/time-zone-field/time-zone-field.test.tsx`, `e2e/time-zone-field.spec.ts`

### UIC-TIME-ZONE-FIELD-1.2 - Zones, offsets and search

The options shall be `zones` (by default every zone the platform lists, with `UTC`), in order of their offset at the reference instant, west to east, then by identifier. Each option's label is the identifier with spaces for underscores; its description is the offset (`longOffset`, such as `GMT+05:45`) and the generic name (`longGeneric`, such as `Nepal Time`) in the locale. The reference instant is `referenceDate`, else now by the provider's clock; it is read to the quarter hour, so offsets follow daylight saving time and half- and quarter-hour zones at that instant, never a cached current offset. Before hydration (when the clock may not be read, UIC-PROVIDER-8.2) options show their names without offsets, so the server and the first client render agree. The filter matches the identifier, the offset and the name. Until the list first opens, only the chosen zone is described, so a closed field costs one zone (the whole platform list takes about 150 ms to describe in Node). The listed zones are described once for a reference instant and locale; a change of the chosen value describes no listed zone again, only a chosen zone outside the list.

Implementation: `src/components/time-zone-field/time-zones.ts`, `src/components/time-zone-field/time-zone-field.tsx`
Verification: `src/components/time-zone-field/time-zone-field.test.tsx`, `e2e/time-zone-field.spec.ts`

### UIC-TIME-ZONE-FIELD-1.3 - Aliases and unknown zones

A zone in `zones` that the platform does not read shall be left out. A chosen zone outside `zones` that the platform reads, such as an alias (`US/Eastern`) or a renamed zone a platform lists by its older name (`Asia/Kolkata` for `Asia/Calcutta`), is kept as given and offered too; the field never replaces a value with another identifier or infers a zone from an offset. A value the platform does not read shows as itself and is invalid with the provider's `timeZoneUnknown` message (`typeMismatch`).

Implementation: `src/components/time-zone-field/time-zone-field.tsx`, `src/components/time-zone-field/time-zones.ts`, `src/core/strings/field.ts`
Verification: `src/components/time-zone-field/time-zone-field.test.tsx`

## Hooks

| Hook                 | Kind | Values | Description                                            |
| -------------------- | ---- | ------ | ------------------------------------------------------ |
| `ui-time-zone-field` | root |        | The field's root, alongside `ui-select-field`'s hooks. |
