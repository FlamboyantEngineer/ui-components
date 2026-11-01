---
'@flamboyantengineer/ui-components': patch
---

ChatQuestion releases its one-request guard when a card leaves pending or changes id, so a card pending again with the same id sends at once and ignores requests from its earlier lifetime.
