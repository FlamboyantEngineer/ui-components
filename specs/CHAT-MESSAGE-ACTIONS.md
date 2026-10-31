# Chat Message Actions

`ChatMessageActions` is the action bar for a [Chat Transcript](CHAT-TRANSCRIPT.md) message's `actions`: a toolbar of the commands whose callbacks the host gives (Copy, a good or bad rating, Reply, React, Edit and Delete), with the feedback details, the [Emoji Picker](EMOJI-PICKER.md) and the delete confirmation ([Modal](MODAL.md)) those commands open. `ChatMessageActionsMenu` offers the same commands in a [Context Menu](CONTEXT-MENU.md) on a secondary click or long press on the message, and hands the message the bar, so both share one state. Which commands suit a message (ratings for an assistant's reply, Edit and Delete for the reader's own message) is the host's choice; the library shows what it is given.

## UIC-CHAT-MESSAGE-ACTIONS-1 - Action bar

### UIC-CHAT-MESSAGE-ACTIONS-1.1 - Commands

`ChatMessageActions` shall render a React Aria `toolbar` (`ui-chat-message-actions`) named by `aria-label`, `aria-labelledby` or else the provider string `messageActions`, holding small ghost icon-only [Buttons](BUTTON.md) in this order, each only when its value or callback is given: Copy (`copyText`, `ui-chat-message-actions__copy`, named `copy`), Good response and Bad response (`onFeedback`, both `ui-chat-message-actions__rating`, named `goodResponse` and `badResponse`), Reply (`onReply`, `ui-chat-message-actions__reply`, named `reply`), React (`onReact`, `ui-chat-message-actions__react`, named `addReaction`), Edit (`onEdit`, `ui-chat-message-actions__edit`, named `edit`) and Delete (`onDelete`, `ui-chat-message-actions__delete`, named `delete`). Without any command it renders nothing.

Implementation: `src/components/chat-message-actions/chat-message-actions.tsx`, `src/components/chat-message-actions/message-actions-bar.tsx`, `src/components/chat-message-actions/message-commands.ts`, `src/core/strings/chat-actions.ts`, `src/core/glyphs.tsx`
Verification: `src/components/chat-message-actions/chat-message-actions.test.tsx`, `e2e/chat-message-actions.spec.ts`

### UIC-CHAT-MESSAGE-ACTIONS-1.2 - Keyboard

The toolbar shall be one stop in the Tab sequence: Left and Right arrows (reversed right to left) move focus between its commands without wrapping, Tab and Shift+Tab leave it, and coming back focuses the command focused last.

Implementation: `src/components/chat-message-actions/message-actions-bar.tsx`
Verification: `src/components/chat-message-actions/chat-message-actions.test.tsx`, `e2e/chat-message-actions.spec.ts`

### UIC-CHAT-MESSAGE-ACTIONS-1.3 - Copy

Copy shall put `copyText` on the clipboard, exactly as given, through the library's copy support (the asynchronous Clipboard API, then a selection copy). Once the text reached the clipboard it calls `onCopy`. For two seconds the button shows the `check` glyph (the `error` glyph when the copy failed) and the toolbar carries `data-copied` after a copy, and a polite status (`ui-chat-message-actions__status`) reads the provider string `copied` or `copyFailed`; a repeated outcome is read again. Of quick presses only the latest copy is announced: an earlier copy that settles after it changes nothing in the status.

Implementation: `src/components/chat-message-actions/message-actions-bar.tsx`, `src/components/chat-message-actions/message-commands.ts`
Verification: `src/components/chat-message-actions/chat-message-actions.test.tsx`, `e2e/chat-message-actions.spec.ts`

### UIC-CHAT-MESSAGE-ACTIONS-1.4 - Hooks and caller attributes

`ChatMessageActions` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to the toolbar.

Implementation: `src/components/chat-message-actions/message-actions-bar.tsx`
Verification: `src/components/chat-message-actions/chat-message-actions.test.tsx`

## UIC-CHAT-MESSAGE-ACTIONS-2 - Feedback

### UIC-CHAT-MESSAGE-ACTIONS-2.1 - Ratings

The rating buttons shall be toggle buttons (`aria-pressed`) carrying `data-rating` (`up` or `down`) that show the current rating: `feedback` when the host controls it (`null` for none), otherwise the rating the actions keep from the reader's choices, starting with none.

Implementation: `src/components/chat-message-actions/message-actions-bar.tsx`, `src/components/chat-message-actions/message-commands.ts`
Verification: `src/components/chat-message-actions/chat-message-actions.test.tsx`

