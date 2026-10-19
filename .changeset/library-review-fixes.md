---
'@flamboyantengineer/ui-components': patch
---

Clear conflicting caller data attributes when a component hook is inactive. Keep lab index links and stylesheet readiness in sync with toolbar changes, reject malformed lab URLs without stopping the server, embed lab favicons to avoid missing-resource errors, and ship the PDF lab's runtime assets. Clarify the distinction between unstyled components and lab reference stylesheets.

Prevent linear scale tick generation from stalling on adjacent floating-point values, bound tick requests to 1–1000, format tiny tick labels without throwing, and keep mapping and nice domains finite when intermediate arithmetic would overflow.

Bundle the lab reference CSS into one stylesheet request while retaining its component partials for authoring. Include the upstream PDF license and verify packaged PDF runtime files byte for byte against the installed dependency.

Keep always-visible scrollbar thumb sizes finite before the first measurement.

Stop time scale ticks at the calendar limit and select automatic intervals from actual calendar boundaries, including the smallest fitting multi-year step. Reuse date formatters within each time scale when labeling ticks.

Keep the static lab server inside its canonical directory, including requests through symbolic links.

Keep an overlapping menu from receiving the release of its opening mouse press while preserving press-and-drag item selection.

Keep the color picker's footer inside its popup by using consecutive grid rows, with Clear and the screen picker in visual and keyboard order after the presets.

Trim unused node details from accessibility reports while retaining every rule and violation.
