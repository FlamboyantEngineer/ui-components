# Chat Activity

The activity family shows what an assistant does while it answers, as parts of a reply in a [Chat Transcript](CHAT-TRANSCRIPT.md). `ChatReasoning` is the assistant's reasoning: open while it streams in, collapsed to how long it took once complete. `ChatSteps` folds the consecutive reasoning and tool calls of one reply into one group: open while the run goes on, collapsed to one line summing up what it did ("Edited files, ran a command") once it ends. `ChatPlan` is the assistant's plan, an ordered list of steps that each say where they stand. `ChatStatusLine` is one live line saying what the assistant is thinking or doing now. The family has no `ChatActivity` component; `chat-activity.ts` holds the data types the parts take (`ChatReasoningData`, `ChatPlanData`, `ChatPlanStep`) and the values they derive from them.

`ChatReasoning` and `ChatSteps` are disclosures without a heading (React Aria `Disclosure`), so a reply's activity does not add to the page's outline. Unlike a `Disclosure`, they open and close on their own as the work progresses, until the reader chooses.

## UIC-CHAT-ACTIVITY-1 - Reasoning

### UIC-CHAT-ACTIVITY-1.1 - Disclosure

`ChatReasoning` shall render a `ui-chat-reasoning` root (React Aria `Disclosure`) holding a trigger button (`ui-chat-reasoning__trigger`) with the disclosure's indicator glyph (`ui-chat-reasoning__indicator`, pointing to the inline end while collapsed and down while open) and its label (`ui-chat-reasoning__label`), then the panel (`ui-chat-reasoning__panel`, a `group` named by the trigger) holding the text (`ui-chat-reasoning__text`). The trigger's `aria-expanded` follows the panel, and the root publishes `data-expanded` while it is open. The root publishes the `status` as `data-status` and the `format` as `data-format`.

Implementation: `src/components/chat-activity/chat-reasoning.tsx`, `src/components/chat-activity/activity-disclosure.tsx`
Verification: `src/components/chat-activity/chat-reasoning.test.tsx`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-1.2 - Streaming

While its `status` is `streaming`, `ChatReasoning` shall be open, labelled by its `title` (what the reasoning is about now, such as "Checking opening hours"), else the provider string `chatReasoningStreaming` ("Thinking…"), with a decorative busy indicator (`ui-chat-reasoning__spinner`) after the label, and its panel shall be busy (`aria-busy="true"`) while the text streams in. With `expandsAutomatically` false it stays closed while it streams, until the reader opens it; it is busy and labelled the same.

Implementation: `src/components/chat-activity/chat-reasoning.tsx`, `src/components/chat-activity/activity-disclosure.tsx`, `src/core/strings/chat-activity.ts`
Verification: `src/components/chat-activity/chat-reasoning.test.tsx`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-1.3 - Complete

Once its `status` is `complete`, `ChatReasoning` shall collapse, drop the busy indicator and `aria-busy`, and be labelled by the provider string `chatReasoningComplete` with `durationMs` in whole seconds, rounded: "Thought for 4 s", or minutes and seconds from a minute on ("Thought for 1 min 5 s"). Without a duration, or under half a second, the label reads "Thought for a moment".

Implementation: `src/components/chat-activity/chat-reasoning.tsx`, `src/components/chat-activity/chat-activity.ts`, `src/core/strings/chat-activity.ts`
Verification: `src/components/chat-activity/chat-reasoning.test.tsx`, `src/components/chat-activity/chat-activity.test.ts`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-1.4 - Format

`ChatReasoning` shall render its `text` as Markdown through the [Markdown](MARKDOWN.md) component by default (`format="markdown"`; the text slot is then also `ui-markdown`), in Markdown's streaming mode while its `status` is `streaming`, so incomplete syntax at the end of the text renders as it will once complete ([UIC-MARKDOWN-2.11](MARKDOWN.md#uic-markdown-211---streaming-incomplete-syntax)); and as plain text in a `<div>` with `format="plain"`, where Markdown syntax shows as written.

Implementation: `src/components/chat-activity/chat-reasoning.tsx`
Verification: `src/components/chat-activity/chat-reasoning.test.tsx`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-1.5 - Reader's choice

