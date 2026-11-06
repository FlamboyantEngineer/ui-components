---
'@flamboyantengineer/ui-components': minor
---

Add `TimeZoneField`: a searchable, virtualized select of IANA time zones whose value is the zone identifier, each shown with its offset at a reference instant (`referenceDate`, else the provider's clock) and its generic name in the locale, in offset order. `zones` restricts the list; a chosen alias outside it is kept, and an identifier the platform does not read is invalid. New string `timeZoneUnknown`.
