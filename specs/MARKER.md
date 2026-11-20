# Marker

`Marker` marks a place in a conversation, after shadcn/ui's marker: a day, the first unread message, a reply the reader stopped, or a message that redirected a reply. It is presentation only; the caller decides where it goes and what it says.

## UIC-MARKER-1 - Marker

### UIC-MARKER-1.1 - Parts and variants

`Marker` shall render a `ui-marker` `<div>` that publishes `variant` as `data-variant`: `default` (a plain line), `separator` (rules on both sides of its content) or `border` (a rule beneath it). It adds no role, so the caller gives it one where it divides content, such as `separator` with a name. `MarkerIcon` (`ui-marker__icon`) is a `<span>` hidden from assistive technology for a decorative glyph, and `MarkerContent` (`ui-marker__content`) a `<span>` for the marker's text. Every part forwards its native attributes and keeps the caller's markup, such as a link. The reference stylesheet draws markers in small muted text.

Implementation: `src/components/marker/marker.tsx`, `labs/reference/marker.css`
Verification: `src/components/marker/marker.test.tsx`, `e2e/marker.spec.ts`

## Hooks

| Hook                 | Kind      | Values                           | Description        |
| -------------------- | --------- | -------------------------------- | ------------------ |
| `ui-marker`          | root      |                                  | The marker line.   |
| `ui-marker__icon`    | slot      |                                  | Decorative glyph.  |
| `ui-marker__content` | slot      |                                  | The marker's text. |
| `data-variant`       | attribute | `default`, `separator`, `border` | How it sets apart. |
