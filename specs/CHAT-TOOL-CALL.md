# Chat Tool Call

`ChatToolCall` is one call of a tool by an assistant, shown in a conversation as a collapsible card built on [Disclosure](DISCLOSURE.md): a trigger with the call's status, label and duration, and a body with the arguments and result as formatted, copyable JSON, or a custom body the host draws for that tool. A failed call keeps its error in the body. A call that asks for the reader's approval shows what it will do with Approve, Deny (with an optional reason) and Always allow, each offered only when the host handles it, with keyboard shortcuts; once decided, the card keeps the decision. The card takes its data as plain props (`ChatToolCallData`): `id`, `name`, `label`, `target`, `kind`, `status`, `args`, `result`, `error`, `durationMs` and `approval`.

## UIC-CHAT-TOOL-CALL-1 - Card

### UIC-CHAT-TOOL-CALL-1.1 - Parts

`ChatToolCall` shall render a `ui-chat-tool-call` element whose `id` is the call's `id`, holding a [Disclosure](DISCLOSURE.md) (`ui-chat-tool-call__disclosure`) whose title heading (`ui-chat-tool-call__heading`) holds the trigger and whose panel (`ui-chat-tool-call__body`) holds the body ([UIC-CHAT-TOOL-CALL-2](#uic-chat-tool-call-2---body)). The trigger holds a decorative status glyph (`ui-chat-tool-call__status-glyph`) and then the summary (`ui-chat-tool-call__summary`), which holds, in order, the label (`ui-chat-tool-call__label`), the `target` (`ui-chat-tool-call__target`) when given, the status (`ui-chat-tool-call__status`), the duration (`ui-chat-tool-call__duration`) when `durationMs` is given, and the auto-approved badge (`ui-chat-tool-call__badge`) when it applies, separated by spaces, so the trigger's name reads the label, the target, the status, the duration and the badge, and a label too long for one line wraps inside the summary, beside the glyph. The error ([UIC-CHAT-TOOL-CALL-2.5](#uic-chat-tool-call-25---error)) and the approval ([UIC-CHAT-TOOL-CALL-4](#uic-chat-tool-call-4---approval)) follow the disclosure, outside its panel, so collapsing the card never hides them.

Implementation: `src/components/chat-tool-call/chat-tool-call.tsx`, `src/components/chat-tool-call/tool-call-parts.tsx`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`, `e2e/chat-tool-call.spec.ts`

### UIC-CHAT-TOOL-CALL-1.2 - Label

The label shall be `label` when given, else one derived from `name`: its words split at underscores, hyphens, dots, slashes, colons, spaces and case changes, joined by spaces in lower case except words written in capitals, with the first letter in upper case (`search_recipes` and `searchRecipes` read `Search recipes`, `get_HTTP_status` reads `Get HTTP status`). A name with no words is the label as given.

Implementation: `src/components/chat-tool-call/chat-tool-call.tsx`, `src/components/chat-tool-call/format-tool-call.ts`
Verification: `src/components/chat-tool-call/format-tool-call.test.ts`, `src/components/chat-tool-call/chat-tool-call.test.tsx`

### UIC-CHAT-TOOL-CALL-1.3 - Status

The root shall publish `status` as `data-status`: `pending`, `running`, `approval-requested`, `succeeded`, `failed`, `denied` or `cancelled`. The status shows as text from the provider's `toolCallStatus` (`Pending`, `Running`, `Needs approval`, `Done`, `Failed`, `Denied`, `Cancelled`), which is part of the trigger's name, beside a status glyph: `clock`, `refresh`, `hand-raised`, the kind's glyph ([UIC-CHAT-TOOL-CALL-1.7](#uic-chat-tool-call-17---kind)), `error`, `no-symbol` and `x-circle` in that order. A `running` call is busy: the root carries `aria-busy="true"`.

Implementation: `src/components/chat-tool-call/chat-tool-call.tsx`, `src/components/chat-tool-call/tool-call-parts.tsx`, `src/core/chat-tool-strings.ts`, `src/core/glyphs.tsx`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`, `e2e/chat-tool-call.spec.ts`

### UIC-CHAT-TOOL-CALL-1.4 - Duration

Given `durationMs`, the duration shall show in the provider's `toolCallDuration` short form (`350 ms`, `1.2 s`, `2 min 5 s`), hidden from assistive technology, beside its long form for assistive technology (`350 milliseconds`, `1.2 seconds`, `2 minutes 5 seconds`), visually hidden.

Implementation: `src/components/chat-tool-call/tool-call-parts.tsx`, `src/core/chat-tool-strings.ts`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`

### UIC-CHAT-TOOL-CALL-1.5 - Auto-approved

When `approval.isAutoApproved` is set, the trigger shall show a small [Badge](BADGE.md) with the provider's `toolCallAutoApproved` string, and the root publishes `data-auto-approved`.

Implementation: `src/components/chat-tool-call/chat-tool-call.tsx`, `src/components/chat-tool-call/tool-call-parts.tsx`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`, `e2e/chat-tool-call.spec.ts`

### UIC-CHAT-TOOL-CALL-1.6 - Hooks and caller attributes

`ChatToolCall` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes to its root; caller attributes never replace a hook attribute.

Implementation: `src/components/chat-tool-call/chat-tool-call.tsx`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`

### UIC-CHAT-TOOL-CALL-1.7 - Kind

The root shall publish `kind`, what the call does, as `data-kind`: `read`, `edit`, `command`, `search`, `fetch` or `other` (the default). Once the call `succeeded`, its status glyph is its kind's: `file-text`, `edit`, `terminal`, `search`, `globe` and `wrench` in that order, so a finished call shows what it did. A group of steps sums its calls up by kind ([Chat Parts](CHAT-PARTS.md#uic-chat-parts-52---running-and-summary)).

Implementation: `src/components/chat-tool-call/chat-tool-call.tsx`, `src/components/chat-tool-call/tool-call-parts.tsx`, `src/core/glyphs.tsx`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`, `e2e/chat-parts.spec.ts`

### UIC-CHAT-TOOL-CALL-1.8 - Variant

The root shall publish `variant` as `data-variant`: `card` (the default), a call shown on its own, or `row`, a quiet call among the steps of a reply. [Chat Parts](CHAT-PARTS.md#uic-chat-parts-32---tool-calls) draws every call as a `row`, in a group of steps or alone, so styles written for the row reach every call of a reply. The variant changes no content or behaviour.

Implementation: `src/components/chat-tool-call/chat-tool-call.tsx`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`, `e2e/chat-parts.spec.ts`

## UIC-CHAT-TOOL-CALL-2 - Body

### UIC-CHAT-TOOL-CALL-2.1 - Arguments and result

The body shall show `args` and then `result`, each when defined, in a `ui-chat-tool-call__part` with `data-part` `arguments` or `result`: a `ui-chat-tool-call__part-header` holding the title (`ui-chat-tool-call__part-title`, the provider's `toolCallArguments` or `toolCallResult`) and its copy button, then the value as read-only text in a `<pre>` inside a [Scroll Region](SCROLL-REGION.md) (`ui-chat-tool-call__json`, scrolling on both axes) whose viewport is a focusable `group` labelled by the title, so a long value scrolls by keyboard. The text is JSON indented by two spaces; a string holding a JSON object or array is re-indented, any other string shows as given, and a value JSON cannot hold (a cycle, a function) shows as `String(value)`.

Implementation: `src/components/chat-tool-call/tool-call-parts.tsx`, `src/components/chat-tool-call/format-tool-call.ts`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`, `src/components/chat-tool-call/format-tool-call.test.ts`, `e2e/chat-tool-call.spec.ts`

### UIC-CHAT-TOOL-CALL-2.2 - Copying

Each part's copy button (`ui-chat-tool-call__copy`, a [Copy Button](COPY-BUTTON.md)) shall copy the text the part shows and be named by the provider's `copyToolCallPart` from the part's title (`Copy arguments`, `Copy result`).

Implementation: `src/components/chat-tool-call/tool-call-parts.tsx`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`

### UIC-CHAT-TOOL-CALL-2.3 - Custom body

`children` shall replace the arguments and result in the body, for a tool whose host draws its own view of the call, such as a forecast card for a weather tool.

Implementation: `src/components/chat-tool-call/tool-call-parts.tsx`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`, `e2e/chat-tool-call.spec.ts`

### UIC-CHAT-TOOL-CALL-2.4 - No details

Without `children`, `args` or `result`, the body shall show the provider's `toolCallNoDetails` string in `ui-chat-tool-call__empty`.

Implementation: `src/components/chat-tool-call/tool-call-parts.tsx`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`

### UIC-CHAT-TOOL-CALL-2.5 - Error

A `failed` call with an `error` shall show the error in a `ui-chat-tool-call__error` element at the top of the body, before the arguments and result or the custom body, with a decorative `error` glyph. Like the rest of the body, it shows only while the card is expanded, so collapsing the card hides all of the error; the trigger keeps the label, the `error` status glyph and the `Failed` status.

Implementation: `src/components/chat-tool-call/chat-tool-call.tsx`, `src/components/chat-tool-call/tool-call-parts.tsx`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`, `e2e/chat-tool-call.spec.ts`

## UIC-CHAT-TOOL-CALL-3 - Expansion

### UIC-CHAT-TOOL-CALL-3.1 - Expanded state

Pressing the trigger shall toggle the body as [UIC-DISCLOSURE-1.2](DISCLOSURE.md#uic-disclosure-12---expanding-and-collapsing) does. Uncontrolled, the card follows its status, open while it is `approval-requested` and closed otherwise, until the reader toggles it; a `failed` call starts closed, whether it is loaded failed or fails while shown; from then on the reader's choice holds. `defaultExpanded` sets the state at first instead, and it then holds until the reader toggles it. `isExpanded` controls the state, and `onExpandedChange` receives each requested state, also while controlled.

Implementation: `src/components/chat-tool-call/chat-tool-call.tsx`
Verification: `src/components/chat-tool-call/chat-tool-call.test.tsx`, `e2e/chat-tool-call.spec.ts`

## UIC-CHAT-TOOL-CALL-4 - Approval

### UIC-CHAT-TOOL-CALL-4.1 - Request

While the call is `approval-requested` and `approval.decision` is unset, the approval is pending: after the disclosure, a `ui-chat-tool-call__approval` `group` labelled by its prompt (`ui-chat-tool-call__prompt`, the provider's `toolCallApprovalPrompt` from the label, `Allow “Search recipes”?`) shall hold a `ui-chat-tool-call__actions` row of small buttons (`ui-chat-tool-call__action`, with `data-action`), each only when its callback is given: Approve (`approve`, primary, the provider's `approve` string) calls `onApprove`; Deny (`deny`, the provider's `toolCallDeny`) opens the reason form ([UIC-CHAT-TOOL-CALL-4.2](#uic-chat-tool-call-42---deny-with-a-reason)); Always allow (`always`, the provider's `toolCallAlwaysAllow` from `approval.scopeLabel`, `Always allow in this conversation`) calls `onAlwaysAllow`. The body is open by default ([UIC-CHAT-TOOL-CALL-3.1](#uic-chat-tool-call-31---expanded-state)), so the reader sees what the tool will do.

Implementation: `src/components/chat-tool-call/chat-tool-call.tsx`, `src/components/chat-tool-call/tool-call-approval.tsx`, `src/core/chat-tool-strings.ts`
Verification: `src/components/chat-tool-call/tool-call-approval.test.tsx`, `e2e/chat-tool-call.spec.ts`

### UIC-CHAT-TOOL-CALL-4.2 - Deny with a reason

Pressing Deny shall replace the buttons with a `ui-chat-tool-call__deny-form` holding a [Text Field](TEXT-FIELD.md) (`ui-chat-tool-call__reason`, labelled by the provider's `toolCallDenyReason`), which takes focus, then Send (the provider's `send`) and Cancel (`cancel`). Send, or Enter in the field, calls `onDeny` with the trimmed reason, or with no reason when it is blank, closes the form and moves focus to Deny. Cancel closes the form, forgets the reason and moves focus to Deny without calling `onDeny`. The form closes, forgetting the reason, when the approval stops being pending, so a later request starts with the buttons.

Implementation: `src/components/chat-tool-call/tool-call-approval.tsx`, `src/components/chat-tool-call/use-tool-call-approval.ts`
Verification: `src/components/chat-tool-call/tool-call-approval.test.tsx`, `e2e/chat-tool-call.spec.ts`

### UIC-CHAT-TOOL-CALL-4.3 - Keyboard shortcuts

While the approval is pending and focus is anywhere in the card, Ctrl+Enter or Cmd+Enter shall call `onApprove`, or send the denial while the reason form is open, and Escape shall move focus to Deny, or cancel the open reason form. The card catches these keys before the focused control, so a focused button is not pressed by them; Escape with focus already on Deny (once Deny's tooltip, which keyboard focus opens, has closed on a first Escape), keys whose callback is missing and keys on a resolved approval go on to the page, so an enclosing transcript can take them. Approve publishes `Ctrl+Enter` and Deny `Escape` through the [Button](BUTTON.md)'s `shortcut` (`aria-keyshortcuts` and the tooltip's keys, [UIC-BUTTON-1.7](BUTTON.md#uic-button-17---keyboard-shortcut)) whenever they show, as a disabled command keeps its shortcut.

Implementation: `src/components/chat-tool-call/use-tool-call-approval.ts`, `src/components/chat-tool-call/tool-call-approval.tsx`
Verification: `src/components/chat-tool-call/use-tool-call-approval.test.tsx`, `e2e/chat-tool-call.spec.ts`

### UIC-CHAT-TOOL-CALL-4.4 - Decision

Once `approval.decision` is set, whatever the status, the approval shall be resolved: the prompt leaves, the group publishes `data-decision` (`approved`, `denied` or `always`) and is labelled by the decision, which shows in a `ui-chat-tool-call__decision` status (`role="status"`, present while the approval shows, so a decision made while it is on the page is announced) as the provider's `toolCallDecision`: `Approved`, `Denied`, `Denied: <reason>` with `approval.reason`, or `Always allowed`. The keyboard shortcuts stop working. A call that leaves `approval-requested` without a decision shows no approval.

Implementation: `src/components/chat-tool-call/tool-call-approval.tsx`, `src/core/chat-tool-strings.ts`
Verification: `src/components/chat-tool-call/tool-call-approval.test.tsx`, `e2e/chat-tool-call.spec.ts`

### UIC-CHAT-TOOL-CALL-4.5 - Focus across changes

When the approval resolves while focus is inside it, its buttons shall stay, the same elements with `aria-disabled="true"`, until focus moves to another element outside the approval, so the reader keeps their place and can read the buttons they had; otherwise a resolved approval shows only its decision. When the approval leaves the card while focus is inside it, focus moves to the card's trigger.

Implementation: `src/components/chat-tool-call/tool-call-approval.tsx`
Verification: `src/components/chat-tool-call/tool-call-approval.test.tsx`, `e2e/chat-tool-call.spec.ts`

## Hooks

| Hook                              | Kind      | Values                                                                                   | Description                                                             |
| --------------------------------- | --------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `ui-chat-tool-call`               | root      |                                                                                          | The card's `<div>`.                                                     |
| `ui-chat-tool-call__disclosure`   | slot      |                                                                                          | The collapsible header and body (also `ui-disclosure`).                 |
| `ui-chat-tool-call__heading`      | slot      |                                                                                          | The heading around the trigger (also `ui-disclosure__heading`).         |
| `ui-chat-tool-call__status-glyph` | slot      |                                                                                          | The status glyph in the trigger (also `ui-glyph`).                      |
| `ui-chat-tool-call__summary`      | slot      |                                                                                          | The label, status, duration and badge, which wrap beside the glyph.     |
| `ui-chat-tool-call__label`        | slot      |                                                                                          | The label in the trigger.                                               |
| `ui-chat-tool-call__target`       | slot      |                                                                                          | What the call acted on, after the label.                                |
| `ui-chat-tool-call__status`       | slot      |                                                                                          | The status text in the trigger.                                         |
| `ui-chat-tool-call__duration`     | slot      |                                                                                          | The duration in the trigger.                                            |
| `ui-chat-tool-call__badge`        | slot      |                                                                                          | The auto-approved badge (also `ui-badge`).                              |
| `ui-chat-tool-call__body`         | slot      |                                                                                          | The collapsible body (also `ui-disclosure__panel`).                     |
| `ui-chat-tool-call__part`         | slot      |                                                                                          | The arguments or the result.                                            |
| `ui-chat-tool-call__part-header`  | slot      |                                                                                          | A part's title and copy button.                                         |
| `ui-chat-tool-call__part-title`   | slot      |                                                                                          | A part's title.                                                         |
| `ui-chat-tool-call__copy`         | slot      |                                                                                          | A part's copy button (also `ui-copy-button`).                           |
| `ui-chat-tool-call__json`         | slot      |                                                                                          | A part's scrolling JSON text (also `ui-scroll-region`).                 |
| `ui-chat-tool-call__empty`        | slot      |                                                                                          | The note of a body with nothing to show.                                |
| `ui-chat-tool-call__error`        | slot      |                                                                                          | A failed call's error, at the top of the body.                          |
| `ui-chat-tool-call__approval`     | slot      |                                                                                          | The approval request, then its decision.                                |
| `ui-chat-tool-call__prompt`       | slot      |                                                                                          | The pending request's question.                                         |
| `ui-chat-tool-call__actions`      | slot      |                                                                                          | The row of approval buttons.                                            |
| `ui-chat-tool-call__action`       | slot      |                                                                                          | An approval button (also `ui-button`).                                  |
| `ui-chat-tool-call__deny-form`    | slot      |                                                                                          | The deny reason form (also `ui-form`).                                  |
| `ui-chat-tool-call__reason`       | slot      |                                                                                          | The deny reason field (also `ui-text-field`).                           |
| `ui-chat-tool-call__decision`     | slot      |                                                                                          | The decision status.                                                    |
| `data-variant`                    | attribute | `card`, `row`                                                                            | On the card: a card on its own, or a quiet row among a reply's steps.   |
| `data-status`                     | state     | `pending`, `running`, `approval-requested`, `succeeded`, `failed`, `denied`, `cancelled` | On the card: where the call stands.                                     |
| `data-kind`                       | state     | `read`, `edit`, `command`, `search`, `fetch`, `other`                                    | On the card: what the call does.                                        |
| `data-auto-approved`              | state     | `true`                                                                                   | On the card: the call ran without asking because it was always allowed. |
| `data-part`                       | state     | `arguments`, `result`                                                                    | On a part: which value it shows.                                        |
| `data-action`                     | state     | `approve`, `deny`, `always`                                                              | On an approval button: what it does.                                    |
| `data-decision`                   | state     | `approved`, `denied`, `always`                                                           | On the approval: the reader's decision, once made.                      |
