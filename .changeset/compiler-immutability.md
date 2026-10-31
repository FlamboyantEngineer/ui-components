---
'@flamboyantengineer/ui-components': patch
---

Components and hooks no longer write to values the React Compiler treats as immutable: refs passed between hooks are named as refs, `ComboboxReset` and the table's bulk-edit validity probe store their values in layout effects instead of during render, and `useControllableState` keeps the last uncontrolled set in a ref instead of a render variable, so a second set in one event still compares with the first.
