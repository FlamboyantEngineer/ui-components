---
'@flamboyantengineer/ui-components': minor
---

Fields can be owned by an external form controller such as React Hook Form. Every field takes `onLeave`, called once focus leaves the whole field (a compound control's parts and the field's buttons included), `controlRef`, whose `FieldControlHandle.focus()` reveals the field and focuses its control, and `errorMessage`, an error the owner reports that shows whatever the validation mode. `docs/FORM-CONTROLLERS.md` documents a typed React Hook Form recipe for text, number, select and date range fields and which layer owns values, dirty state, validation and the submit; the library depends on no controller.