### UIC-CHAT-MESSAGE-ACTIONS-2.2 - Rating at once

Without `feedbackReasons`, choosing a rating shall call `onFeedback({ rating, reasons: [] })` at once.

Implementation: `src/components/chat-message-actions/message-commands.ts`
Verification: `src/components/chat-message-actions/chat-message-actions.test.tsx`

### UIC-CHAT-MESSAGE-ACTIONS-2.3 - Feedback details

With `feedbackReasons` (even empty), the rating buttons shall have `aria-haspopup="dialog"` and `aria-expanded`, and choosing a rating shall show it as chosen and open a [Popover](POPOVER.md) (`ui-chat-message-actions__feedback`) placed against the button and titled by the provider string `feedbackDetails(rating)`. It holds the reasons, when there are any, as toggle chip buttons (`ui-chat-message-actions__reason`) in a group (`ui-chat-message-actions__reasons`) named `feedbackReasons`; a multi-line text field for an optional comment (`ui-chat-message-actions__comment`) labelled `feedbackComment`; and Skip and Submit (`skip` and `submitFeedback`) in `ui-chat-message-actions__feedback-actions`. Submit calls `onFeedback` once with the rating, the chosen reasons in the order of `feedbackReasons` and the trimmed comment (left out when blank). Skip, Escape or a press outside calls it with the rating and no reasons. The popover then closes and focus returns to the rating button.

Implementation: `src/components/chat-message-actions/message-command-overlays.tsx`, `src/components/chat-message-actions/feedback-form.tsx`, `src/components/chat-message-actions/message-commands.ts`
Verification: `src/components/chat-message-actions/chat-message-actions.test.tsx`, `e2e/chat-message-actions.spec.ts`

### UIC-CHAT-MESSAGE-ACTIONS-2.4 - Clearing a rating

Choosing the rating already shown shall clear it: `onFeedback({ rating: null, reasons: [] })`, without details.

Implementation: `src/components/chat-message-actions/message-commands.ts`
Verification: `src/components/chat-message-actions/chat-message-actions.test.tsx`, `e2e/chat-message-actions.spec.ts`

## UIC-CHAT-MESSAGE-ACTIONS-3 - Reply, React, Edit and Delete

### UIC-CHAT-MESSAGE-ACTIONS-3.1 - Reply and Edit

Reply and Edit shall call `onReply` and `onEdit`.

Implementation: `src/components/chat-message-actions/message-actions-bar.tsx`
Verification: `src/components/chat-message-actions/chat-message-actions.test.tsx`

### UIC-CHAT-MESSAGE-ACTIONS-3.2 - React

React shall open an `EmojiPicker` in a popover (`ui-chat-message-actions__emoji-popover`) placed against the button, with focus in its search field and the given `customEmoji`, `recentEmoji`, `onRecentEmojiChange` and `loadEmoji`. Choosing an emoji calls `onReact` with its glyph in the chosen skin tone, or `:shortcode:` for a custom emoji, and closes the picker; Escape or a press outside closes it. Focus returns to the button.

Implementation: `src/components/chat-message-actions/message-command-overlays.tsx`
Verification: `src/components/chat-message-actions/chat-message-actions.test.tsx`, `e2e/chat-message-actions.spec.ts`

### UIC-CHAT-MESSAGE-ACTIONS-3.3 - Delete

Delete shall open a [Modal](MODAL.md) alert dialog with the `danger` tone, titled `deleteMessage`, described by `deleteMessageDescription`, whose confirm action is named `delete`. Confirming runs `onDelete`, pending while a returned promise settles; Cancel or Escape closes it without deleting. Focus returns to the button.

Implementation: `src/components/chat-message-actions/message-command-overlays.tsx`
Verification: `src/components/chat-message-actions/chat-message-actions.test.tsx`, `e2e/chat-message-actions.spec.ts`

### UIC-CHAT-MESSAGE-ACTIONS-3.4 - Open overlays

The buttons that open an overlay shall have `aria-haspopup="dialog"` and `aria-expanded`, and while an overlay is open the toolbar carries `data-open`, so a stylesheet that shows the bar on hover or focus keeps it while the reader works in the overlay. Keys, secondary clicks and presses in the overlays stop at the bar, so they never reach the message around it (React passes events from portals up the component tree). An open overlay whose command goes (`onFeedback` or `feedbackReasons`, `onReact`, `onDelete`) closes for good: the pending rating is dropped, the toolbar drops `data-open`, and the command coming back does not reopen it.

