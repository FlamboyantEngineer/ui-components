---
'@flamboyantengineer/ui-components': minor
---

`NumberFieldProps` is now the union of every `NumberField` mode (number input, slider and range), and `ComponentProps<typeof NumberField>` is that union, so a wrapper or component registry can forward any mode. The number-input props are `NumberEntryFieldProps`.
