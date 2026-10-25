---
'@flamboyantengineer/ui-components': minor
---

Add `ChatParts`, which renders the typed parts of one chat message from plain data, and the shared conversation model.

- `ChatParts` (`parts`, `messageId`, `isStreaming`, `textFormat`): text as Markdown by default or as written with its line breaks (`textFormat`, or a part's own `format`), streaming while the part streams, with fenced code as `CodeBlock`, `[n]` markers as citations of the message's sources, and mention and command tokens as pills in both formats; reasoning as `ChatReasoning`; tool calls as `ChatToolCall` with `onApprove`, `onDeny` and `onAlwaysAllow` by call id; questions as `ChatQuestion` with `onAnswerQuestion` and `onDismissQuestion`; plans, sources, attachments (`onRetryAttachment`), code and terminal output (`onApplyCode`, also on fenced code in text), diffs under their title, and custom parts through `renderPart`.
- `toolRenderers` maps a tool's name to a `ChatToolRenderer` that draws its calls in place of the card's body, or of the whole card with `replaces: 'card'`, with the call's approval callbacks (`ChatToolCallHandlers`).
- Consecutive reasoning and tool calls fold into a `ChatSteps` group that runs while it ends a streaming message, collapses once the answer follows, sums its steps' durations, and stays open while a tool call in it waits for approval.
- The reader's open and closed choices are kept per part id and group (`expandedParts`, `onExpandedPartsChange`), so hosts can keep them across remounts. Tool call and question DOM ids are prefixed with `messageId`.
- Model types: `ChatPart` and its variants (`ChatTextPart`, `ChatReasoningPart`, `ChatToolCallPart`, `ChatQuestionPart`, `ChatPlanPart`, `ChatSourcesPart`, `ChatFilesPart`, `ChatCodePart`, `ChatDiffPart`, `ChatCustomPart`), `ChatPartType`, `ChatTextFormat`, `ChatTextToken`, `ChatParticipant`, `ChatParticipantKind` and `ChatMessageData`.
- Hooks: `ui-chat-parts`, `__text`, `__token`, `__diff`, `__diff-title`, `data-format`, `data-kind`.
- `ChatReasoning` now renders its Markdown in the streaming mode while it streams.
