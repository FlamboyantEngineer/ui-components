---
'@flamboyantengineer/ui-components': patch
---

Interactive modules now start with `'use client'`, so a React Server Components framework can import any entry point from a server page, while entry points and server-safe utilities stay on the server. `npm run check:client-boundaries` keeps the directives in step, and `npm run check:server-components` builds, serves and hydrates the packed package in a Next.js consumer.
