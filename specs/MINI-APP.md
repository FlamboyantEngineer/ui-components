# Mini App

`MiniApp` runs a small self-contained tool, written in HTML, CSS and JavaScript by a person or an AI assistant, inside the page: a calculator with its own inputs and output, an interactive chart, a scripted form. It builds on [Layout](LAYOUT.md)'s `EmbeddedFrame`: the mini-app's code runs in a sandboxed frame of its own opaque origin, so it never reaches the host's DOM, cookies, storage or services. It talks to the host over one message channel, through the named capabilities the host lends it and the state it saves, and reaches the network only at the origins the host allows. [HTML Markup](HTML-MARKUP.md) stays a renderer of inert markup; executable content belongs here.

## UIC-MINI-APP-1 - Source and isolation

### UIC-MINI-APP-1.1 - Source

`source` shall be `{ html, css?, script? }`: `html` is the markup of the mini-app's `<body>`, `css` its stylesheet and `script` its script, which runs after the markup. The frame's document (`srcdoc`) takes the provider's language and direction on its `<html>` and `title` as its `<title>`, and holds, in order, the content policy, the bridge script (UIC-MINI-APP-2.1), the stylesheet in a `<style>` element, the markup and the script in a `<script>` element. A closing `</style` in the stylesheet or `</script` in the script, and `<!--` in either, is escaped so the code cannot end its element early. A mini-app needs no build step and no framework; it may load a library from an allowed origin (UIC-MINI-APP-1.3).

Implementation: `src/components/mini-app/mini-app-document.ts`
Verification: `src/components/mini-app/mini-app-document.test.ts`

### UIC-MINI-APP-1.2 - Sandbox

The frame shall be sandboxed with `allow-scripts allow-forms` and nothing else, with `referrerpolicy="no-referrer"`: its origin is opaque, so its code cannot read the host's DOM, cookies or storage, and it cannot open windows or dialogs, navigate the host page or download files. Form submission never leaves the frame (`form-action 'none'`), so a form's `submit` handler can still run.

Implementation: `src/components/mini-app/mini-app.tsx`, `src/components/mini-app/mini-app-document.ts`
Verification: `src/components/mini-app/mini-app.test.tsx`, `e2e/mini-app.spec.ts`

### UIC-MINI-APP-1.3 - Network policy