Pressing the trigger (pointer, Enter or Space) shall open or close `ChatReasoning`, and that choice shall win over the status from then on: reasoning the reader collapsed while it streams stays collapsed, and reasoning the reader opened stays open once complete. `defaultExpanded` starts it open or closed as if the reader had chosen. `isExpanded` controls it; while it is `undefined` the reasoning follows its status and the reader. `onExpandedChange` receives each state the reader requests, also while controlled. While focus is inside the panel, it does not collapse on its own; it collapses once focus leaves.

Implementation: `src/components/chat-activity/activity-disclosure.tsx`
Verification: `src/components/chat-activity/chat-reasoning.test.tsx`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-1.6 - Hooks and caller attributes

`ChatReasoning` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes to its root.

Implementation: `src/components/chat-activity/chat-reasoning.tsx`, `src/components/chat-activity/activity-disclosure.tsx`
Verification: `src/components/chat-activity/chat-reasoning.test.tsx`

## UIC-CHAT-ACTIVITY-2 - Steps

### UIC-CHAT-ACTIVITY-2.1 - Group

`ChatSteps` shall render a `ui-chat-steps` root (React Aria `Disclosure`) holding a trigger button (`ui-chat-steps__trigger`) with the indicator glyph (`ui-chat-steps__indicator`), the glyph of its first action's kind (`ui-chat-steps__glyph`, [UIC-CHAT-TOOL-CALL-1.7](CHAT-TOOL-CALL.md#uic-chat-tool-call-17---kind)) when it has `actions`, and its label (`ui-chat-steps__label`), then the panel (`ui-chat-steps__panel`, a `group` named by the trigger) holding the children: the consecutive reasoning and tool-call parts of one reply. The root publishes `data-expanded` while it is open and `data-running` while `isRunning`.

Implementation: `src/components/chat-activity/chat-steps.tsx`, `src/components/chat-activity/activity-disclosure.tsx`
Verification: `src/components/chat-activity/chat-steps.test.tsx`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-2.2 - Running

While `isRunning`, `ChatSteps` shall be open, with a decorative busy indicator (`ui-chat-steps__spinner`) after its label, which is its `title` (what the run is doing now), else the provider string `chatStepsRunning` ("Working…"). With `expandsAutomatically` false it stays closed while it runs, until the reader opens it.

Implementation: `src/components/chat-activity/chat-steps.tsx`, `src/core/strings/chat-activity.ts`
Verification: `src/components/chat-activity/chat-steps.test.tsx`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-2.3 - End of the run

Once the run ends (`isRunning` is false, the default), `ChatSteps` shall collapse, drop the busy indicator and be labelled by the provider string `chatStepsComplete` with its `actions`: how many tool calls of each kind it made, kinds in order, each as a phrase in the singular for one call and the plural for more (`read` "read a file" or "read files", `edit` "edited a file", `command` "ran a command", `search` "ran a search", `fetch` "fetched a page", `other` "used a tool"), joined by commas with the first letter in upper case ("Edited files, read files, ran a command"). Without `actions`, the label is how long the run took, `durationMs` in whole seconds, rounded ("Worked for 12 s"), or "Worked for a moment" without a duration.

Implementation: `src/components/chat-activity/chat-steps.tsx`, `src/components/chat-activity/chat-activity.ts`, `src/core/strings/chat-activity.ts`
Verification: `src/components/chat-activity/chat-steps.test.tsx`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-2.4 - Reader's choice

