# Announcer

`Announcer` gives the components inside it a way to speak to screen readers without moving focus: `useAnnounce()` returns `announce(text, { politeness })`, which reads the text through one of the announcer's two visually hidden live regions. Each announcer serves its own subtree, so a page can scope announcements per editor or panel, and no global singleton is involved. Components that own a status in view, such as [Save Status](SAVE-STATUS.md), keep their own live regions; `Announcer` is for events that leave nothing on screen to read, such as an item moved, a change undone or a connection lost.

## UIC-ANNOUNCER-1 - Announcements

### UIC-ANNOUNCER-1.1 - Live regions

`Announcer` shall render its `children`, then a [Visually Hidden](VISUALLY-HIDDEN.md) `ui-announcer` element holding two live regions, present from the first render so the first announcement is read: `ui-announcer__polite` with `role="status"` and `aria-live="polite"`, and `ui-announcer__assertive` with `role="alert"` and `aria-live="assertive"`, both `aria-atomic="true"`. The root takes the caller's `ref`, `className`, `id` and `data-*` attributes.

Implementation: `src/components/announcer/announcer.tsx`
Verification: `src/components/announcer/announcer.test.tsx`, `e2e/announcer.spec.ts`

### UIC-ANNOUNCER-1.2 - Politeness

`announce(text, { politeness })` shall replace the text of the polite region (`politeness: 'polite'`, the default), which a screen reader reads once it finishes what it is reading, or of the assertive region (`'assertive'`), which interrupts it. The other region keeps its text. `announce` is stable for the announcer's lifetime and is called from event handlers and effects, not during render.

Implementation: `src/components/announcer/announcer.tsx`
Verification: `src/components/announcer/announcer.test.tsx`, `e2e/announcer.spec.ts`

### UIC-ANNOUNCER-1.3 - Repeated text

Announcing the text a region already holds shall still change the region, by adding an invisible zero-width space, so the same words are read again (an item moved twice in a row).

Implementation: `src/components/announcer/announcer.tsx`, `src/utils/reannounce.ts`
Verification: `src/components/announcer/announcer.test.tsx`

### UIC-ANNOUNCER-1.4 - Scope

`useAnnounce()` shall return the `announce` of the nearest enclosing `Announcer`, so an inner announcer serves its own subtree. Outside any announcer it returns a function that does nothing, so a component can announce without requiring one.

Implementation: `src/components/announcer/announcer.tsx`
Verification: `src/components/announcer/announcer.test.tsx`

## Hooks

| Hook                      | Kind | Values | Description                                                         |
| ------------------------- | ---- | ------ | ------------------------------------------------------------------- |
| `ui-announcer`            | root |        | The hidden element holding the regions (also `ui-visually-hidden`). |
| `ui-announcer__polite`    | slot |        | The polite live region (`role="status"`).                           |
| `ui-announcer__assertive` | slot |        | The assertive live region (`role="alert"`).                         |
