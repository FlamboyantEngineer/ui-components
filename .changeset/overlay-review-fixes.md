---
'@flamboyantengineer/ui-components': patch
---

Overlay and keyboard fixes: document-wide shortcuts stay silent in a drawer, an anchored modal, the command palette and a modal tour, and answer in a non-modal modal; shortcuts answer on checkboxes, radios and button inputs, ignore autofill keydowns and wait through a held first key; `useShortcut` hydrates `aria-keyshortcuts` without a mismatch; a caller `onKeyDown` on `Button` or `SearchField` no longer swallows Escape; TruncationTooltip lets Escape go on to the dialog around it; NavigationMenu leaves a handled or composing Escape alone; a late tour target scrolls into view; an uncontrolled selectable menu stays controlled; a held Backspace goes back one command palette page, and a page opened from `defaultPath` keeps the query of the page before it; the command palette returns focus in its own window; the leave question lets the reader leave once every source is clean.
