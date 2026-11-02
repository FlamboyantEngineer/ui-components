# Reaction Bar

`ReactionBar` is a row of reaction chips under a comment, a message or any other entry: each chip is an emoji with how many people reacted, pressed while the reader is one of them, and an add-reaction button opens the [Emoji Picker](EMOJI-PICKER.md). As a `summary` it draws every reaction in one small chip that opens the picker. The reactions come in as data and the reader's toggles leave through one callback; the host keeps the counts. A [Comment Thread](COMMENT-THREAD.md) reply takes one in its `reactions` slot.

## UIC-REACTION-BAR-1 - Contract

### UIC-REACTION-BAR-1.1 - Chips

`ReactionBar` shall render a `ui-reaction-bar` element holding one chip per entry of `reactions`, in order: a chip-variant `Button` in the `ui-reaction-bar__reaction` slot showing the emoji in `ui-reaction-bar__emoji` and the count in `ui-reaction-bar__count`, in the provider locale's digits and grouping (`1,234`; `١٬٢٣٤` in `ar-EG`). An entry's count is `count`, else the number of its `people`; an entry counting nobody draws no chip. The emoji is a standard glyph, drawn as text, or `:shortcode:`: a shortcode found in `customEmoji` draws that emoji's image in `ui-reaction-bar__image` with empty alternative text, and any other is drawn as its text. An image that fails to load, including one that failed before hydration, gives way to the `:shortcode:` text; a new image URL loads again, and a failure reported for a URL the chip no longer shows changes nothing.

Implementation: `src/components/reaction-bar/reaction-bar.tsx`
Verification: `src/components/reaction-bar/reaction-bar.test.tsx`, `e2e/reaction-bar.spec.ts`

### UIC-REACTION-BAR-1.2 - Who reacted

Each chip shall be named by the provider's `reactionLabel` string from the emoji (a custom emoji's `label` when it has one), the count and the first `maxNames` names of `people` (3 by default), such as `👍 5, reacted by Ana Lima, Ben Ode and 3 others`, where the others are the count less the names listed; the count and the others read in the locale's digits and grouping, as on the chip. The same text shows in a `Tooltip` on hover and keyboard focus, which names the chip rather than describing it again.

Implementation: `src/components/reaction-bar/reaction-bar.tsx`, `src/core/strings/content.ts`
Verification: `src/components/reaction-bar/reaction-bar.test.tsx`, `e2e/reaction-bar.spec.ts`

### UIC-REACTION-BAR-1.3 - Toggling

A chip shall be a toggle button, pressed (`aria-pressed="true"`, `data-selected`) while its entry's `isReacted` is true. Pressing it, by pointer or keyboard, shall call `onToggle` with the emoji and the opposite state. The bar holds no state of its own: the chip changes when the host's `reactions` do.

Implementation: `src/components/reaction-bar/reaction-bar.tsx`
Verification: `src/components/reaction-bar/reaction-bar.test.tsx`, `e2e/reaction-bar.spec.ts`

### UIC-REACTION-BAR-1.4 - Adding a reaction

With `onToggle`, the bar shall end with a `Button` in the `ui-reaction-bar__add` slot, drawing the `emoji` glyph and named by the provider's `addReaction` string, that opens an `EmojiPickerTrigger` popover with the bar's `customEmoji`, `recentEmoji`, `onRecentEmojiChange` and `loadEmoji`. Choosing an emoji closes the picker and calls `onToggle` with its key and `true`: a standard emoji's glyph in the chosen skin tone, or `:shortcode:` for a custom emoji. Choosing an emoji the reader already reacted with changes nothing.

Implementation: `src/components/reaction-bar/reaction-bar.tsx`, `src/core/glyphs.tsx`
Verification: `src/components/reaction-bar/reaction-bar.test.tsx`, `e2e/reaction-bar.spec.ts`

### UIC-REACTION-BAR-1.5 - Read-only

