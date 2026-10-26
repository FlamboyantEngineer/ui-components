---
'@flamboyantengineer/ui-components': minor
---

Show a pending `ChatQuestion`'s questions as tabs, with a counter ("2/3") at the end of their row. Every tab is clickable at any time, focus stays on the tab, the arrow keys move between tabs, and the tabs scroll with buttons when they do not fit. Back, Next, Submit and Dismiss work as before. A card with one question shows one tab and "1/1".

An answered question's tab is described as Answered, and the new `answeredMark` prop (`icon`, the default, or `style`) chooses whether it also draws a check or leaves `data-answered` to the stylesheet. `ChatParts` takes it as `questionAnsweredMark`, and `Chat` forwards it.

Hooks: `ui-chat-question__tabs`, `__tab` and `__panel` replace `__steps`, `__step` and `__header`. `data-current` goes away (the tab's `data-selected` takes its place), and the root gains `data-answered-mark`. The provider gains the `questionCounter` and `questionAnsweredTab` strings.
