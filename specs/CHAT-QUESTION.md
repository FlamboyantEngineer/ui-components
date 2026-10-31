# Chat Question

`ChatQuestion` is an inline card in which an agent asks the reader one or several questions inside a conversation. Each question is answered by one option (radios), any options (checkboxes) or the reader's own words; options may carry a description, a "Recommended" badge and a Markdown preview, and a question may offer "Other" with a field for the reader's own words. A pending card shows its questions as tabs with a counter, one question at a time; the reader picks any question by its tab or steps with Back and Next. Submit sends every answer at once, and the host may accept them asynchronously: the card is locked while they are sent and keeps every answer when they are refused. Without an answer handler a pending card is read-only. Once answered the card collapses to a summary of the answers; once dismissed it says so. The card takes the `ChatQuestionData` fields of a message part, so a conversation renders it by spreading the part's data.

## UIC-CHAT-QUESTION-1 - Card and questions

### UIC-CHAT-QUESTION-1.1 - Card

`ChatQuestion` shall render a `ui-chat-question` root with `role="group"`, named by its first question through the provider's `questionAsked` string (`Question: <first question>`, or `3 questions: <first question>` for several), so the name differs from the question group inside it; its `id` is the card's `id`. It takes the data fields `id`, `questions`, `status` and `answers` (`ChatQuestionData`), `onSubmit`, `onDismiss` and `answeredMark` ([UIC-CHAT-QUESTION-3.4](#uic-chat-question-34---answered-tabs)), publishes `status` as `data-status` (`pending`, `answered` or `dismissed`), `data-stepped` while it holds more than one question, `data-submitting` while a request it sent is unsettled (UIC-CHAT-QUESTION-2.7) and `answeredMark` as `data-answered-mark`.

Implementation: `src/components/chat-question/chat-question.tsx`, `src/components/chat-question/chat-question-model.ts`, `labs/reference/chat-question.css`
Verification: `src/components/chat-question/chat-question.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-1.2 - Question

A pending card shall show its question in `ui-chat-question__item`, which publishes the question's `selectionMode` as `data-selection-mode` (`single`, `multiple` or `none`) and holds the question's text in a paragraph (`ui-chat-question__question`) and then its answer. The question's `header` labels its tab ([UIC-CHAT-QUESTION-3.1](#uic-chat-question-31---tabs)).

Implementation: `src/components/chat-question/chat-question-item.tsx`, `labs/reference/chat-question.css`
Verification: `src/components/chat-question/chat-question.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-1.3 - Single choice

A `single` question shall draw its options as a React Aria radio group (`ui-chat-question__options`, role `radiogroup`, named by the question's text), one `Radio` per option, in order, each in a `ui-chat-question__option` wrapper that publishes `data-selected` while chosen. The group follows the radio group pattern of the WAI-ARIA Authoring Practices: Tab enters it once, on the chosen radio or else the first; the arrow keys move to the next or previous radio, wrapping at the ends, and choose it; Space chooses the focused radio.

Implementation: `src/components/chat-question/chat-question-choices.tsx`, `src/components/chat-question/chat-question-fields.tsx`
Verification: `src/components/chat-question/chat-question.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-1.4 - Multiple choice

A `multiple` question shall draw its options as a React Aria checkbox group (`ui-chat-question__options`, role `group`, named by the question's text), one `Checkbox` per option, in order, each in a `ui-chat-question__option` wrapper that publishes `data-selected` while ticked. Each box is a Tab stop and Space toggles it.

Implementation: `src/components/chat-question/chat-question-choices.tsx`, `src/components/chat-question/chat-question-fields.tsx`
Verification: `src/components/chat-question/chat-question.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-1.5 - Free text

A `none` question shall be answered in the reader's own words only: a required single-line [Text Field](TEXT-FIELD.md) (`ui-chat-question__text`) named by the question's text, with the provider's `questionAnswerPlaceholder` as its hint. Its options are ignored.

Implementation: `src/components/chat-question/chat-question-item.tsx`, `src/components/chat-question/chat-question-fields.tsx`
Verification: `src/components/chat-question/chat-question.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-1.6 - Options

An option's `label` shall name its radio or checkbox, and its `description` render after it in `ui-chat-question__description`, which describes the input (`aria-describedby`). An option with `isRecommended` adds a small info [Badge](BADGE.md) (`ui-chat-question__recommended`) with the provider's `questionRecommended` string after the label, inside the input's name, and its wrapper publishes `data-recommended`. A recommended option is not chosen for the reader.

Implementation: `src/components/chat-question/chat-question-fields.tsx`, `src/core/strings/chat-question.ts`
Verification: `src/components/chat-question/chat-question.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-1.7 - Other

A question with `allowsOther` shall end its options with one named by the provider's `questionOther` string, whose wrapper publishes `data-other`. While Other is chosen, a required single-line [Text Field](TEXT-FIELD.md) (`ui-chat-question__other`, named by `questionOtherAnswer`, with the `questionAnswerPlaceholder` hint) follows the group for the reader's own words. Choosing Other by a press or Space moves focus to the field; an arrow key that moves onto Other while walking the radios chooses it but keeps focus on the radio, so the arrow keys keep moving and Tab reaches the field next. In a `single` question Other replaces the chosen option; in a `multiple` one it adds to the ticked options. The words are kept while another option is chosen.

Implementation: `src/components/chat-question/chat-question-choices.tsx`, `src/components/chat-question/chat-question-model.ts`
Verification: `src/components/chat-question/chat-question.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-1.8 - Previews

The group, the Other field and the preview of a question with options shall sit in `ui-chat-question__answer`, which publishes `data-has-preview` while an option has a `preview`. The preview (`ui-chat-question__preview`, a `group` named by the provider's `questionPreview` string from the option's label) shows the option's `preview` through [Markdown](MARKDOWN.md), after the group, for the option whose radio or checkbox has focus; while none has focus it shows the first chosen option with a preview, and nothing while that is none or the focused option has no preview. The reference stylesheet sets it beside the options, or below them on a narrow card, and wraps its code rather than scrolling it, since a scrolling preview is one more Tab stop (the browser makes a scroll container without focusable content focusable).

Implementation: `src/components/chat-question/chat-question-choices.tsx`, `src/components/chat-question/chat-question-model.ts`, `labs/reference/chat-question.css`
Verification: `src/components/chat-question/chat-question.test.tsx`, `src/components/chat-question/chat-question-model.test.ts`, `e2e/chat-question.spec.ts`

## UIC-CHAT-QUESTION-2 - Answering

### UIC-CHAT-QUESTION-2.1 - Answers

A question shall count as answered once it has an option chosen or Other chosen, and words whenever Other is chosen; a `none` question once it has words (text that is not only white space). The answer of a question is a `ChatQuestionAnswer`: its `questionId`, the chosen options' ids in `optionIds` in the order they are offered, and, when Other is chosen or the question is `none`, the trimmed words in `otherText`.

Implementation: `src/components/chat-question/chat-question-model.ts`
Verification: `src/components/chat-question/chat-question-model.test.ts`, `src/components/chat-question/chat-question.test.tsx`

### UIC-CHAT-QUESTION-2.2 - Submit

A pending card with `onSubmit` shall draw a primary Submit [Button](BUTTON.md) (`ui-chat-question__submit`, the provider's `questionSubmit` string) in `ui-chat-question__actions`, after the last question in a stepped card. Until every question is answered it is unavailable but focusable (`aria-disabled="true"`) and hints why in a tooltip (`questionAnswerAllToSubmit`). Pressing it calls `onSubmit` with one answer per question, in order. The card stays pending until its `status` changes.

Implementation: `src/components/chat-question/chat-question-pending.tsx`, `src/core/strings/chat-question.ts`
Verification: `src/components/chat-question/chat-question-pending.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-2.3 - Dismiss

With `onDismiss`, a pending card shall end its actions with a ghost Dismiss [Button](BUTTON.md) (`ui-chat-question__dismiss`, the provider's `dismiss` string) that calls it, whether or not the card can be answered. A promise it returns is awaited as the answers are (UIC-CHAT-QUESTION-2.7, UIC-CHAT-QUESTION-2.8). Without `onDismiss` there is no Dismiss button.

Implementation: `src/components/chat-question/chat-question-pending.tsx`, `src/components/chat-question/chat-question-request.ts`
Verification: `src/components/chat-question/chat-question-pending.test.tsx`, `src/components/chat-question/chat-question-request.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-2.4 - Enter in an answer field

Enter without a modifier, outside an input method's composition, in the free-text field or the Other field of a card that can be answered and sends nothing (UIC-CHAT-QUESTION-2.7, UIC-CHAT-QUESTION-2.9) shall go on as the primary button would: to the next question, or from the last question submit, or, when an earlier question is still open, to it. While the shown question has no answer, Enter instead shows the field's validation.

Implementation: `src/components/chat-question/chat-question-fields.tsx`, `src/components/chat-question/chat-question-pending.tsx`
Verification: `src/components/chat-question/chat-question-pending.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-2.5 - Validation

The free-text and Other fields shall be required fields (UIC-FIELD-3.1), except while read-only (UIC-CHAT-QUESTION-2.7, UIC-CHAT-QUESTION-2.9), that show their validation once focus leaves them or Enter asks for an answer they lack: the message renders in the field's message slot, is announced, and the input reports `aria-invalid` and `aria-errormessage`. Their committed value follows their value, so they are never dirty: they draw no restore button and leave Escape to the conversation around them.

Implementation: `src/components/chat-question/chat-question-fields.tsx`
Verification: `src/components/chat-question/chat-question-pending.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-2.6 - Focus once settled

When the reader's Submit or Dismiss is followed by the card leaving `pending`, focus shall move to the card's root (focusable by script while not pending) if it was lost with the pressed button or is still inside the card, so keyboard focus never falls to the page; focus the reader moved elsewhere stays there.

Implementation: `src/components/chat-question/chat-question.tsx`
Verification: `src/components/chat-question/chat-question-pending.test.tsx`

### UIC-CHAT-QUESTION-2.7 - Submitting

`onSubmit` and `onDismiss` may return a promise. From the press (or Enter) until it settles, the card shall be submitting: the root publishes `data-submitting`, the button pressed is pending ([Button](BUTTON.md)'s `isPending`: it keeps focus and refuses presses), the other actions are unavailable, and the answers are read-only (a read-only radio or checkbox group publishes `data-readonly` and `aria-readonly`; a field that has focus keeps it). One request runs at a time: a second press or Enter sends nothing, including before the submitting state renders. When the promise resolves the card is no longer submitting and keeps the answers as given, staying pending until the host changes its `status`. A callback that returns no promise leaves no submitting state.

Implementation: `src/components/chat-question/chat-question-request.ts`, `src/components/chat-question/chat-question.tsx`, `src/components/chat-question/chat-question-pending.tsx`, `src/components/chat-question/chat-question-choices.tsx`, `src/components/chat-question/chat-question-fields.tsx`, `labs/reference/chat-question.css`
Verification: `src/components/chat-question/chat-question-request.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-2.8 - Refused requests

When `onSubmit` or `onDismiss` throws or its promise rejects, the card shall keep every option chosen, every word typed (Other's included) and the question shown, and show why in an [Inline Error](INLINE-ERROR.md) (`ui-chat-question__error`, an assertive alert) before the actions: the error's message, else the provider's `questionSubmitFailed` string for answers or the common `actionFailed` string for a dismissal. The actions are available again, so the reader can retry; the message stays until the next request.

Implementation: `src/components/chat-question/chat-question-request.ts`, `src/components/chat-question/chat-question-pending.tsx`, `src/core/strings/chat-question.ts`, `labs/reference/chat-question.css`
Verification: `src/components/chat-question/chat-question-request.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-2.9 - Read-only card

A pending card without `onSubmit` shall be read-only: its options and fields show without taking changes (`data-readonly`, `aria-readonly`, `readonly`), a field asks for no answer, Enter does nothing and there is no Submit. A stepped read-only card offers Next on every question but the last, so the reader can read each question. A card with one question and no `onDismiss` draws no actions.

Implementation: `src/components/chat-question/chat-question-pending.tsx`, `src/components/chat-question/chat-question-choices.tsx`, `src/components/chat-question/chat-question-fields.tsx`
Verification: `src/components/chat-question/chat-question-request.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-2.10 - Scope

The reader's drafts, the question shown and the card's requests shall belong to the card's `id` while it is pending. A card that changes `id` starts afresh with no drafts, the first question and no request; a request that settles after the card changed `id`, left `pending` or unmounted changes nothing, so it never marks, fails or unlocks another card.

Implementation: `src/components/chat-question/chat-question-request.ts`, `src/components/chat-question/chat-question.tsx`
Verification: `src/components/chat-question/chat-question-request.test.tsx`

## UIC-CHAT-QUESTION-3 - Several questions

### UIC-CHAT-QUESTION-3.1 - Tabs

A pending card shall show one question at a time, starting with the first, in a [Tabs](TABS.md) family (`ui-chat-question__tabs`, small): a tab list named by the provider's `questionSteps` string with one tab (`ui-chat-question__tab`) per question, labelled by its `header`, or `questionStep` from its position when it has none, then the counter (`ui-chat-question__progress`), then the shown question in the selected tab's panel (`ui-chat-question__panel`). The shown question's tab is selected (`data-selected`, `aria-selected="true"`). The tabs keep one tab stop: the arrow keys, Home and End move to a tab and show its question at once. A tab list that does not fit scrolls, with scroll buttons at an edge that hides tabs (UIC-TABS-2.7), keeping the selected tab in view. A card with one question shows one tab and the counter "1/1" too.

Implementation: `src/components/chat-question/chat-question-tabs.tsx`, `src/components/chat-question/chat-question-pending.tsx`, `labs/reference/chat-question.css`
Verification: `src/components/chat-question/chat-question-tabs.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-3.2 - Counter

The counter shall follow the tab list on its row and show the shown question's position and the number of questions through the provider's `questionCounter` string ("2/3"), hidden from assistive technology, which reads `questionProgress` ("Question 2 of 3") instead.

Implementation: `src/components/chat-question/chat-question-tabs.tsx`, `src/core/strings/chat-question.ts`
Verification: `src/components/chat-question/chat-question-tabs.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-3.3 - Choosing a question

Pressing any question's tab, at any time, shall show that question, answered or not and wherever it sits: the tabs never wait for an answer, and stay usable while the card is read-only or a request runs, so the reader can look through the questions. Focus stays on the tab, and the reader's choices and words are kept for every question.

Implementation: `src/components/chat-question/chat-question-tabs.tsx`, `src/components/chat-question/chat-question-pending.tsx`
Verification: `src/components/chat-question/chat-question-tabs.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-3.4 - Answered tabs

Every answered question's tab shall publish `data-answered` and take the provider's `questionAnsweredTab` string ("Answered") as its accessible description. `answeredMark` chooses what else marks it: `icon` (the default) draws a check glyph before the label (the tab's `ui-tabs__icon`); `style` draws nothing more, leaving `data-answered`, with the root's `data-answered-mark="style"`, to the stylesheet. `ChatParts` takes it as `questionAnsweredMark` for its question parts, and `Chat` passes it on.

Implementation: `src/components/chat-question/chat-question-tabs.tsx`, `src/components/chat-question/chat-question.tsx`, `src/components/chat-parts/chat-part-view.tsx`, `labs/reference/chat-question.css`
Verification: `src/components/chat-question/chat-question-tabs.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-3.5 - Back and Next

A card with more than one question shall draw a Back [Button](BUTTON.md) (`ui-chat-question__back`, the provider's `back` string) on every question but the first, and a primary Next button (`ui-chat-question__next`, `next`) on every question but the last, where Submit takes its place. Next is unavailable but focusable (`aria-disabled="true"`) while the shown question has no answer and hints why in a tooltip (`questionAnswerToContinue`). Back and Next select the tab of the question they show. The reader's choices and words are kept when they step back and forth.

Implementation: `src/components/chat-question/chat-question-pending.tsx`
Verification: `src/components/chat-question/chat-question-pending.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-3.6 - Focus on step

Stepping to another question by Back, Next or Enter shall move focus to that question's answer: its chosen radio, else its first radio, checkbox or text field, so the reader answers each question from the keyboard without searching for it. Choosing a question by its tab leaves focus on the tab.

Implementation: `src/components/chat-question/chat-question-pending.tsx`
Verification: `src/components/chat-question/chat-question-pending.test.tsx`, `e2e/chat-question.spec.ts`

## UIC-CHAT-QUESTION-4 - Status

### UIC-CHAT-QUESTION-4.1 - Answered

An `answered` card shall collapse to a description list (`ui-chat-question__summary`) of `ui-chat-question__summary-item` groups, one per question, each holding the question's text (`ui-chat-question__summary-question`, a term) and what the reader answered from `answers` (`ui-chat-question__summary-answer`, its definition): `questionChose` with the chosen options' labels in offered order and then the words given for Other ("You chose PostgreSQL and Redis"), `questionAnsweredText` with the words of a `none` question, or `questionNoAnswer` for a question without an answer.

Implementation: `src/components/chat-question/chat-question-summary.tsx`, `src/components/chat-question/chat-question-model.ts`, `src/core/strings/chat-question.ts`
Verification: `src/components/chat-question/chat-question.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-4.2 - Dismissed

A `dismissed` card shall collapse to its first question's text (`ui-chat-question__question`) and the provider's `questionDismissed` string in `ui-chat-question__status`.

Implementation: `src/components/chat-question/chat-question-summary.tsx`
Verification: `src/components/chat-question/chat-question.test.tsx`, `e2e/chat-question.spec.ts`

### UIC-CHAT-QUESTION-4.3 - Announcement

A pending card shall hold a visually hidden polite status (`ui-chat-question__announcement`, `role="status"`) that receives the card's name (`questionAsked` with its first question and its question count) once, right after the card mounts, so the card is announced once without making it a live region.

Implementation: `src/components/chat-question/chat-question.tsx`, `src/core/strings/chat-question.ts`
Verification: `src/components/chat-question/chat-question.test.tsx`

## UIC-CHAT-QUESTION-5 - Strings and hooks

### UIC-CHAT-QUESTION-5.1 - Strings

Every string the card renders shall come from the provider: its own in `src/core/strings/chat-question.ts`, with counts and lists formed by functions, and `back`, `next`, `dismiss` and `actionFailed` from the common strings.

Implementation: `src/core/strings/chat-question.ts`, `src/core/strings.ts`
Verification: `src/components/chat-question/chat-question.test.tsx`

### UIC-CHAT-QUESTION-5.2 - Hooks and caller attributes

`ChatQuestion` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes to its root.

Implementation: `src/components/chat-question/chat-question.tsx`
Verification: `src/components/chat-question/chat-question.test.tsx`

## Hooks

| Hook                                 | Kind      | Values                             | Description                                                              |
| ------------------------------------ | --------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `ui-chat-question`                   | root      |                                    | The card (`role="group"`).                                               |
| `ui-chat-question__tabs`             | slot      |                                    | The questions' tabs, the counter and the panel (also `ui-tabs`).         |
| `ui-chat-question__tab`              | slot      |                                    | One question's tab (also `ui-tabs__tab`).                                |
| `ui-chat-question__progress`         | slot      |                                    | The counter after the tabs.                                              |
| `ui-chat-question__panel`            | slot      |                                    | The shown question's panel (also `ui-tabs__panel`).                      |
| `ui-chat-question__item`             | slot      |                                    | The shown question.                                                      |
| `ui-chat-question__question`         | slot      |                                    | The question's text.                                                     |
| `ui-chat-question__answer`           | slot      |                                    | The options, the Other field and the preview.                            |
| `ui-chat-question__options`          | slot      |                                    | The radio group or checkbox group.                                       |
| `ui-chat-question__option`           | slot      |                                    | One option: its radio or checkbox and description.                       |
| `ui-chat-question__recommended`      | slot      |                                    | The "Recommended" badge (also `ui-badge`).                               |
| `ui-chat-question__description`      | slot      |                                    | An option's description.                                                 |
| `ui-chat-question__other`            | slot      |                                    | The field for the words given for Other (also `ui-text-field`).          |
| `ui-chat-question__text`             | slot      |                                    | The field of a free-text question (also `ui-text-field`).                |
| `ui-chat-question__preview`          | slot      |                                    | The preview of the focused or chosen option.                             |
| `ui-chat-question__error`            | slot      |                                    | Why the last request failed (also `ui-inline-error`).                    |
| `ui-chat-question__actions`          | slot      |                                    | Back, Next or Submit, and Dismiss.                                       |
| `ui-chat-question__back`             | slot      |                                    | The Back button (also `ui-button`).                                      |
| `ui-chat-question__next`             | slot      |                                    | The Next button (also `ui-button`).                                      |
| `ui-chat-question__submit`           | slot      |                                    | The Submit button (also `ui-button`).                                    |
| `ui-chat-question__dismiss`          | slot      |                                    | The Dismiss button (also `ui-button`).                                   |
| `ui-chat-question__announcement`     | slot      |                                    | The visually hidden status that announces a pending card.                |
| `ui-chat-question__summary`          | slot      |                                    | The answers of an answered card (`<dl>`).                                |
| `ui-chat-question__summary-item`     | slot      |                                    | One question and its answer.                                             |
| `ui-chat-question__summary-question` | slot      |                                    | The question's text (`<dt>`).                                            |
| `ui-chat-question__summary-answer`   | slot      |                                    | What the reader answered (`<dd>`).                                       |
| `ui-chat-question__status`           | slot      |                                    | "Dismissed" on a dismissed card.                                         |
| `data-status`                        | attribute | `pending`, `answered`, `dismissed` | On the root: whether the card asks or sums up.                           |
| `data-stepped`                       | state     | `true`                             | On the root: more than one question, asked one at a time while pending.  |
| `data-submitting`                    | state     | `true`                             | On the root: the answers or the dismissal sent are unsettled.            |
| `data-answered-mark`                 | attribute | `icon`, `style`                    | On the root: how answered tabs are marked.                               |
| `data-selection-mode`                | attribute | `single`, `multiple`, `none`       | On the item: how the question is answered.                               |
| `data-has-preview`                   | state     | `true`                             | On the answer: an option has a preview.                                  |
| `data-orientation`                   | attribute | `vertical`                         | On the radio group: the arrow-key axis (React Aria).                     |
| `data-readonly`                      | state     | `true`                             | On the options: read-only while submitting or unanswerable (React Aria). |
| `data-selected`                      | state     | `true`                             | On an option: chosen or ticked.                                          |
| `data-recommended`                   | state     | `true`                             | On an option: the agent recommends it.                                   |
| `data-other`                         | state     | `true`                             | On an option: the Other choice.                                          |
| `data-answered`                      | state     | `true`                             | On a tab: the question has an answer.                                    |
