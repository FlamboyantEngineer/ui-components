# Server components

A host that renders on the server with React Server Components imports the library from a server module, such as a page of a framework's app router. React's server build leaves out state, effects, refs and context, and a server module cannot hand a function to the browser, so the library marks the modules that need the browser runtime with the `'use client'` directive. The host then renders any component from a server page, passing serializable props, and calls the server-safe utilities on the server. A component that needs function props, such as an `onChange` handler or a render function, is rendered from the host's own client module.

## UIC-SERVER-COMPONENTS-1 - Client boundaries

### UIC-SERVER-COMPONENTS-1.1 - Client modules start with the directive

A library source module shall start with `'use client'` when it needs the client: it imports a React API that React's server build leaves out (state, effects, refs, context), calls a hook other than the server-safe `useId`, `useMemo`, `useCallback` and `useDebugValue`, imports React DOM or a client package (React Aria and its companions, the rich text binding), passes a function in JSX (an event handler, a render function, a render-function child), or renders a component from a client module. A client module shall not re-export with `export *`, which a framework cannot resolve across the boundary. `npm run check:client-boundaries` enforces the rule, and `--fix` adds the directives.

Implementation: `scripts/check-client-boundaries.mjs`, `src/components/button/button.tsx`, `src/core/provider.tsx`
Verification: `test/client-boundaries.test.ts`

### UIC-SERVER-COMPONENTS-1.2 - Server-safe modules stay on the server

Every other module, including the entry points (`index.ts`), shall carry no directive, so the package is not client-only as a whole: entry points re-export client components as client references, and utilities such as `sanitizeHtml`, `parseMarkdown`, `formatMetaLine`, `splitTextDiff` and the board, table and chart helpers stay callable on the server. Components that render only elements and other server-safe components, such as `MetaLine`, render on the server.

Implementation: `scripts/check-client-boundaries.mjs`, `src/index.ts`, `src/components/html-markup/sanitize-html.ts`, `src/components/meta-line/meta-line.tsx`
Verification: `test/client-boundaries.test.ts`

### UIC-SERVER-COMPONENTS-1.3 - The build keeps the directives

The build shall emit each module's directive as the first statement of its JavaScript output, so a bundler of the installed package sees the boundary.

Implementation: `tsconfig.build.json`
Verification: `test/client-boundaries.test.ts`

## UIC-SERVER-COMPONENTS-2 - An installed-package consumer

### UIC-SERVER-COMPONENTS-2.1 - A framework builds, serves and hydrates the package

`npm run check:server-components` shall pack the library and install it in a Next.js app router application with React and React DOM only, so no optional peer is installed. It shall build two server pages for production, one importing the root entry point and one importing component and core subpaths, each rendering client components and calling server-safe utilities. It shall then serve them, check their server markup, open each page in a browser, check that an interactive component responds after hydration with no error reported, and check that the client code holds none of the components the pages do not render. CI runs it on every pull request; it needs the npm registry.

Implementation: `scripts/check-server-components.mjs`, `.github/workflows/ci.yml`
Verification: `test/client-boundaries.test.ts`
