# Chat Sources

`ChatSources` lists the sources an answer drew on, such as web pages or documents: a numbered list labelled by its count, each source's title (a [Link](LINK.md) when it has a URL), its site and a snippet, without favicons. `ChatCitation` is the inline numbered marker (`[1]`) that cites one of them in the answer's text: it links to the source and previews it in a [Hover Card](HOVER-CARD.md) on hover, keyboard focus and long press. `createCitationOverride` turns the `[n]` markers in a [Markdown](MARKDOWN.md) answer into citations ([UIC-MARKDOWN-2.8](MARKDOWN.md#uic-markdown-28---node-overrides)). Sources are numbered by their order: the first source is `[1]`.

## UIC-CHAT-SOURCES-1 - Sources list

### UIC-CHAT-SOURCES-1.1 - Labelled list

`ChatSources` shall render a `ui-chat-sources` root holding a label (`ui-chat-sources__label`) that reads the provider's `chatSourcesLabel` string for the number of sources (`3 sources`, `1 source`) and an ordered list (`ui-chat-sources__list`) named by it, with one `ui-chat-sources__item` per source in the order of `sources`, so each item's number is its citation number.

Implementation: `src/components/chat-sources/chat-sources.tsx`, `src/core/chat-sources-strings.ts`, `labs/reference/chat-sources.css`
Verification: `src/components/chat-sources/chat-sources.test.tsx`, `e2e/chat-sources.spec.ts`

### UIC-CHAT-SOURCES-1.2 - Source details

Each item shall show the source's `title` in `ui-chat-sources__title`: a [Link](LINK.md) to `url`, opening in a new tab when the URL is absolute `http` or `https`, or plain text without a URL. Then its site in `ui-chat-sources__site`, `siteName` or else the host of an absolute URL without `www.`, and its `snippet` in a `<p>` (`ui-chat-sources__snippet`). A part the source lacks is not rendered.

Implementation: `src/components/chat-sources/chat-source-summary.tsx`, `labs/reference/chat-sources.css`
Verification: `src/components/chat-sources/chat-sources.test.tsx`, `e2e/chat-sources.spec.ts`

### UIC-CHAT-SOURCES-1.3 - Hooks and caller attributes

`ChatSources` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its root.

Implementation: `src/components/chat-sources/chat-sources.tsx`
Verification: `src/components/chat-sources/chat-sources.test.tsx`

## UIC-CHAT-SOURCES-2 - Citations

### UIC-CHAT-SOURCES-2.1 - Marker

`ChatCitation` shall render its `index` as `[n]` in a `ui-chat-citation__marker` span hidden from assistive technology, inside a `ui-chat-citation` trigger named by the provider's `chatCitationLabel` string with the number and the source's title (`Source 1: Lisbon weather`). With a `url`, the trigger is a [Link](LINK.md) to it, underlined on hover only (`underline="hover"`) and opening in a new tab (with Link's safe `rel` and new-tab text) when the URL is absolute `http` or `https`.

Implementation: `src/components/chat-sources/chat-citation.tsx`, `src/core/chat-sources-strings.ts`, `labs/reference/chat-sources.css`
Verification: `src/components/chat-sources/chat-citation.test.tsx`, `e2e/chat-sources.spec.ts`

### UIC-CHAT-SOURCES-2.2 - Preview

The trigger shall open a [Hover Card](HOVER-CARD.md) (`ui-chat-citation__card`) after the pointer rests on it or keyboard focus reaches it, without moving focus, or on a long touch press, which moves focus into it ([UIC-HOVER-CARD-1.2](HOVER-CARD.md#uic-hover-card-12---opening)). The card is named by the source's title and shows it in `ui-chat-citation__title` (a link to the source when it has a URL), the site in `ui-chat-citation__site` and the snippet in `ui-chat-citation__snippet`, as a list item does ([UIC-CHAT-SOURCES-1.2](#uic-chat-sources-12---source-details)). Tab from the trigger moves into the card; Escape closes it.

Implementation: `src/components/chat-sources/chat-citation.tsx`, `src/components/chat-sources/chat-source-summary.tsx`, `labs/reference/chat-sources.css`
Verification: `src/components/chat-sources/chat-citation.test.tsx`, `e2e/chat-sources.spec.ts`

### UIC-CHAT-SOURCES-2.3 - Source without a URL

For a source without a `url`, the trigger shall be a bare [Button](BUTTON.md) instead of a link, and pressing it (by pointer, touch or keyboard) opens the card at once.

Implementation: `src/components/chat-sources/chat-citation.tsx`
Verification: `src/components/chat-sources/chat-citation.test.tsx`, `e2e/chat-sources.spec.ts`

### UIC-CHAT-SOURCES-2.4 - Hooks and caller attributes

`ChatCitation` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes and `id` to its trigger.

Implementation: `src/components/chat-sources/chat-citation.tsx`
Verification: `src/components/chat-sources/chat-citation.test.tsx`

## UIC-CHAT-SOURCES-3 - Markdown

### UIC-CHAT-SOURCES-3.1 - Citation override

`createCitationOverride(sources)` shall return a `renderNode` for [Markdown](MARKDOWN.md) that splits each text node at its markers, `[n]` or `[n, m, …]` for several, whose every number is between 1 and the number of sources, and draws each number as a `ChatCitation` of `sources[n - 1]`, the text between them through [Text Match](TEXT-MATCH.md). A marker with a number outside that range stays text, as do markers in code, and other nodes keep their default rendering.

Implementation: `src/components/chat-sources/markdown-citations.tsx`
Verification: `src/components/chat-sources/markdown-citations.test.tsx`, `e2e/chat-sources.spec.ts`

## Hooks

| Hook                        | Kind | Values | Description                                                     |
| --------------------------- | ---- | ------ | --------------------------------------------------------------- |
| `ui-chat-sources`           | root |        | The list's root.                                                |
| `ui-chat-sources__label`    | slot |        | The label naming the list by its count.                         |
| `ui-chat-sources__list`     | slot |        | The `<ol>` of sources.                                          |
| `ui-chat-sources__item`     | slot |        | One source's `<li>`.                                            |
| `ui-chat-sources__title`    | slot |        | A source's title: a link (also `ui-link`) or text.              |
| `ui-chat-sources__site`     | slot |        | A source's site.                                                |
| `ui-chat-sources__snippet`  | slot |        | A source's snippet.                                             |
| `ui-chat-citation`          | root |        | The marker's trigger: a link (also `ui-link`) or a bare button. |
| `ui-chat-citation__marker`  | slot |        | The visible `[n]`, hidden from assistive technology.            |
| `ui-chat-citation__card`    | slot |        | The preview card (also `ui-hover-card`), portalled.             |
| `ui-chat-citation__title`   | slot |        | The card's title: a link (also `ui-link`) or text.              |
| `ui-chat-citation__site`    | slot |        | The card's site.                                                |
| `ui-chat-citation__snippet` | slot |        | The card's snippet.                                             |
