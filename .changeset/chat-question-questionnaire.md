---
'@flamboyantengineer/ui-components': minor
---

ChatQuestion's pending card renders through the Questionnaire parts: a stepping `Questionnaire` (`ui-chat-question__form`) whose items are the questions (fieldsets titled by a legend) and whose options are `QuestionnaireChoices` and `QuestionnaireChoice`, with the card's tabs, Back, previews, Other, request locking and retained drafts unchanged. `Questionnaire` takes `answers`, answers kept outside the form that it reads instead of its controls, and `isReadOnly` (`data-read-only`); its actions take `isDisabled`, `isPending`, `tooltip` and `focusableWhenDisabled`; and a step that stops at a question leaves focus where it is inside that question.
