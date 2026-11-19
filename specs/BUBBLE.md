# Bubble

## UIC-BUBBLE-1 - Composition

### UIC-BUBBLE-1.1 - Surface and content

`Bubble` adds alignment and a surface variant around caller-supplied children. Both the bubble and its optional `BubbleContent` container preserve markup and forward native attributes.

Implementation: `src/components/bubble/bubble.tsx`
Verification: `src/components/bubble/bubble.test.tsx`, `e2e/bubble.spec.ts`

## Hooks

| Hook                 | Kind      | Values                                 | Description           |
| -------------------- | --------- | -------------------------------------- | --------------------- |
| `ui-bubble`          | root      |                                        | The bubble surface.   |
| `ui-bubble__content` | slot      |                                        | The supplied content. |
| `data-align`         | attribute | `start`, `end`                         | Logical alignment.    |
| `data-variant`       | attribute | `default`, `muted`, `outline`, `ghost` | Surface treatment.    |
