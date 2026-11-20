---
'@flamboyantengineer/ui-components': minor
---

Adds shadcn/ui's chat part families as hook-only parts. `MessageGroup`, `MessageAvatar` and `MessageHeader` join `Message`; `BubbleGroup` and `BubbleReactions` join `Bubble`, whose variants are now shadcn's seven (`default`, `secondary`, `muted`, `tinted`, `outline`, `ghost`, `destructive`). `Trace` (`TraceLine`, `TraceIcon`, `TraceTitle`, `TraceDescription`, `TraceCollapsible`, `TraceCollapsibleTrigger`, `TraceCollapsibleContent`) records what an agent did, and `Marker` (`MarkerIcon`, `MarkerContent`; `default`, `separator` and `border` variants) marks a place in a conversation.

`Questionnaire` (`QuestionnaireProgress`, `QuestionnaireItem`, `QuestionnaireTitle`, `QuestionnaireDescription`, `QuestionnaireChoices`, `QuestionnaireChoice`, `QuestionnaireInput`, `QuestionnaireError`, `QuestionnaireActions`, `QuestionnairePrevious`, `QuestionnaireSkip`, `QuestionnaireNext`, `QuestionnaireSubmit`) asks a few questions in a form, all at once or one at a time, and submits the answers.

`Attachment` without `name` renders a frame composed from `AttachmentMedia`, `AttachmentContent`, `AttachmentTitle`, `AttachmentDescription`, `AttachmentActions` and `AttachmentAction`, grouped by `AttachmentGroup`; its prop-driven props are now `AttachmentFileProps`. `CodeBlock` without `code` renders a frame composed from `CodeBlockHeader`, `CodeBlockTitle`, `CodeBlockActions`, `CodeBlockCopyButton`, `CodeBlockContent`, `CodeBlockLine` (`added`, `removed` and `highlighted` lines) and `CodeBlockFooter`; its prop-driven props are now `CodeBlockDataProps`.
