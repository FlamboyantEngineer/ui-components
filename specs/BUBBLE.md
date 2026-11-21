# Bubble

## UIC-BUBBLE-1 - Composition

### UIC-BUBBLE-1.1 - Surface and content

`Bubble` adds alignment and a surface variant around caller-supplied children. Both the bubble and its optional `BubbleContent` container preserve markup and forward native attributes. The variants are shadcn/ui's: `default` (the message's own surface), `secondary` (a quiet filled surface), `muted` (a subdued one), `tinted` (a wash of the accent color), `outline` (a border without a fill), `ghost` (neither, as for an assistant's text) and `destructive` (a failed or refused message).

Implementation: `src/components/bubble/bubble.tsx`, `labs/reference/bubble.css`
Verification: `src/components/bubble/bubble.test.tsx`, `e2e/bubble.spec.ts`

### UIC-BUBBLE-1.2 - Groups and reactions

`BubbleGroup` (`ui-bubble-group`) stacks consecutive bubbles of one message in reading order. `BubbleReactions` (`ui-bubble__reactions`), placed inside a `Bubble`, holds the reactions to it, such as a [Reaction Bar](REACTION-BAR.md); it publishes `side` (`bottom` by default, or `top`) as `data-side` and `align` (`end` by default, or `start`) as `data-align`, and the reference stylesheet sets it overlapping that edge of the bubble at that end, with the bubble keeping room so it covers no text. Both parts are plain `<div>` elements that forward native attributes and keep the caller's markup.

Implementation: `src/components/bubble/bubble.tsx`, `labs/reference/bubble.css`
Verification: `src/components/bubble/bubble.test.tsx`, `e2e/bubble.spec.ts`

## Hooks

| Hook                   | Kind      | Values                                                                       | Description                    |
| ---------------------- | --------- | ---------------------------------------------------------------------------- | ------------------------------ |
| `ui-bubble`            | root      | `bubble`                                                                     | The bubble surface.            |
| `ui-bubble__content`   | slot      | `bubble-content`                                                             | The supplied content.          |
| `ui-bubble__reactions` | slot      | `bubble-reactions`                                                           | Reactions overlapping an edge. |
| `data-align`           | attribute | `start`, `end`                                                               | Logical alignment.             |
| `data-variant`         | attribute | `default`, `secondary`, `muted`, `tinted`, `outline`, `ghost`, `destructive` | Surface treatment.             |
| `data-side`            | attribute | `top`, `bottom`                                                              | The edge reactions overlap.    |
| `ui-bubble-group`      | root      | `bubble-group`                                                               | Consecutive bubbles, stacked.  |
