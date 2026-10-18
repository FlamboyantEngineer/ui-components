---
'@flamboyantengineer/ui-components': minor
---

Add completions for text controls, a message composer and a chat transcript.

- `CompletionList` (new): the list of completions for an editor that keeps focus and owns the caret, a listbox in a non-modal popover against `anchorRef`, with `items`, `activeKey`, `onActiveKeyChange`, `onAction`, `renderItem`, `renderEmptyState` and `footer`; `getCompletionOptionId` names the active option for `aria-activedescendant`. Hooks: `ui-completion-list`, `__listbox`, `__option`, `__label`, `__description`, `__documentation`, `__empty`, `__footer`, `data-kind`, `data-focused`.
- `createTriggerCompletions` (new): a completion source for trigger characters such as `@` for people and `#` for references, with sources that answer later and queries that may hold spaces.
- Shared completion types: `Completion`, `CompletionSource`, `CompletionContext`, `CompletionResult` (now with `filter`) and `CompletionAnswer`.
- `TextField`: `completions` (a vocabulary or a source) and `renderCompletion` open a completion list under the field while the input keeps focus; Enter inserts instead of committing and Escape closes instead of reverting. The caller's `onKeyDown` now runs after the field's own keys. Hook: `__completions`.
- `MessageComposer` (new): a growing text area that sends on Enter or Ctrl+Enter (`submitShortcut`), with `attachments`, `toolbar`, `completions`, `isPending` with `onStop`, `isDisabled`, `maxLength` and `allowsEmptySubmit`. Hooks: `ui-message-composer`, `__attachments`, `__input`, `__footer`, `__toolbar`, `__action`, `__completions`, `data-pending`, `data-disabled`.
- `ChatTranscript` and `ChatMessage` (new): a conversation log that follows the latest message, stops when the reader scrolls up and offers "jump to latest"; messages with `origin` (`sent`, `received`, `system`), `author`, `time`, `status` (`complete`, `streaming`, `error`) and `actions`. Hooks: `ui-chat-transcript`, `__log`, `__empty`, `__jump`, `data-empty`, `ui-chat-message`, `__avatar`, `__body`, `__header`, `__author`, `__time`, `__content`, `__actions`, `data-origin`, `data-status`.
- Provider glyphs `send` and `stop`; strings `message`, `send`, `stop`, `conversation` and `jumpToLatest`.

Breaking:

- `CodeEditor` draws its completions with `CompletionList`: the hooks `ui-code-editor__completions`, `__completion`, `__completion-label`, `__completion-description` and `__completion-documentation` become `ui-completion-list__listbox`, `__option`, `__label`, `__description` and `__documentation`, and `data-kind` moves with the option. The popover keeps `ui-code-editor__popover` beside `ui-completion-list`.
- The types `CodeCompletion`, `CodeCompletionSource`, `CodeCompletionContext`, `CodeCompletionResult` and `CodeCompletionAnswer` are renamed `Completion`, `CompletionSource`, `CompletionContext`, `CompletionResult` and `CompletionAnswer`.
