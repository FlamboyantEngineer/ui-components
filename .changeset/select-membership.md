---
'@flamboyantengineer/ui-components': minor
---

Add `useSelectMembership` for multiple `SelectField`s that edit several records at once. It marks mixed options as indeterminate, cycles a mixed option through selected for all, removed for all and mixed again, and reports `added`, `removed` and `retained` keys, so applying the intent never overwrites a record's untouched memberships. Disabled options never carry intent; edits are controllable and a new `resetKey` drops held ones.
