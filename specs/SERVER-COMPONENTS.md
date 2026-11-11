# Server components

A host that renders on the server with React Server Components imports the library from a server module, such as a page of a framework's app router. React's server build leaves out state, effects, refs and context, and a server module cannot hand a function to the browser, so the library marks the modules that need the browser runtime with the `'use client'` directive. The host then renders any component from a server page, passing serializable props, and calls the server-safe utilities on the server. A component that needs function props, such as an `onChange` handler or a render function, is rendered from the host's own client module.

## UIC-SERVER-COMPONENTS-1 - Client boundaries

### UIC-SERVER-COMPONENTS-1.1 - Client modules start with the directive

A library source module shall start with `'use client'` when it needs the client: it imports a React API that React's server build leaves out (state, effects, refs, context), calls a hook other than the server-safe `useId`, `useMemo`, `useCallback` and `useDebugValue`, imports React DOM or a client package (React Aria and its companions, the rich text binding), passes a function in JSX (an event handler, a render function, a render-function child), renders a component from a client module, or calls or reads any other export of a client module. On the server a client module's export is a client reference: it renders as a JSX tag and travels as a component, such as a glyph stored in a list or passed as a prop, but holds no value to call, so a module that builds components from a client factory, such as `glyphs.tsx`, is itself a client module. No module shall re-export a client module with `export *`, which a framework cannot resolve across the boundary; `src/primitives/index.ts` re-exports its areas by name. `npm run check:client-boundaries` enforces the rule, and `--fix` adds the directives.

Implementation: `scripts/check-client-boundaries.mjs`, `src/components/button/button.tsx`, `src/core/provider.tsx`, `src/core/glyphs.tsx`, `src/primitives/index.ts`
Verification: `test/client-boundaries.test.ts`

### UIC-SERVER-COMPONENTS-1.2 - Server-safe modules stay on the server

Every other module, including the entry points (`index.ts`), shall carry no directive, so the package is not client-only as a whole: entry points re-export client components as client references, and utilities such as `sanitizeHtml`, `parseMarkdown`, `formatMetaLine`, `splitTextDiff` and the board, table and chart helpers stay callable on the server. The pure value helpers those utilities call are server-safe modules too: the date functions and ISO adapters (`src/primitives/date-values.ts`), colour parsing (`src/primitives/color-values.ts`), `createValueStore` (apart from its `useStoreValue` hook), the PDF viewer's page bitmaps and rotation and the table's column names. Components that render only elements and other server-safe components, such as `MetaLine`, render on the server.

Implementation: `scripts/check-client-boundaries.mjs`, `src/index.ts`, `src/components/html-markup/sanitize-html.ts`, `src/components/meta-line/meta-line.tsx`, `src/primitives/date-values.ts`, `src/primitives/color-values.ts`, `src/utils/value-store.ts`, `src/components/pdf-viewer/page-bitmap.ts`
Verification: `test/client-boundaries.test.ts`

### UIC-SERVER-COMPONENTS-1.3 - The build keeps the directives

The build shall emit each module's directive as the first statement of its JavaScript output, so a bundler of the installed package sees the boundary.

Implementation: `tsconfig.build.json`
Verification: `test/client-boundaries.test.ts`

### UIC-SERVER-COMPONENTS-1.4 - Helpers are exported from server modules

An entry point shall export a value through a client module only when the value is client code: a component, a hook, or a helper that needs the browser because it opens an overlay, keeps client state or reads the DOM (`confirm`, `alert`, `prompt`, `createToastQueue`, `createModalController`, `createMenuController`, `armHandleDrag`, `keepHandleCellDraggable`, `mountLabBar`, `getFieldUndo`, `resolveScrollSpy`, `createCitationOverride`, `createCodeBlockOverride`). Every other exported helper or constant, such as `serializeRichTextHtml`, `reduceChatStream`, `findBoxAtPoint`, `resolveAvatarColor` or `findNextZoomLevel`, shall be defined in a server-safe module and exported from that module, so a server component calls it rather than receiving a client reference. A server-safe module shall import such a helper from the module that defines it, never through a client module that re-exports it, where the server would hand it the same client reference; `createConditionMatcher` and `matchesConditionGroup`, which match with the filter bar's helpers, are callable on the server with active rules. `npm run check:client-boundaries` enforces both rules, and `npm run check:server-components` calls both matchers from a server page.

Implementation: `scripts/check-client-boundaries.mjs`, `scripts/check-server-components.mjs`, `src/components/rich-text-editor/index.ts`, `src/components/chat-controller/index.ts`, `src/components/pdf-viewer/index.ts`
Verification: `test/client-boundaries.test.ts`

## UIC-SERVER-COMPONENTS-2 - An installed-package consumer

### UIC-SERVER-COMPONENTS-2.1 - A framework builds, serves and hydrates the package

`npm run check:server-components` shall pack the library and install it in a Next.js app router application with React and React DOM only, so no optional peer is installed. It shall build four server pages for production: one importing the root entry point, one importing component and core subpaths, each rendering client components and calling server-safe utilities, the second also passing a glyph imported from `/core` to a client component, one rendering date fields on a 12-hour clock in time, date-time and date-time range modes beside a 24-hour control, whose formatted spaces differ between Node and browsers, and one calling server-safe helpers of interactive components (chat controller, PDF viewer, avatar, checkbox, slider, zoom control) through their entry points. It shall then add the rich text editor's optional peers and build a server page that calls `serializeRichTextHtml` and `serializeRichTextText`. It shall then serve them, check their server markup, open each interactive page in a browser, check that an interactive component responds after hydration with no error reported, and check that the client code holds none of the components the pages do not render. CI runs it on every pull request; it needs the npm registry.

Implementation: `scripts/check-server-components.mjs`, `.github/workflows/ci.yml`
Verification: `test/client-boundaries.test.ts`
