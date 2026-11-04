---
'@flamboyantengineer/ui-components': patch
---

`usePersistentState` no longer reads storage during the server render or hydration: both show the initial value, so they agree whatever each side's storage holds, and the stored value replaces it right after hydration without being overwritten. Persisted `Tabs` restore their stored selection after hydration too.
