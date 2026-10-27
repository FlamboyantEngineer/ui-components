---
'@flamboyantengineer/ui-components': minor
---

All built-in text now comes from language files of ICU MessageFormat messages, with plurals, numbers and lists formatted by the provider's locale. The package ships English, French, Spanish and Japanese from `@flamboyantengineer/ui-components/locales` (and as JSON from `@flamboyantengineer/ui-components/locales/<language>.json`), and changing `UiProvider`'s `messages` and `locale` switches every component below on the fly. `formatMessage`, `useFormatMessage` and `toMessageList` format a host's own messages the same way.

`UiProvider`'s `strings` prop is replaced by `messages`, which takes message templates (`'{count, plural, one {# item} other {# items}}'`) instead of functions, and `defaultStrings` is no longer exported. `formatShortcutAccessibleText`'s `sequence` option is replaced by `joinSteps`, and the `shortcutSequence` message by `shortcutThen`. English lists now follow the locale's list rules, with a serial comma (`A, B, and C`).

Messages that took structured lists now take parts to join: `chatStepsComplete` takes the action phrases built with the new `chatStepsAction`, `chatPlanChanged` takes the change phrases built with the new `chatPlanChange`, and `copyToolCallPart` takes `arguments` or `result` instead of a label.
