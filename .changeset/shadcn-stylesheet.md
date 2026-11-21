---
'@flamboyantengineer/ui-components': minor
---

A second stylesheet, `@flamboyantengineer/ui-components/shadcn.css`, draws the components after shadcn/ui's default style. A host loads it instead of `reference.css`, on the same hooks: it reuses the reference partials, points their tokens at shadcn/ui's (`--background`, `--primary`, `--radius`…) and retouches buttons, field frames, checkboxes, radios, switches, tabs, badges, cards, dialogs, sheets, popovers, menus and tooltips. shadcn/ui's neutral theme ships as defaults in the lowest cascade layer, so a host's own shadcn/ui token block themes the components, under `.dark` as under `data-theme="dark"`, without Tailwind. Controls take shadcn/ui's sizes; `data-ui-scale="compact"` on a container restores the dense scale. The lab stylesheet picker offers it as "shadcn/ui" (`?stylesheet=shadcn`), `LabStylesheet` gains the `shadcn` kind, and `mountLabBar` and `bootLabSettings` take a `shadcnStylesheet` URL.
