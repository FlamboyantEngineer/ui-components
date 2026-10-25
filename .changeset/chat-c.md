---
'@flamboyantengineer/ui-components': minor
---

Add `ChatQuestion`, an inline card in which an agent asks the reader one or several questions in a conversation.

- Takes a message part's `ChatQuestionData` (`id`, `questions`, `status`, `answers`) with `onSubmit(answers)` and `onDismiss()`. Exports `ChatQuestionData`, `ChatQuestionItem`, `ChatQuestionOption`, `ChatQuestionAnswer`, `ChatQuestionSelectionMode` and `ChatQuestionStatus`.
- Each question is answered by one option (a React Aria radio group), any options (a checkbox group) or free text only (`selectionMode: 'none'`). Options carry a description, a "Recommended" badge and a Markdown preview shown beside the options for the focused or chosen option; `allowsOther` adds "Other" with a field for the reader's own words, focused when Other is chosen.
- Several questions are asked one at a time behind header chips and a progress hint, with Back and Next; stepping moves focus to the next answer, and Enter in a text field steps on or submits. Submit stays focusable but unavailable, with a hint, until every question has an answer.
- A pending card announces itself politely once; an `answered` card collapses to a summary of each question with what the reader chose ("You chose PostgreSQL"), and a `dismissed` card to "Dismissed". Focus stays in the card once the reader's Submit or Dismiss settles it.
- Hooks: `ui-chat-question` and its slots, `data-status`, `data-stepped`, `data-selection-mode`, `data-has-preview`, `data-selected`, `data-recommended`, `data-other`, `data-current`, `data-answered`.
- New provider strings (in a new chat question strings module): `questionSubmit`, `questionOther`, `questionOtherAnswer`, `questionAnswerPlaceholder`, `questionRecommended`, `questionSteps`, `questionStep`, `questionProgress`, `questionAnswerToContinue`, `questionAnswerAllToSubmit`, `questionPreview`, `questionAsked`, `questionChose`, `questionAnsweredText`, `questionNoAnswer`, `questionDismissed`.
