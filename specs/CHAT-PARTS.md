# Chat Parts

`ChatParts` renders the content of one message of a [Chat Transcript](CHAT-TRANSCRIPT.md), inside a `ChatMessage`: an ordered list of typed parts (`ChatPart`), each drawn by the component for its type. Text renders as [Markdown](MARKDOWN.md) or plain text, reasoning as [Chat Activity](CHAT-ACTIVITY.md)'s `ChatReasoning`, tool calls as [Chat Tool Call](CHAT-TOOL-CALL.md) cards, questions as [Chat Question](CHAT-QUESTION.md) cards, and plans, sources, attachments, code and diffs through their own components. Consecutive reasoning and tool calls of one reply fold into a `ChatSteps` group summed up in one line ("Edited files, ran a command"); text written between tool calls splits them into separate groups. `ChatParts` holds no conversation state: the host owns the parts and records the reader's answers, approvals and retries through the callbacks.

The directory also holds the conversation model the chat components share: `ChatPart` and its variants (`chat-part.ts`), `ChatParticipant` and `ChatMessageData` (`chat-conversation.ts`). Each part variant carries the data contract of the component that draws it, plus its `type` and, where the part is not otherwise identified, an optional `id`.

## UIC-CHAT-PARTS-1 - Parts

### UIC-CHAT-PARTS-1.1 - Parts in order

