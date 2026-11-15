---
'@flamboyantengineer/ui-components': patch
---

`PropertyPanel` keeps its content mounted when `searchable`, `query`, `defaultQuery` or `filter` comes or goes at runtime, so drafts, focus and open sections survive. The panel now always holds its content in a `ui-property-scope` div; its status region appears only while the panel filters on its own. In the reference stylesheet, rows directly in a panel body line up with the body's columns whether or not the panel searches.
