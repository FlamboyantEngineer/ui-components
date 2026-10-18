---
'@flamboyantengineer/ui-components': minor
---

Declare the public API of the select, combobox, tag, date and colour components in the library's own terms, with plain values, so none of their types exposes a building block.

Breaking:

- `DateTimeField`: `date-time` values are floating `YYYY-MM-DDTHH:mm` texts (`…:ss` at the `second` granularity) instead of UTC instants; with `timeZone` they are zoned `YYYY-MM-DDTHH:mm:ss±HH:MM[Zone]` texts. Texts with an offset or a zone are still read. `date-time-range` values, `minValue` and `maxValue` follow. Parts finer than the granularity are written as zero (`07:00` at `hour`).
- `DateTimeField`: `isDateUnavailable` receives the `YYYY-MM-DD` date as a string instead of a date object. `hourCycle`, `hideTimeZone`, `isOpen`, `defaultOpen` and `onOpenChange` are declared props; other date picker props no longer pass through.
- `RelativeDateField`: `date-time` values are local `YYYY-MM-DDTHH:mm` texts instead of UTC instants.
- `Combobox`: the selection is `value`, `defaultValue` and `onChange` in both selection modes (`ComboboxValue`: an id or `null`, or a list of ids); `selectedKey`, `defaultSelectedKey`, `onSelectionChange` and `defaultFilter` are gone, and only the documented props are accepted. `renderOption` receives a `ComboboxOptionState`. New types: `ComboboxValue`, `ComboboxMenuTrigger`, `ComboboxOptionState`.
- `SelectField`: `renderOption` receives a `SelectFieldOptionState`; `name`, `autoFocus` and the open state are declared props. New type: `SelectFieldOptionState`.
- `TagGroup`, `Tag`: declared props only (`items`, `onRemove`, the shared selection props, `aria-*`; `id`, `textValue`, `isDisabled` on a tag). Keys and selections use the shared `Key` and `Selection`.
- `ColorSwatch`: `color` is a CSS colour string; colour objects are no longer accepted, nor undocumented swatch props.
- `ColorSwatchPicker`: `value` and `defaultValue` are CSS colour strings and `onChange` receives the picked item's `color` string as the item gives it, instead of a colour object; `layout` takes the new `ColorSwatchPickerLayout`. `ColorSwatchPickerItem` takes `color` (a string), `colorName` and `isDisabled`.
