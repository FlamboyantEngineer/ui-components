---
'@flamboyantengineer/ui-components': minor
---

`DataAttributeValue`, the type of the caller `data-*` props in `BaseProps`, now includes `null`, matching what every component already does at runtime: a `null` omits the attribute. The doc comments on `DataAttributeValue` and `DataValue` now say how each one renders `false`.
