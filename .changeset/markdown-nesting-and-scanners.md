---
'@flamboyantengineer/ui-components': patch
---

Markdown parsing stays fast on hostile input. The parser opens block quotes and lists at most 256 deep, the depth the renderers already draw, and keeps deeper markers as paragraph text; container lines measure their indentation once for every open list item. Heading closing sequences and code spans no longer rescan a long line. Streaming Markdown reads carriage returns as line ends and parses the whole source again only when a line may start a link reference definition, so text such as `x[0]:` no longer turns off settled blocks.