Implementation: `src/components/chat-message-actions/message-actions-bar.tsx`, `src/components/chat-message-actions/message-command-overlays.tsx`, `src/components/chat-message-actions/message-commands.ts`
Verification: `src/components/chat-message-actions/chat-message-actions.test.tsx`, `e2e/chat-message-actions.spec.ts`

## UIC-CHAT-MESSAGE-ACTIONS-4 - Context menu

### UIC-CHAT-MESSAGE-ACTIONS-4.1 - Menu

`ChatMessageActionsMenu` shall call its `children` with the action bar of its commands (`null` without commands) and make the element it returns a `ContextMenuTrigger` target ([UIC-CONTEXT-MENU-1](CONTEXT-MENU.md#uic-context-menu-1---context-menu-trigger)): a secondary click, a long touch, the Context Menu key or Shift+F10 opens a `Menu` named by `aria-label` or else `messageActions`, holding the commands the bar shows, in its order: Copy, a section named `messageFeedback` with Good response and Bad response as checkable items, Reply, Add reaction, Edit, and Delete with the `danger` tone. A secondary click on a text control inside the message keeps the browser's menu, and without commands there is no menu. The target keeps its own ref, and `className`, `id` and caller `data-*` attributes reach the menu's popover.

Implementation: `src/components/chat-message-actions/chat-message-actions-menu.tsx`
Verification: `src/components/chat-message-actions/chat-message-actions-menu.test.tsx`, `e2e/chat-message-actions.spec.ts`

### UIC-CHAT-MESSAGE-ACTIONS-4.2 - Shared state

The menu and the bar it hands out shall share one state. Copy from the menu copies `copyText` and the bar shows and announces the outcome; the checked rating is the rating shown; choosing a rating acts as in the bar, with the feedback details placed against the message, and choosing the checked rating clears it; Add reaction and Delete open the emoji picker and the confirmation placed against the message, while the bar carries `data-open`. Focus returns to the message when they close.

Implementation: `src/components/chat-message-actions/chat-message-actions-menu.tsx`, `src/components/chat-message-actions/message-commands.ts`
Verification: `src/components/chat-message-actions/chat-message-actions-menu.test.tsx`, `e2e/chat-message-actions.spec.ts`

## Hooks

| Hook                                        | Kind      | Values                           | Description                                                           |
| ------------------------------------------- | --------- | -------------------------------- | --------------------------------------------------------------------- |
| `ui-chat-message-actions`                   | root      |                                  | The toolbar (`role="toolbar"`).                                       |
| `ui-chat-message-actions__copy`             | slot      |                                  | Copy (also `ui-button`).                                              |
| `ui-chat-message-actions__status`           | slot      |                                  | The visually hidden status that reads the copy's outcome.             |
| `ui-chat-message-actions__rating`           | slot      |                                  | A rating toggle (also `ui-button`).                                   |
| `ui-chat-message-actions__reply`            | slot      |                                  | Reply (also `ui-button`).                                             |
| `ui-chat-message-actions__react`            | slot      |                                  | React (also `ui-button`).                                             |
| `ui-chat-message-actions__edit`             | slot      |                                  | Edit (also `ui-button`).                                              |
| `ui-chat-message-actions__delete`           | slot      |                                  | Delete (also `ui-button`).                                            |
| `ui-chat-message-actions__feedback`         | slot      |                                  | The feedback details popover (also `ui-popover`).                     |
| `ui-chat-message-actions__reasons`          | slot      |                                  | The group of reason chips.                                            |
| `ui-chat-message-actions__reason`           | slot      |                                  | A reason chip (also `ui-button`).                                     |
| `ui-chat-message-actions__comment`          | slot      |                                  | The comment field (also `ui-text-field`).                             |
| `ui-chat-message-actions__feedback-actions` | slot      |                                  | Skip and Submit.                                                      |
| `ui-chat-message-actions__emoji-popover`    | slot      |                                  | The popover holding the emoji picker.                                 |
| `data-open`                                 | state     | `true`                           | On the toolbar: an overlay of its commands is open.                   |
| `data-copied`                               | state     | `true`                           | On the toolbar: the last copy reached the clipboard, for two seconds. |
| `data-orientation`                          | state     | `horizontal`                     | On the toolbar: its axis (React Aria).                                |
| `data-rating`                               | attribute | `up`, `down`                     | On a rating toggle: which rating it chooses.                          |
| `data-placement`                            | state     | `top`, `bottom`, `left`, `right` | On the emoji popover: its resolved side (React Aria).                 |
| `data-entering`                             | state     | `true`                           | On the emoji popover: it is opening (React Aria).                     |
| `data-exiting`                              | state     | `true`                           | On the emoji popover: it is closing (React Aria).                     |
