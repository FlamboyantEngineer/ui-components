---
'@flamboyantengineer/ui-components': minor
---

TextField checks `email` and `url` values itself (validity `typeMismatch`, new `emailMismatch` and `urlMismatch` strings in every language file), so the field, its form's verdict and a native submit agree; an email or URL field showing a `displayValue` renders a `text` input so the display text never blocks a submit.
