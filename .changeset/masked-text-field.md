---
'@flamboyantengineer/ui-components': minor
---

Add `MaskedTextField`, a text field with a fixed token mask (`(999) 999-9999`, `AAA-9999`, or the host's own `tokens`). Its value is the raw characters the slots hold; the input shows them formatted with stable literal separators, keeps the caret after the same accepted characters, and lets Backspace and Delete next to a separator remove the nearest character. Partial values report `maskIncomplete`, the root publishes `data-complete`, and the form submits the raw value or, with `formValue="formatted"`, the formatted text. Adds the `maskIncomplete` string.