`ChatParts` shall render a `ui-chat-parts` root holding its `parts` in order, each drawn by the component for its `type` ([UIC-CHAT-PARTS-2](#uic-chat-parts-2---text) to [UIC-CHAT-PARTS-4](#uic-chat-parts-4---other-parts)). Each part is keyed by its type and `id`, or its type and position when it has no `id`, so a part keeps its element and state while the message streams and parts are added after it.

Implementation: `src/components/chat-parts/chat-parts.tsx`, `src/components/chat-parts/chat-parts-grouping.ts`, `src/components/chat-parts/chat-part-view.tsx`
Verification: `src/components/chat-parts/chat-parts.test.tsx`, `src/components/chat-parts/chat-parts-grouping.test.ts`

### UIC-CHAT-PARTS-1.2 - DOM ids

A tool call's and a question's `id` become their root element's DOM id. With a `messageId`, `ChatParts` shall prefix these DOM ids with it (`<messageId>-<part id>`), the message id percent-encoded with its hyphens too (`m-1` writes `m%2D1`), so the first hyphen ends it and no two messages' parts share a DOM id, whatever their ids hold (`m-1` with `p` and `m` with `1-p` stay apart); the callbacks still receive the part's own `id`. Without a `messageId` the DOM id is the part's `id`.

Implementation: `src/components/chat-parts/chat-parts.tsx`, `src/components/chat-parts/chat-part-view.tsx`
Verification: `src/components/chat-parts/chat-part-view.test.tsx`

### UIC-CHAT-PARTS-1.3 - Hooks and caller attributes

`ChatParts` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root. The components it draws keep their own hooks.

Implementation: `src/components/chat-parts/chat-parts.tsx`, `src/components/chat-parts/chat-parts-hooks.ts`
Verification: `src/components/chat-parts/chat-parts.test.tsx`

## UIC-CHAT-PARTS-2 - Text

### UIC-CHAT-PARTS-2.1 - Markdown

A text part shall render through [Markdown](MARKDOWN.md) as `ui-chat-parts__text` with `data-format="markdown"`, unless its `format` is `plain` or, without a `format`, the `textFormat` prop is `plain` (`textFormat` defaults to `markdown`). While the part's `status` is `streaming`, the Markdown renders in its streaming mode ([UIC-MARKDOWN-2.11](MARKDOWN.md#uic-markdown-211---streaming-incomplete-syntax)), so incomplete syntax at the end renders as it will once complete.

Implementation: `src/components/chat-parts/chat-text-part.tsx`
Verification: `src/components/chat-parts/chat-text-part.test.tsx`, `e2e/chat-parts.spec.ts`

### UIC-CHAT-PARTS-2.2 - Code blocks and citations

The Markdown of every text part shall draw fenced and indented code as `CodeBlock` ([UIC-CODE-BLOCK-4.1](CODE-BLOCK.md#uic-code-block-41---code-block-override)) and `[n]` markers as `ChatCitation`s of the sources of the message's `sources` parts, taken in order across those parts ([UIC-CHAT-SOURCES-3.1](CHAT-SOURCES.md#uic-chat-sources-31---citation-override)); a marker inside a link or a task label stays text, so no link or button nests in another. With `onApplyCode`, each fenced block shows Apply, which calls `onApplyCode` with the block's value and a code part made from the fence (`{ type: 'code', code, language }`). These overrides stay the same objects while the sources' content (each source compared field by field, with no serialisation) and the presence of `onApplyCode` stay the same, so a streaming message keeps its finished blocks ([UIC-MARKDOWN-2.12](MARKDOWN.md#uic-markdown-212---finished-blocks)), and Apply calls the latest `onApplyCode`.

Implementation: `src/components/chat-parts/chat-text-part.tsx`
Verification: `src/components/chat-parts/chat-text-part.test.tsx`, `src/components/chat-sources/markdown-citation-places.test.tsx`, `e2e/chat-parts.spec.ts`

### UIC-CHAT-PARTS-2.3 - Plain text

A plain text part shall render its `text` as written in a `<div>` (`ui-chat-parts__text`, `data-format="plain"`), with a `<br>` at each line break, through [Text Match](TEXT-MATCH.md).

Implementation: `src/components/chat-parts/chat-text-part.tsx`
Verification: `src/components/chat-parts/chat-text-part.test.tsx`, `e2e/chat-parts.spec.ts`

### UIC-CHAT-PARTS-2.4 - Mention and command tokens

Each of a text part's `tokens` shall show its `label` as a pill (`ui-chat-parts__token`, `data-kind` `mention`, `command` or `trigger`, the last for an entry of a host's own trigger vocabulary) in place of the range of `text` it covers, in both formats. In Markdown the pill takes the place of the token's text wherever Markdown reads it as text, inside emphasis, links and lists as elsewhere, and text beside it keeps its citations; where Markdown shows the source as written (code, a link's target, an image), the token's text stays as written. Tokens outside the text or overlapping an earlier token are ignored. Only the listed tokens become pills: any other text, including characters that look like the markers that carry tokens through Markdown (written as is or as entities), stays text, in text, code and links alike, and never adds or hides a token. Each token's marker stays a few characters long however many such characters or tokens the text holds, so the Markdown source grows in proportion to the text. Tokens are compared field by field, so a host that rebuilds the array on each render keeps the Markdown overrides.

Implementation: `src/components/chat-parts/chat-text-part.tsx`, `src/components/chat-parts/chat-text-tokens.ts`
Verification: `src/components/chat-parts/chat-text-part.test.tsx`, `src/components/chat-parts/chat-text-tokens.test.ts`, `src/components/chat-parts/chat-text-token-literals.test.tsx`, `e2e/chat-parts.spec.ts`

### UIC-CHAT-PARTS-2.5 - Record references

A token of kind `reference` (an opaque record `id`, its `label` and an optional host `recordType`) shall show in its pill (`data-kind` `reference`), in both formats and wherever UIC-CHAT-PARTS-2.4 places pills, a [Record Label](RECORD-LABEL.md) chip whose identifier is the label, with what `getReference({ id, label, recordType })` returns for it (its name, icon, link, kind, version, state, preview, or that it is missing or restricted); without `getReference`, or when it returns nothing, the chip shows only the label. The parts never fetch the record, and a link reaches it through the provider's link renderer. Inside a Markdown link or a task item's label the chip drops its link and preview (the host's `href`, `isExternal` and `preview`), so no link nests in another control and server markup hydrates cleanly. The label and the host's values render as text, never as markup.

Implementation: `src/components/chat-parts/chat-text-part.tsx`, `src/components/chat-parts/chat-parts.tsx`
Verification: `src/components/chat-parts/chat-text-part.test.tsx`, `src/components/chat-parts/chat-reference-places.test.tsx`, `e2e/chat-parts.spec.ts`

## UIC-CHAT-PARTS-3 - Agent parts

### UIC-CHAT-PARTS-3.1 - Reasoning

A reasoning part shall render as `ChatReasoning` with its `text`, `title`, `status` and `durationMs`, opening on its own while it streams unless `expandsActivity` is false, its Markdown streaming while the reasoning does ([UIC-CHAT-ACTIVITY-1.4](CHAT-ACTIVITY.md#uic-chat-activity-14---format)).

Implementation: `src/components/chat-parts/chat-part-view.tsx`
Verification: `src/components/chat-parts/chat-part-view.test.tsx`

### UIC-CHAT-PARTS-3.2 - Tool calls

A tool-call part shall render as a `ChatToolCall` with its data and the `row` variant ([UIC-CHAT-TOOL-CALL-1.8](CHAT-TOOL-CALL.md#uic-chat-tool-call-18---variant)), always in a group of steps ([UIC-CHAT-PARTS-5.1](#uic-chat-parts-51---grouping)), so every call of a reply takes the same styles and keeps its state as the reply streams. Approve, Deny and Always allow show while its approval waits only when `onApprove`, `onDeny` and `onAlwaysAllow` are given, and call them with the call's `id` (and the reader's reason, for `onDeny`).

Implementation: `src/components/chat-parts/chat-part-view.tsx`
Verification: `src/components/chat-parts/chat-part-view.test.tsx`

### UIC-CHAT-PARTS-3.3 - Tool renderers

`toolRenderers` shall map a tool's `name` to a `ChatToolRenderer` whose `render(call, handlers)` draws that tool's calls: in place of the card's body by default (the card keeps its title, status, error and approval), or in place of the whole card with `replaces: 'card'`. `handlers` holds the call's `onApprove`, `onDeny(reason?)` and `onAlwaysAllow`, bound to the call, each present only when `ChatParts` has the callback. Tool names, part ids and message ids are looked up as own keys, so a tool named after an `Object` member, such as `constructor`, `__proto__` or `toString`, uses only a renderer registered under that name and otherwise draws the standard card.

Implementation: `src/components/chat-parts/chat-part-view.tsx`, `src/components/chat-parts/chat-parts.tsx`
Verification: `src/components/chat-parts/chat-part-view.test.tsx`, `src/components/chat-parts/chat-part-own-keys.test.tsx`, `e2e/chat-parts.spec.ts`

### UIC-CHAT-PARTS-3.4 - Questions

A question part shall render as a `ChatQuestion` card with its data. Submitting calls `onAnswerQuestion` with the part's `id` and the answers, and the card awaits a promise it returns ([UIC-CHAT-QUESTION-2.7](CHAT-QUESTION.md)); without `onAnswerQuestion` the card is read-only ([UIC-CHAT-QUESTION-2.9](CHAT-QUESTION.md)). Dismiss shows only with `onDismissQuestion`, which receives the part's `id` and is awaited likewise. `questionAnsweredMark` becomes each card's `answeredMark` ([UIC-CHAT-QUESTION-3.4](CHAT-QUESTION.md)).

Implementation: `src/components/chat-parts/chat-part-view.tsx`
Verification: `src/components/chat-parts/chat-part-view.test.tsx`

## UIC-CHAT-PARTS-4 - Other parts

### UIC-CHAT-PARTS-4.1 - Plan

A plan part shall render as `ChatPlan` with its `title` and `steps`.

Implementation: `src/components/chat-parts/chat-part-view.tsx`
Verification: `src/components/chat-parts/chat-part-view.test.tsx`

### UIC-CHAT-PARTS-4.2 - Sources

A sources part shall render as `ChatSources` with its `sources`.

Implementation: `src/components/chat-parts/chat-part-view.tsx`
Verification: `src/components/chat-parts/chat-part-view.test.tsx`

### UIC-CHAT-PARTS-4.3 - Files

A files part shall render as `ChatAttachmentList` with its `attachments`; with `onRetryAttachment`, a failed upload shows Retry, which calls it with the attachment's `id`.

Implementation: `src/components/chat-parts/chat-part-view.tsx`
Verification: `src/components/chat-parts/chat-part-view.test.tsx`

### UIC-CHAT-PARTS-4.4 - Code and terminal

A code part shall render as `CodeBlock` with its `code`, `language`, `title` and `variant` (`terminal` for terminal output). With `onApplyCode`, the block shows Apply, which calls `onApplyCode` with the block's value and the part.

Implementation: `src/components/chat-parts/chat-part-view.tsx`
Verification: `src/components/chat-parts/chat-part-view.test.tsx`

### UIC-CHAT-PARTS-4.5 - Diff

A diff part shall render a `ui-chat-parts__diff` element holding its `title`, when it has one, in `ui-chat-parts__diff-title`, then a `TextDiff` of its `oldText` and `newText` named by that title.

Implementation: `src/components/chat-parts/chat-part-view.tsx`
Verification: `src/components/chat-parts/chat-part-view.test.tsx`

### UIC-CHAT-PARTS-4.6 - Custom parts

A custom part shall render what `renderPart(part)` returns, and nothing without `renderPart`.

Implementation: `src/components/chat-parts/chat-part-view.tsx`
Verification: `src/components/chat-parts/chat-part-view.test.tsx`

## UIC-CHAT-PARTS-5 - Steps

### UIC-CHAT-PARTS-5.1 - Grouping

A run of consecutive reasoning and tool-call parts shall fold into one `ChatSteps` group, holding them in order, when it holds a tool call, even a single tool call that ends the message. A call therefore keeps its place in the tree as further parts stream after it: its denial reason, focus, custom body state and the reader's open and closed choices survive the update. A run without a tool call stays as reasoning parts on their own. Any other part, such as text the assistant writes between tool calls, ends the run, so it shows between two groups as a part of the message.

Implementation: `src/components/chat-parts/chat-parts-grouping.ts`, `src/components/chat-parts/chat-parts.tsx`
Verification: `src/components/chat-parts/chat-parts-grouping.test.ts`, `src/components/chat-parts/chat-parts.test.tsx`

### UIC-CHAT-PARTS-5.2 - Running and summary

A group shall run (`ChatSteps`' `isRunning`: open, "Working…") while `isStreaming` is true and either it ends the message or one of its steps is still at work (reasoning streaming, a tool call `pending` or `running`); otherwise it has ended and collapses, unless the reader chose otherwise or a call in it waits for approval ([UIC-CHAT-PARTS-5.3](#uic-chat-parts-53---approvals-in-a-group)); a failed call does not hold it open ([UIC-CHAT-PARTS-5.4](#uic-chat-parts-54---failures-in-a-group)). So a group of successful steps collapses once the answer after it starts streaming. With `expandsActivity` false a running group stays closed until the reader opens it. While its latest step is reasoning that streams, the group is labelled by that reasoning's `title`, when it has one. Once it has ended it is summed up by its `actions`: how many of its tool calls are of each `kind` (`other` when the call has none), kinds in the order they first appear; its reasoning does not show in the summary.

Implementation: `src/components/chat-parts/chat-parts.tsx`, `src/components/chat-parts/chat-parts-grouping.ts`
Verification: `src/components/chat-parts/chat-parts-grouping.test.ts`, `src/components/chat-parts/chat-parts.test.tsx`, `e2e/chat-parts.spec.ts`

### UIC-CHAT-PARTS-5.3 - Approvals in a group

A group holding a tool call whose approval waits (`approval-requested` without a decision) shall be open without the reader's choice, even once the message no longer streams. When a call in a group the reader closed starts waiting for approval, or already waits as `ChatParts` mounts, the group opens as if the reader had opened it (`onExpandedPartsChange` receives the group as open), so the request never hides in a collapsed group and the group does not collapse under the reader's focus once they decide; closing it again is the reader's choice and holds.

Implementation: `src/components/chat-parts/chat-parts.tsx`, `src/components/chat-parts/use-parts-expansion.ts`
Verification: `src/components/chat-parts/chat-parts.test.tsx`

### UIC-CHAT-PARTS-5.4 - Failures in a group

A failed tool call (`failed`) in a group shall show as a row like its other steps, its card closed ([UIC-CHAT-TOOL-CALL-3.1](CHAT-TOOL-CALL.md#uic-chat-tool-call-31---expanded-state)) so its error waits in the body ([UIC-CHAT-TOOL-CALL-2.5](CHAT-TOOL-CALL.md#uic-chat-tool-call-25---error)). A failure calls nothing open: the group runs and collapses as [UIC-CHAT-PARTS-5.2](#uic-chat-parts-52---running-and-summary) says, whether the call fails while the group runs, in the update that ends the run, or was already failed when `ChatParts` mounts, as in loaded history; a group or card the reader closed stays closed, and `onExpandedPartsChange` is not called for it. The reader opens the group and the card to read the error, and those choices hold over later renders and remounts as [UIC-CHAT-PARTS-6.1](#uic-chat-parts-61---readers-choices) says.

Implementation: `src/components/chat-parts/chat-parts.tsx`, `src/components/chat-tool-call/chat-tool-call.tsx`
Verification: `src/components/chat-parts/chat-parts.test.tsx`, `src/components/chat/chat.test.tsx`, `e2e/chat-parts.spec.ts`

## UIC-CHAT-PARTS-6 - Expansion

### UIC-CHAT-PARTS-6.1 - Reader's choices

The reader's choices to open or close reasoning, tool-call cards and groups of steps shall be kept by key: a part's `id`, and `steps:<first step's id>` for a group. Without `expandedParts`, `ChatParts` keeps them itself, so they survive a part moving into a group and the message completing. With `expandedParts`, it follows that record, so the choices also survive remounts such as virtualization; a key absent from the record leaves the part to its progress. `onExpandedPartsChange` receives the whole record each time the reader opens or closes one.

Implementation: `src/components/chat-parts/use-parts-expansion.ts`, `src/components/chat-parts/chat-part-view.tsx`, `src/components/chat-parts/chat-parts.tsx`
Verification: `src/components/chat-parts/chat-parts.test.tsx`

## Hooks

| Hook                        | Kind      | Values                                       | Description                                                                  |
| --------------------------- | --------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| `ui-chat-parts`             | root      |                                              | The parts' `<div>`.                                                          |
| `ui-chat-parts__text`       | slot      |                                              | A text part: the Markdown root (also `ui-markdown`) or a plain-text `<div>`. |
| `ui-chat-parts__token`      | slot      |                                              | A token's pill: a mention's or command's label, or a reference's chip.       |
| `ui-chat-parts__diff`       | slot      |                                              | A diff part: its title and its `TextDiff`.                                   |
| `ui-chat-parts__diff-title` | slot      |                                              | A diff part's title.                                                         |
| `data-format`               | attribute | `markdown`, `plain`                          | On a text part: how it renders.                                              |
| `data-kind`                 | attribute | `mention`, `command`, `reference`, `trigger` | On a token: what it stands for.                                              |