Pressing the trigger (pointer, Enter or Space) shall open or close `ChatSteps`, and that choice shall win over the run from then on: steps the reader collapsed while running stay collapsed, and steps the reader opened after the run stay open. `defaultExpanded`, `isExpanded`, `onExpandedChange` and focus inside the panel behave as for reasoning ([UIC-CHAT-ACTIVITY-1.5](#uic-chat-activity-15---readers-choice)).

Implementation: `src/components/chat-activity/activity-disclosure.tsx`
Verification: `src/components/chat-activity/chat-steps.test.tsx`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-2.5 - Hooks and caller attributes

`ChatSteps` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes to its root.

Implementation: `src/components/chat-activity/chat-steps.tsx`, `src/components/chat-activity/activity-disclosure.tsx`
Verification: `src/components/chat-activity/chat-steps.test.tsx`

## UIC-CHAT-ACTIVITY-3 - Plan

### UIC-CHAT-ACTIVITY-3.1 - Parts

`ChatPlan` shall render a `ui-chat-plan` root holding a header (`ui-chat-plan__header`) with the `title`, when given (`ui-chat-plan__title`), and the progress (`ui-chat-plan__progress`), then an ordered list (`ui-chat-plan__list`) of the `steps` in order, named by the title or else the provider string `chatPlan` and described by the progress. Each step is a list item (`ui-chat-plan__step`) holding its status glyph (`ui-chat-plan__glyph`) or busy indicator (`ui-chat-plan__spinner`) and its label (`ui-chat-plan__label`).

Implementation: `src/components/chat-activity/chat-plan.tsx`
Verification: `src/components/chat-activity/chat-plan.test.tsx`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-3.2 - Step status

Each step shall publish its `status` as `data-status` and show it with a decorative glyph: `pending` the `pending` glyph, `done` the `success` glyph, `failed` the `error` glyph and `skipped` the `skipped` glyph; a step `in-progress` shows the busy indicator in place of a glyph and is the current step (`aria-current="step"`). After the label, visually hidden status words from the provider string `chatPlanStepStatus` ("Pending", "In progress", "Done", "Failed", "Skipped") say where it stands.

Implementation: `src/components/chat-activity/chat-plan.tsx`, `src/core/strings/chat-activity.ts`, `src/core/glyphs.tsx`
Verification: `src/components/chat-activity/chat-plan.test.tsx`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-3.3 - Progress

The progress shall read the provider string `chatPlanProgress` with the number of steps done and of all steps ("2 of 5 done").

Implementation: `src/components/chat-activity/chat-plan.tsx`, `src/components/chat-activity/chat-activity.ts`, `src/core/strings/chat-activity.ts`
Verification: `src/components/chat-activity/chat-plan.test.tsx`, `src/components/chat-activity/chat-activity.test.ts`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-3.4 - Announcements

`ChatPlan` shall announce the steps whose status changed in a visually hidden polite status, worded by the provider string `chatPlanChanged` ("Book the hotel: done. Pack the bags: in progress"), at most once every two seconds: changes that arrive sooner wait for the rest of the interval and are announced together, each with its latest status. The statuses of the first render, and steps added as pending, are not announced.

Implementation: `src/components/chat-activity/chat-plan.tsx`, `src/components/chat-activity/activity-announcer.tsx`, `src/components/chat-activity/chat-activity.ts`, `src/core/strings/chat-activity.ts`
Verification: `src/components/chat-activity/chat-plan.test.tsx`, `src/components/chat-activity/chat-activity.test.ts`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-3.5 - Hooks and caller attributes

`ChatPlan` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/chat-activity/chat-plan.tsx`
Verification: `src/components/chat-activity/chat-plan.test.tsx`

## UIC-CHAT-ACTIVITY-4 - Status line

### UIC-CHAT-ACTIVITY-4.1 - Line

While `isRunning` (the default), `ChatStatusLine` shall render a `ui-chat-status-line` root holding a decorative busy indicator (`ui-chat-status-line__spinner`), or the caller's `icon` in its place (`ui-chat-status-line__icon`, hidden from assistive technology), and its `text` (`ui-chat-status-line__text`), such as "Searching trains…". Without a `text`, or with an empty one, it reads the provider string `chatThinking` ("Thinking…"). A stylesheet may animate the text, such as a shimmer of colour across it, or the icon, and should stop under reduced motion. The visible text stays out of the accessibility tree, which hears it through the announcement ([UIC-CHAT-ACTIVITY-4.2](#uic-chat-activity-42---announcements)). The root publishes `activity` as `data-activity`: with `thinking` (the default) it shows as above; with `writing` (the assistant writes its answer) it shows the busy indicator or icon alone, without text, and announces nothing. Once `isRunning` is false the line renders nothing.

Implementation: `src/components/chat-activity/chat-status-line.tsx`
Verification: `src/components/chat-activity/chat-status-line.test.tsx`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-4.2 - Announcements

`ChatStatusLine` shall announce its text in a visually hidden polite status when the line appears and whenever the text changes, at most once every two seconds: a text that arrives sooner waits for the rest of the interval, and only the latest waiting text is announced.

Implementation: `src/components/chat-activity/chat-status-line.tsx`, `src/components/chat-activity/activity-announcer.tsx`
Verification: `src/components/chat-activity/chat-status-line.test.tsx`, `e2e/chat-activity.spec.ts`

### UIC-CHAT-ACTIVITY-4.3 - Hooks and caller attributes

`ChatStatusLine` shall carry the hooks below, append the caller's `className` and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/chat-activity/chat-status-line.tsx`
Verification: `src/components/chat-activity/chat-status-line.test.tsx`

## Hooks

| Hook                           | Kind      | Values                                                                         | Description                                                                        |
| ------------------------------ | --------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `ui-chat-reasoning`            | root      |                                                                                | Reasoning's disclosure `<div>` (React Aria `Disclosure`).                          |
| `ui-chat-reasoning__trigger`   | slot      |                                                                                | The trigger button.                                                                |
| `ui-chat-reasoning__indicator` | slot      |                                                                                | The disclosure chevron (also `ui-glyph`).                                          |
| `ui-chat-reasoning__label`     | slot      |                                                                                | The label: "Thinking…" or how long it took.                                        |
| `ui-chat-reasoning__spinner`   | slot      |                                                                                | The decorative busy indicator while it streams.                                    |
| `ui-chat-reasoning__panel`     | slot      |                                                                                | The panel (React Aria `DisclosurePanel`).                                          |
| `ui-chat-reasoning__text`      | slot      |                                                                                | The reasoning text (also `ui-markdown` in the Markdown format).                    |
| `ui-chat-steps`                | root      |                                                                                | A group of steps' disclosure `<div>` (React Aria `Disclosure`).                    |
| `ui-chat-steps__trigger`       | slot      |                                                                                | The trigger button.                                                                |
| `ui-chat-steps__indicator`     | slot      |                                                                                | The disclosure chevron (also `ui-glyph`).                                          |
| `ui-chat-steps__glyph`         | slot      |                                                                                | The glyph of the first action's kind (also `ui-glyph`).                            |
| `ui-chat-steps__label`         | slot      |                                                                                | The label: "Working…" or what the run did.                                         |
| `ui-chat-steps__spinner`       | slot      |                                                                                | The decorative busy indicator while the run goes on.                               |
| `ui-chat-steps__panel`         | slot      |                                                                                | The panel holding the steps (React Aria `DisclosurePanel`).                        |
| `ui-chat-plan`                 | root      |                                                                                | A plan's `<div>`.                                                                  |
| `ui-chat-plan__header`         | slot      |                                                                                | The title and the progress.                                                        |
| `ui-chat-plan__title`          | slot      |                                                                                | The title.                                                                         |
| `ui-chat-plan__progress`       | slot      |                                                                                | How many steps are done.                                                           |
| `ui-chat-plan__list`           | slot      |                                                                                | The `<ol>` of steps.                                                               |
| `ui-chat-plan__step`           | slot      |                                                                                | A step's `<li>`.                                                                   |
| `ui-chat-plan__glyph`          | slot      |                                                                                | A step's status glyph (also `ui-glyph`).                                           |
| `ui-chat-plan__spinner`        | slot      |                                                                                | The decorative busy indicator of the step in progress.                             |
| `ui-chat-plan__label`          | slot      |                                                                                | A step's label.                                                                    |
| `ui-chat-status-line`          | root      |                                                                                | The status line's `<div>`.                                                         |
| `ui-chat-status-line__spinner` | slot      |                                                                                | The decorative busy indicator.                                                     |
| `ui-chat-status-line__icon`    | slot      |                                                                                | The caller's decorative icon, in place of the busy indicator.                      |
| `ui-chat-status-line__text`    | slot      |                                                                                | What the assistant is thinking or doing.                                           |
| `data-status`                  | attribute | `streaming`, `complete`, `pending`, `in-progress`, `done`, `failed`, `skipped` | On reasoning: whether it streams. On a plan step: where it stands.                 |
| `data-format`                  | attribute | `markdown`, `plain`                                                            | On reasoning: how its text renders.                                                |
| `data-running`                 | state     | `true`                                                                         | On a group of steps: the run goes on.                                              |
| `data-activity`                | attribute | `thinking`, `writing`                                                          | On a status line: whether the assistant thinks or writes.                          |
| `data-expanded`                | state     | `true`                                                                         | On reasoning or a group of steps: the panel shows (React Aria).                    |
| `data-focus-visible-within`    | state     | `true`                                                                         | On reasoning, a group of steps or their panel: keyboard focus inside (React Aria). |
| `data-hovered`                 | state     | `true`                                                                         | On a trigger, while the pointer is over it (React Aria).                           |
| `data-pressed`                 | state     | `true`                                                                         | On a trigger, while pressed (React Aria).                                          |
| `data-focused`                 | state     | `true`                                                                         | On a trigger, while focused (React Aria).                                          |
| `data-focus-visible`           | state     | `true`                                                                         | On a trigger, while focused by keyboard (React Aria).                              |
