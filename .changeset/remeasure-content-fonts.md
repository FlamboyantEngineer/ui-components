---
'@flamboyantengineer/ui-components': patch
---

Measurements follow content and font changes their box never sees: TabList's overflow follows tabs whose content changes outside a render and fonts that load, TruncationTooltip re-checks whether its text is cut, auto-growing text areas (TextField, MessageComposer) refit when fonts load, and `useScrollSpy` (and Outline tracking) reads the sections again when content inside the viewport changes.
