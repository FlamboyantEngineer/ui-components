---
'@flamboyantengineer/ui-components': minor
---

A model and reasoning-effort picker for chat composers.

- `ChatModelPicker` (from the package root and `@flamboyantengineer/ui-components/chat-model-picker`) shows the current model, and its effort when the model takes one, on a compact button that opens a menu: the models with their descriptions, badges and the reasons unavailable ones cannot be chosen, then the efforts the chosen model takes. The model and the effort are each controlled or not (`model`, `defaultModel` and `onModelChange`; `effort`, `defaultEffort` and `onEffortChange`); choosing a model that does not take the current effort moves it to the model's default effort and reports it, and `persistKey` keeps the choice in the provider storage.
- `Chat` takes `modelPicker` and shows the picker among its composer's tools, beside the attach and emoji buttons, disabled with the composer.
- Styling hooks (`ui-chat-model-picker`, its `model`, `effort` and `menu` slots and `data-has-effort`), provider strings (`chatModel`, `chatEffort`, `chatModelTrigger`), a lab and a reference stylesheet.
