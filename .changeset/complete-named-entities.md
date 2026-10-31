---
'@flamboyantengineer/ui-components': patch
---

Markup and Markdown decode every HTML named character reference (`&eacute;`, `&alpha;`, `&NotNestedGreaterGreater;`) with its case, using the `entities` package, which is now a dependency. Unknown names stay as written, and `&constructor;` no longer turns into a function's source text. `HtmlMarkup` and `sanitizeHtml` decode as an HTML parser does, so legacy names without a semicolon (`&copy`) and attribute rules match browsers. Markdown and SVG keep requiring the semicolon.
