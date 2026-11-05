/**
 * The script that runs first in every mini-app frame. It defines `window.miniApp` and talks to the
 * host only through the `MessagePort` the host transfers once the frame has loaded; messages sent
 * before then wait in a queue. It reports uncaught errors and rejections to the host instead of the
 * console, posts the document's height whenever it changes, and posts `ready` on the `load` event.
 * `__STATE__` is replaced with the initial state's JSON.
 */
export const miniAppBridge = `(() => {
  let port = null;
  let nextId = 1;
  const queue = [];
  const pending = new Map();
  const send = (message) => (port ? port.postMessage(message) : queue.push(message));
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
  addEventListener('message', (event) => {
    const data = event.data;
    if (port || event.source !== parent || !data || data.type !== 'ui-mini-app:connect') return;
    if (!event.ports[0]) return;
    port = event.ports[0];
    port.onmessage = ({ data: reply }) => {
      const call = reply && pending.get(reply.id);
      if (!call) return;
      pending.delete(reply.id);
      if (reply.ok) call.resolve(reply.value);
      else call.reject(new Error(reply.message));
    };
    for (const message of queue.splice(0)) port.postMessage(message);
  });
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
