---
'@flamboyantengineer/ui-components': minor
---

Add timestamps, attribution, save status and record labels.

- `RelativeTime` (new): an ISO 8601 date or date-time read relative to now in a `<time>` element (`5 minutes ago`, `Yesterday`), past `fallbackAfterDays` as its absolute date (`dateStyle`, `timeStyle`), with the absolute date in a tooltip on hover and keyboard focus (`showTooltip`), `capitalize`, `placeholder` and `getNow`. Every timestamp on the page updates on one shared timer. Hooks: `ui-relative-time`, `__tooltip`, `data-relation`, `data-format`, `data-empty`.
- `Attribution` (new): who did something and when as one sentence from a `template` with `{time}` and `{person}` tokens, a live `RelativeTime` and the person's name, with `showAvatar` and a person `card` (`cardTrigger`). Hooks: `ui-attribution`, `__time`, `__person`, `__avatar`, `__name`.
- `SaveStatus` (new): an editor's save `phase` (`idle`, `dirty`, `saving`, `saved`, `error`, `offline`) in a polite live region, per-phase `labels`, a Retry button with `onRetry` and `hideSavedAfter` with an exit animation hook. Hooks: `ui-save-status`, `__message`, `__icon`, `__label`, `__retry`, `data-phase`, `data-entering`, `data-exiting`.
- `RecordLabel` (new): a record's icon and `identifier`, which never break apart, then its `name`, cut with a tooltip (`truncate`) or wrapped, as a link with `href` (`isExternal`), in three sizes, and an `unavailable` (`restricted`, `missing`) form. Hooks: `ui-record-label`, `__identity`, `__icon`, `__identifier`, `__name`, `data-size`, `data-truncate`, `data-unavailable`.
- `RecordChip` (new): an inline reference to a record built on `RecordLabel`, with `version`, `type`, a `state` node, `layout` (`inline`, `stacked`), a `preview` hover card and `onRemove`. Hooks: `ui-record-chip`, `__label`, `__trigger`, `__preview`, `__header`, `__version`, `__type`, `__state`, `__name`, `__remove`, `data-layout`, `data-size`, `data-unavailable`.
- `RelativeDateField` now reads its values through the shared relative time formatter that `RelativeTime` uses; its text is unchanged.
- Glyphs: `offline` and `lock`. Provider strings: `unknownTime`, `attribution`, `saveStatus` and `recordUnavailable`.
