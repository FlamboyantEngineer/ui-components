---
'@flamboyantengineer/ui-components': minor
---

`MediaViewer` zooms from the wheel and lets the host hold its zoom:

- `zoomsOnWheel` makes the wheel over the stage, and a touchpad pinch, step the zoom through its levels: one mouse notch is one level, smaller touchpad deltas add up to one, and once the image overflows the viewport the point under the pointer stays in place. The viewer cancels those wheel events, so neither the viewport scrolls nor the page zooms.
- `zoom`, `defaultZoom` and `onZoomChange` control the zoom; moving to another item asks for `defaultZoom`.
- The zoom control's reset button is now opt-in through `showZoomReset`, and returns to `defaultZoom`. The viewer no longer shows it by default.
