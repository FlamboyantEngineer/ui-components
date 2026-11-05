---
'@flamboyantengineer/ui-components': minor
---

Add `MiniApp`, which runs a self-contained HTML, CSS and JavaScript tool, such as a calculator or an interactive chart, in a sandboxed frame of its own opaque origin. A Content Security Policy blocks every load and connection unless the host lists `allowedOrigins`. The mini-app reaches the host only through `window.miniApp`: `call(name, args)` for the functions the host lends in `capabilities`, and `state` with `setState(state)` for state the host keeps through `initialState` and `onStateChange`. The root publishes `data-status` (`loading`, `ready`, `error`) and `data-error` (`script`, `timeout`, `navigation`); the frame follows its content's height. New provider strings: `miniAppLoading` and `miniAppFailed`.
