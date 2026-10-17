---
'@flamboyantengineer/ui-components': minor
---

Close gaps in the colour, select and date fields.

- `ColorSwatchPicker` and `ColorSwatchPickerItem` (React Aria swatch picker): a selectable, keyboard-navigable list of swatches with `size`.
- `ColorField`: alpha formats (`hexa`, `rgba`, `hsla`, `hsba`) with an alpha slider and input; per-channel number inputs that follow the format; a format choice from `formats` with `defaultFormat` and `onFormatChange` (`format` is its controlled side); `valueFormat` to store the value in another format; preset `swatches`; `allowsEyeDropper` for the EyeDropper API; `allowsTyping` for a typeable closed control. New hooks: `__format`, `__channels`, `__channel`, `__swatches`, `__eye-dropper`, `__group`, `__entry`, and `data-channel` on the sliders.
- `SelectField` (and `IconSelectField`): option groups (`{ id, label, options }`) drawn as headed sections, `renderOption`, `virtualized`, paged `loadOptions` results (`{ options, cursor }`) loaded at the end of the list, `isClearable` and `maxValues`. New hooks: `__section`, `__section-header`, `__clear`, `__load-more`.
- `DateTimeField`: `isDateUnavailable`, `presets`, `calendarHeading="select"` month and year selects, `granularity`, `hourCycle`, `timeZone` and `hideTimeZone`, a `date-time-range` mode, and `name`, `startName` and `endName` hidden form inputs. New hooks: `__presets`, `__preset`, `__calendar-select…` and `data-unit`; the calendar header now has no landmark role.
- `RelativeDateField`: `showCalendar` draws a calendar beside the presets, presets take a `label` or compute their value with `getValue`, `valueKind="date-range"` commits relative ranges, and `minValue`/`maxValue` disable presets outside them. New hook: `__calendar`.
- Provider: the `eye-dropper` glyph and the strings `colorFormat`, `colorPicker`, `pickScreenColor`, `clearValue`, `dateUnavailable`, `lastPeriod` and `nextPeriod`.
