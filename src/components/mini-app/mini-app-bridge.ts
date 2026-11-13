/**
 * The script that runs first in every mini-app frame. Before any of the mini-app's code runs, it
 * opens a `MessageChannel` and posts one end to the host's window, so the host takes its channel
 * from the vetted document and from nothing the frame loads later. It defines `window.miniApp` and
 * talks to the host only through the end it keeps. It reports uncaught errors and rejections to the host instead of the
 * console, posts the document's height whenever it changes, posts `ready` on the `load` event, and
 * posts `focus` with whether its focused element shows a focus ring as focus enters, moves and leaves.
 * The document does not scroll vertically until the host says its frame is capped (`scroll`).
 * `__STATE__` is replaced with the initial state's JSON.
 */
export const miniAppBridge = `(() => {
  const channel = new MessageChannel();
  const port = channel.port1;
  // The frame's origin is opaque and it cannot know the host's, so the message names no target origin.
  parent.postMessage({ type: 'ui-mini-app:connect' }, '*', [channel.port2]);
  let nextId = 1;
  document.documentElement.style.overflowY = 'hidden';
  const pending = new Map();
  const send = (message) => port.postMessage(message);
  const describe = (value) =>
    value instanceof Error ? value.message : typeof value === 'string' ? value : String(value);
  addEventListener('error', (event) => {
    event.preventDefault();
    send({ type: 'error', message: describe(event.error ?? event.message) });
  });
  addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    send({ type: 'error', message: describe(event.reason) });
  });
  let focusVisible = false;
  const reportFocus = () => {
    const active = document.hasFocus() ? document.activeElement : null;
    const visible = !!active && active !== document.body && active.matches(':focus-visible');
    if (visible === focusVisible) return;
    focusVisible = visible;
    send({ type: 'focus', visible });
  };
  addEventListener('focusin', reportFocus);
  addEventListener('blur', reportFocus);
  port.onmessage = ({ data: reply }) => {
    if (reply && reply.type === 'scroll') {
      document.documentElement.style.overflowY = reply.enabled ? 'auto' : 'hidden';
      return;
    }
    const call = reply && pending.get(reply.id);
    if (!call) return;
    pending.delete(reply.id);
    if (reply.ok) call.resolve(reply.value);
    else call.reject(new Error(reply.message));
  };
  addEventListener('load', () => {
    send({ type: 'ready' });
    const root = document.documentElement;
    new ResizeObserver(() => {
      send({ type: 'resize', height: Math.ceil(root.getBoundingClientRect().height) });
    }).observe(root);
  });
  const miniApp = Object.freeze({
    state: __STATE__,
    call: (name, args) =>
      new Promise((resolve, reject) => {
        const id = nextId++;
        const message = { type: 'call', id, name: String(name), args: structuredClone(args) };
        pending.set(id, { resolve, reject });
        send(message);
      }),
    setState: (value) => send({ type: 'state', value: JSON.parse(JSON.stringify(value ?? null)) }),
  });
  Object.defineProperty(window, 'miniApp', { value: miniApp, enumerable: true });
})();`;
