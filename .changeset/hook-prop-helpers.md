---
'@flamboyantengineer/ui-components': minor
---

`Chart` takes `isEmpty` and publishes `data-empty` through its hooks, so bar, line and donut charts no longer pass it as a caller attribute. Card forwards only its documented root attributes instead of deleting a hand-kept list of its own props, NavigationRail sets its width through `measuredProperty`, and Markdown, HtmlMarkup and SvgMarkup forward caller `data-*` attributes through their root hooks.
