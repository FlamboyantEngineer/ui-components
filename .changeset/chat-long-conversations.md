---
'@flamboyantengineer/ui-components': minor
---

`Chat` virtualizes its transcript by default, so a long conversation full of tool calls and images opens, scrolls and shows a message's time on hover as quickly as a short one; `virtualized={false}` keeps every message in the page. A `ChatTranscript` that turns `virtualized` while it shows its messages keeps the reader's place. Scrolling a `ScrollRegion` no longer restyles its whole content with the reference stylesheet, which registers the edge distances as properties that do not inherit; a region inside a collapsed panel, such as a tool call's arguments, is measured only once it shows; a `CodeBlock` takes its first overflow measurement from its resize observer, so many blocks mount in one layout; and a `ChatMessage` creates its time tooltip at the first hover or focus.