The frame's document shall carry a Content Security Policy that blocks every load and connection by default (`default-src 'none'`) and lets the mini-app's inline code, inline styles and `data:` or `blob:` images, fonts and media run. `allowedOrigins` lists the `https:` origins it may also load scripts, styles, images, fonts and media from and connect to (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`). Only entries that are exactly an `https:` origin count; an entry with a path, a query, a wildcard, another scheme or a policy keyword is ignored, so no entry widens the policy beyond the origins it names. The host page's own policy, which a `srcdoc` frame inherits, still applies.

Implementation: `src/components/mini-app/mini-app-document.ts`
Verification: `src/components/mini-app/mini-app-document.test.ts`

### UIC-MINI-APP-1.4 - Instances

Each `MiniApp` shall run in its own frame with its own channel, so several on one page neither share state nor see one another's messages.

Implementation: `src/components/mini-app/mini-app.tsx`, `src/components/mini-app/use-mini-app-session.ts`
Verification: `src/components/mini-app/mini-app.test.tsx`, `e2e/mini-app.spec.ts`

## UIC-MINI-APP-2 - Host communication

### UIC-MINI-APP-2.1 - Bridge

The frame's first script shall define a frozen `window.miniApp` with `state`, `call(name, args)` and `setState(state)`. When the frame first loads, the host transfers a `MessagePort` to it (its origin is opaque, so the message is addressed to the frame's window with the target origin `*`), and the bridge takes only the first such port from the host's window. Messages the mini-app sends before then wait in a queue. Everything the host receives on the port is checked against the bridge's message shapes, and anything else is ignored.

Implementation: `src/components/mini-app/mini-app-bridge.ts`, `src/components/mini-app/use-mini-app-session.ts`
Verification: `src/components/mini-app/mini-app.test.tsx`, `e2e/mini-app.spec.ts`

### UIC-MINI-APP-2.2 - Capabilities

`capabilities` shall map names to the functions the host lends the mini-app; nothing else of the host's is reachable. `miniApp.call(name, args)` sends a structured clone of `args` and returns a promise of the function's result: the function receives the arguments and may return a value or a promise, and the result must be one the browser can clone. A throw or rejection, a result that cannot be cloned, or a name `capabilities` does not own (inherited names such as `toString` included) rejects the promise with an `Error` carrying the message. The latest `capabilities` answer each call; changing them does not restart the mini-app.

Implementation: `src/components/mini-app/use-mini-app-session.ts`, `src/components/mini-app/mini-app-bridge.ts`
Verification: `src/components/mini-app/mini-app.test.tsx`, `e2e/mini-app.spec.ts`

### UIC-MINI-APP-2.3 - State

`miniApp.state` shall be `initialState` (a JSON value, `null` by default) as it was when the mini-app started, and `miniApp.setState(state)` shall pass a JSON copy of `state` to `onStateChange`. A later `initialState` is read only at the next start (UIC-MINI-APP-3.3), so a host that passes back what it saved does not restart the mini-app. Where the state is kept, for how long and for whom is the host's decision: the component persists nothing itself.

Implementation: `src/components/mini-app/mini-app-document.ts`, `src/components/mini-app/mini-app-bridge.ts`, `src/components/mini-app/use-mini-app-session.ts`
Verification: `src/components/mini-app/mini-app-document.test.ts`, `src/components/mini-app/mini-app.test.tsx`, `e2e/mini-app.spec.ts`

## UIC-MINI-APP-3 - Lifecycle

### UIC-MINI-APP-3.1 - Loading and ready

The root shall publish `data-status="loading"` from the start until the frame's document has loaded (its `load` event, after its scripts, styles and images), then `ready`, and call `onReady` once. While loading, the status slot holds the provider's `miniAppLoading` string with the title.

Implementation: `src/components/mini-app/mini-app.tsx`, `src/components/mini-app/use-mini-app-session.ts`, `src/core/strings/media.ts`
Verification: `src/components/mini-app/mini-app.test.tsx`, `e2e/mini-app.spec.ts`

### UIC-MINI-APP-3.2 - Errors

The bridge shall report every uncaught error and unhandled rejection in the frame to the host instead of the console, and `onError` receives `{ kind, message }`. The mini-app fails, publishing `data-status="error"` and the kind in `data-error`, when its code throws before it is ready (`script`), when it is not ready within `readyTimeout` milliseconds (`timeout`, 10000 by default), or when its frame loads another document, for example by following a link (`navigation`). A failed mini-app hides its frame, closes its channel, and its status slot holds the provider's `miniAppFailed` string with the title. An error after the mini-app is ready reaches `onError` and leaves it running.

Implementation: `src/components/mini-app/use-mini-app-session.ts`, `src/components/mini-app/mini-app-bridge.ts`, `src/components/mini-app/mini-app.tsx`, `src/core/strings/media.ts`
Verification: `src/components/mini-app/mini-app.test.tsx`, `e2e/mini-app.spec.ts`

### UIC-MINI-APP-3.3 - Source replacement and disposal

A change to `source` or to the origins `allowedOrigins` admits shall start a new session: a new frame and channel, `loading` again, and `initialState` read afresh. Changes to the callbacks, `capabilities`, `initialState` or `readyTimeout` alone do not. Unmounting closes the channel, so late capability results go nowhere; a host restarts an unchanged mini-app by changing its React `key`.

Implementation: `src/components/mini-app/mini-app.tsx`, `src/components/mini-app/use-mini-app-session.ts`
Verification: `src/components/mini-app/mini-app.test.tsx`, `e2e/mini-app.spec.ts`

## UIC-MINI-APP-4 - Layout, focus and hooks

### UIC-MINI-APP-4.1 - Sizing

The bridge shall post the height of the frame's document whenever it changes, and the frame's `height` attribute follows it in whole pixels, adding the frame's own borders and padding when the host stylesheet sizes it `border-box`, so the frame grows and shrinks with its content. The document does not scroll vertically, so no empty scrollbar narrows it while the frame catches up with a new height, until the host stylesheet holds the frame shorter than its content (for example with `max-height`): the host then tells the bridge, and the document scrolls inside the frame. The host checks again whenever the content height or the frame's size changes. Its width is the host's: the frame neither grows nor fills by default. Before the first measure the frame has the browser's default height.

Implementation: `src/components/mini-app/mini-app-bridge.ts`, `src/components/mini-app/use-mini-app-session.ts`, `src/components/mini-app/mini-app.tsx`
Verification: `src/components/mini-app/mini-app.test.tsx`, `e2e/mini-app.spec.ts`

### UIC-MINI-APP-4.2 - Focus and keyboard

The frame shall be named by `title` and take part in the page's tab order: Tab moves into the mini-app's own controls in their order and out again after the last, and keys pressed inside go to the mini-app, not to the host's shortcuts. While the frame's focused element shows a focus ring (`:focus-visible` inside the frame), the bridge reports it and the frame publishes `data-focus-visible`, so the host draws a ring around the frame even where the browser does not match `:focus-visible` on a frame whose document holds the focus. The status slot is a `status` live region, so assistive technology hears when a mini-app starts loading or fails.

Implementation: `src/components/mini-app/mini-app.tsx`, `src/components/mini-app/mini-app-bridge.ts`, `src/components/mini-app/use-mini-app-session.ts`
Verification: `src/components/mini-app/mini-app.test.tsx`, `e2e/mini-app.spec.ts`, `e2e/forced-colors.spec.ts`

### UIC-MINI-APP-4.3 - Hooks and caller attributes

`MiniApp` shall carry the hooks below, append the caller's `className`, and forward caller `data-*` attributes, `id` and `ref` to its root. The frame also carries `EmbeddedFrame`'s hooks. The host stylesheet cannot reach inside the frame; the mini-app's own stylesheet styles its content.

Implementation: `src/components/mini-app/mini-app.tsx`, `labs/reference/mini-app.css`
Verification: `src/components/mini-app/mini-app.test.tsx`

## Hooks

| Hook                  | Kind      | Values                            | Description                                               |
| --------------------- | --------- | --------------------------------- | --------------------------------------------------------- |
| `ui-mini-app`         | root      |                                   | The `<div>` around the frame and its status.              |
| `ui-mini-app__frame`  | slot      |                                   | The sandboxed `<iframe>`; hidden once the mini-app fails. |
| `ui-mini-app__status` | slot      |                                   | The live region saying it is loading or has failed.       |
| `data-status`         | attribute | `loading`, `ready`, `error`       | Where the mini-app stands.                                |
| `data-error`          | state     | `script`, `timeout`, `navigation` | Why the mini-app failed.                                  |
| `data-focus-visible`  | state     | `true`                            | On the frame, while keyboard focus is inside it.          |