Without `onToggle` the bar shall be read-only: the root carries `data-readonly`, there is no add button, and the chips stay focusable with `aria-disabled="true"` so their names and tooltips remain reachable, but refuse presses. A read-only bar without chips renders nothing.

Implementation: `src/components/reaction-bar/reaction-bar.tsx`
Verification: `src/components/reaction-bar/reaction-bar.test.tsx`, `e2e/reaction-bar.spec.ts`

### UIC-REACTION-BAR-1.6 - Accessibility, hooks and caller attributes

The root shall be a `role="group"` named by `aria-label` or `aria-labelledby`, else by the provider's `reactions` string. Every chip and the add button are tab stops. It shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref`.

Implementation: `src/components/reaction-bar/reaction-bar.tsx`
Verification: `src/components/reaction-bar/reaction-bar.test.tsx`, `e2e/reaction-bar.spec.ts`

### UIC-REACTION-BAR-1.7 - Summary

With `presentation="summary"` (`chips` by default) the bar shall draw, in place of the chips and the add button, one chip-variant `Button` in the `ui-reaction-bar__summary` slot: a `ui-reaction-bar__stack` of the first three entries' emoji, each in `ui-reaction-bar__emoji` (a custom emoji's image as in [UIC-REACTION-BAR-1.1](#uic-reaction-bar-11---chips)), and in `ui-reaction-bar__count` the sum of every entry's count, in the locale's digits. The chip is named, through its `Tooltip`, by the provider's `reactionSummary` string from that total, every entry's `reactionLabel` and the emoji the reader reacted with, such as `3 reactions: 👍 2, reacted by Ana Lima and Ben Ode, 🎉 1. You reacted with 🎉`; the stack and the count are not read separately. It carries `data-reacted` while the reader reacted with any entry. With `onToggle`, pressing it opens the `EmojiPickerTrigger` popover of [UIC-REACTION-BAR-1.4](#uic-reaction-bar-14---adding-a-reaction), and choosing an emoji calls `onToggle` with its key and `true`, or `false` when the reader already reacted with it; without, it is read-only as in [UIC-REACTION-BAR-1.5](#uic-reaction-bar-15---read-only). A summary without reactions renders nothing, so the host offers the first reaction elsewhere, such as a message's React command. The root carries `data-presentation`.

Implementation: `src/components/reaction-bar/reaction-bar.tsx`, `src/core/strings/content.ts`, `labs/reference/reaction-bar.css`
Verification: `src/components/reaction-bar/reaction-bar.test.tsx`, `e2e/chat-message-actions.spec.ts`, `e2e/reaction-bar.spec.ts`

## Hooks

| Hook                        | Kind  | Values             | Description                                                     |
| --------------------------- | ----- | ------------------ | --------------------------------------------------------------- |
| `ui-reaction-bar`           | root  |                    | The `role="group"` row.                                         |
| `ui-reaction-bar__reaction` | slot  |                    | One chip (also `ui-button`, with its `data-selected`).          |
| `ui-reaction-bar__emoji`    | slot  |                    | The chip's emoji: a glyph, an image or a shortcode.             |
| `ui-reaction-bar__image`    | slot  |                    | A custom emoji's `<img>`.                                       |
| `ui-reaction-bar__count`    | slot  |                    | The chip's count.                                               |
| `ui-reaction-bar__add`      | slot  |                    | The add-reaction button (also `ui-button`).                     |
| `ui-reaction-bar__summary`  | slot  |                    | The summary chip (also `ui-button`).                            |
| `ui-reaction-bar__stack`    | slot  |                    | The summary chip's stacked emoji.                               |
| `data-presentation`         | state | `chips`, `summary` | How the bar draws its reactions.                                |
| `data-reacted`              | state | `true`             | On the summary chip: the reader reacted with an entry.          |
| `data-readonly`             | state | `true`             | The bar has no `onToggle`: no add button, chips refuse presses. |
