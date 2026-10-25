---
'@flamboyantengineer/ui-components': minor
---

Add the chat activity parts: `ChatReasoning`, `ChatSteps`, `ChatPlan` and `ChatStatusLine`.

- `ChatReasoning`: an assistant's reasoning as a disclosure without a heading (`text`, `status` `streaming` or `complete`, `durationMs`). While it streams it is open, labelled "Thinking…", with a busy indicator and a busy panel; once complete it collapses, labelled "Thought for 4 s" (or "Thought for a moment"). The text renders as Markdown by default, or as written with `format="plain"`. Expansion follows the status until the reader chooses (`isExpanded`, `defaultExpanded`, `onExpandedChange`), and never collapses under the reader's focus. Hooks: `ui-chat-reasoning` and its slots, `data-status`, `data-format`, `data-expanded`.
- `ChatSteps`: the consecutive reasoning and tool calls of one reply in one group (`isRunning`, `durationMs`, `stepCount`, children). Open while running, labelled "Working… · 3 steps"; collapsed once the run ends, labelled "Worked for 12 s · 3 steps". The reader's choice wins over the run, with the same expansion props. Hooks: `ui-chat-steps` and its slots, `data-running`, `data-expanded`.
- `ChatPlan`: an assistant's plan (`title`, `steps` with `id`, `label` and `status` `pending`, `in-progress`, `done`, `failed` or `skipped`): an ordered list with status glyphs, status words for assistive technology, the step in progress as the current step, progress ("2 of 5 done"), and polite announcements of status changes, at most one every two seconds. Hooks: `ui-chat-plan` and its slots, `data-status`.
- `ChatStatusLine`: one line saying what the assistant is doing (`text`) while `isRunning`, with a busy indicator, announced politely at most once every two seconds; gone once the work ends. Hooks: `ui-chat-status-line` and its slots.
- Data types for hosts that render message parts from data: `ChatReasoningData`, `ChatPlanData`, `ChatPlanStep`, `ChatPlanStepStatus`, `ChatReasoningStatus`, `ChatReasoningFormat`.
- Glyphs: `pending` and `skipped`.
- Provider strings (in a new chat activity strings module): `chatReasoningStreaming`, `chatReasoningComplete`, `chatStepsRunning`, `chatStepsComplete`, `chatPlan`, `chatPlanProgress`, `chatPlanStepStatus`, `chatPlanChanged`.
