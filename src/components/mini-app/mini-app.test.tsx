import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { MiniApp, type MiniAppProps } from './mini-app.js';

const source = { html: '<p>Total: <output>0</output></p>' };

/** The test's end of a mini-app's channel, and the replies the host posted on it. */
interface FramePort {
  port: MessagePort;
  replies: unknown[];
  send: (message: unknown) => void;
}

const openPorts: MessagePort[] = [];

afterEach(() => {
  for (const port of openPorts.splice(0)) port.close();
  vi.useRealTimers();
});

function renderMiniApp(props: Partial<MiniAppProps> = {}) {
  return render(<MiniApp title="Loan calculator" source={source} {...props} />);
}

function frameOf(title = 'Loan calculator'): HTMLIFrameElement {
  const frame = screen.getByTitle(title);
  if (!(frame instanceof HTMLIFrameElement)) throw new Error('The frame is not an iframe.');
  return frame;
}

function rootOf(frame: HTMLElement): HTMLElement {
  const root = frame.closest<HTMLElement>('.ui-mini-app');
  if (!root) throw new Error('The frame has no mini-app root.');
  return root;
}

/**
 * Takes the port the host transfers to `frame` once it loads. jsdom loads `about:blank` in place of
 * the `srcdoc`, so the test plays the bridge's part on the port. Call it right after rendering,
 * before the frame's `load`.
 */
function connect(frame: HTMLIFrameElement): Promise<FramePort> {
  const target = frame.contentWindow;
  if (!target) throw new Error('The frame has no window.');
  const post = vi.spyOn(target, 'postMessage').mockImplementation(() => undefined);
  return takePort(post);
}

async function takePort(post: { mock: { calls: unknown[][] } }): Promise<FramePort> {
  await waitFor(() => expect(post.mock.calls).not.toHaveLength(0));
  const [message, origin, transfer] = post.mock.calls[0] ?? [];
  expect(message).toEqual({ type: 'ui-mini-app:connect' });
  expect(origin).toBe('*');
  const port = (transfer as MessagePort[] | undefined)?.[0];
  if (!port) throw new Error('The host transferred no port.');
  openPorts.push(port);
  const replies: unknown[] = [];
  port.onmessage = (event) => replies.push(event.data);
  return { port, replies, send: (data) => port.postMessage(data) };
}

describe('MiniApp', () => {
  it('UIC-MINI-APP-1.2 UIC-MINI-APP-4.2 UIC-MINI-APP-4.3 renders a named, sandboxed frame with its hooks', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = renderMiniApp({
      ref,
      id: 'tool',
      className: 'host',
      'data-kind': 'tool',
    });
    const frame = frameOf();
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-forms');
    expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(frame).toHaveAttribute(
      'srcdoc',
      expect.stringContaining('<p>Total: <output>0</output></p>'),
    );
    expect(frame).toHaveClass('ui-embedded-frame', 'ui-mini-app__frame');
    const root = rootOf(frame);
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('id', 'tool');
    expect(root).toHaveClass('ui-mini-app', 'host');
    expect(root).toHaveAttribute('data-kind', 'tool');
    expect(screen.getByRole('status')).toHaveClass('ui-mini-app__status');
    expectHooksMatchSpec(container, 'MINI-APP', {
      slots: ['frame', 'status'],
      callerAttributes: ['data-kind'],
    });
  });

  it('UIC-MINI-APP-3.1 says it is loading until the frame reports ready, then calls onReady once', async () => {
    const onReady = vi.fn();
    renderMiniApp({ onReady });
    const frame = frameOf();
    expect(rootOf(frame)).toHaveAttribute('data-status', 'loading');
    expect(screen.getByRole('status')).toHaveTextContent('Loading Loan calculator…');
    const { send } = await connect(frame);
    send({ type: 'ready' });
    await waitFor(() => expect(rootOf(frame)).toHaveAttribute('data-status', 'ready'));
    send({ type: 'ready' });
    send({ type: 'resize', height: 10 });
    await waitFor(() => expect(frame).toHaveAttribute('height', '10'));
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('UIC-MINI-APP-4.1 follows the height the frame reports in whole pixels', async () => {
    renderMiniApp();
    const frame = frameOf();
    expect(frame).not.toHaveAttribute('height');
    const { send } = await connect(frame);
    send({ type: 'resize', height: 240.2 });
    await waitFor(() => expect(frame).toHaveAttribute('height', '241'));
    send({ type: 'resize', height: 96 });
    await waitFor(() => expect(frame).toHaveAttribute('height', '96'));
    send({ type: 'resize', height: -4 });
    send({ type: 'resize', height: 'tall' });
    send({ type: 'resize', height: 120 });
    await waitFor(() => expect(frame).toHaveAttribute('height', '120'));
  });

  it('UIC-MINI-APP-4.1 adds the borders and padding of a border-box frame, so its content never scrolls', async () => {
    renderMiniApp();
    const frame = frameOf();
    const sheet = document.createElement('style');
    sheet.textContent =
      '.ui-mini-app__frame { box-sizing: border-box; border: 1px solid; padding: 2px 0 3.5px; }';
    document.head.append(sheet);
    try {
      const { send } = await connect(frame);
      send({ type: 'resize', height: 100 });
      await waitFor(() => expect(frame).toHaveAttribute('height', '108'));
      sheet.textContent = '.ui-mini-app__frame { box-sizing: content-box; border: 1px solid; }';
      send({ type: 'resize', height: 90 });
      await waitFor(() => expect(frame).toHaveAttribute('height', '90'));
    } finally {
      sheet.remove();
    }
  });

  it('UIC-MINI-APP-4.1 lets the mini-app scroll only while the host holds the frame shorter than its content', async () => {
    renderMiniApp();
    const frame = frameOf();
    let inner = 100;
    Object.defineProperty(frame, 'clientHeight', { configurable: true, get: () => inner });
    const { send, replies } = await connect(frame);
    send({ type: 'resize', height: 100 });
    await waitFor(() => expect(frame).toHaveAttribute('height', '100'));
    inner = 60;
    send({ type: 'resize', height: 120 });
    await waitFor(() => expect(replies).toEqual([{ type: 'scroll', enabled: true }]));
    inner = 90;
    send({ type: 'resize', height: 90 });
    await waitFor(() =>
      expect(replies).toEqual([
        { type: 'scroll', enabled: true },
        { type: 'scroll', enabled: false },
      ]),
    );
  });

  it('UIC-MINI-APP-2.2 answers calls with the named capability’s result', async () => {
    const double = vi.fn((args: unknown) => Number(args) * 2);
    const later = vi.fn(async (args: unknown) => `rate for ${String(args)}`);
    renderMiniApp({ capabilities: { double, later } });
    const { send, replies } = await connect(frameOf());
    send({ type: 'call', id: 1, name: 'double', args: 21 });
    send({ type: 'call', id: 2, name: 'later', args: 'EUR' });
    await waitFor(() => expect(replies).toHaveLength(2));
    expect(replies).toContainEqual({ id: 1, ok: true, value: 42 });
    expect(replies).toContainEqual({ id: 2, ok: true, value: 'rate for EUR' });
    expect(double).toHaveBeenCalledWith(21);
  });

  it('UIC-MINI-APP-2.2 rejects calls to unknown or inherited names, failures and uncloneable results', async () => {
    renderMiniApp({
      capabilities: {
        fail: () => {
          throw new Error('Rate service unavailable');
        },
        reject: () => Promise.reject(new Error('Not allowed')),
        uncloneable: () => () => undefined,
      },
    });
    const { send, replies } = await connect(frameOf());
    send({ type: 'call', id: 1, name: 'missing', args: null });
    send({ type: 'call', id: 2, name: 'toString', args: null });
    send({ type: 'call', id: 3, name: 'fail', args: null });
    send({ type: 'call', id: 4, name: 'reject', args: null });
    send({ type: 'call', id: 5, name: 'uncloneable', args: null });
    await waitFor(() => expect(replies).toHaveLength(5));
    expect(replies).toContainEqual({
      id: 1,
      ok: false,
      message: 'The host offers no capability named "missing".',
    });
    expect(replies).toContainEqual({
      id: 2,
      ok: false,
      message: 'The host offers no capability named "toString".',
    });
    expect(replies).toContainEqual({ id: 3, ok: false, message: 'Rate service unavailable' });
    expect(replies).toContainEqual({ id: 4, ok: false, message: 'Not allowed' });
    expect(replies).toContainEqual(expect.objectContaining({ id: 5, ok: false }));
  });

  it('UIC-MINI-APP-2.2 UIC-MINI-APP-3.3 answers with the latest capabilities without restarting', async () => {
    const { rerender } = renderMiniApp({ capabilities: { rate: () => 1 } });
    const frame = frameOf();
    const { send, replies } = await connect(frame);
    rerender(<MiniApp title="Loan calculator" source={source} capabilities={{ rate: () => 2 }} />);
    expect(frameOf()).toBe(frame);
    send({ type: 'call', id: 7, name: 'rate', args: null });
    await waitFor(() => expect(replies).toEqual([{ id: 7, ok: true, value: 2 }]));
  });

  it('UIC-MINI-APP-2.3 starts from initialState and passes saved state to onStateChange', async () => {
    const onStateChange = vi.fn();
    const { rerender } = renderMiniApp({ initialState: { amount: 1200 }, onStateChange });
    const frame = frameOf();
    const document = frame.getAttribute('srcdoc') ?? '';
    expect(document).toContain('state: {"amount":1200},');
    const { send } = await connect(frame);
    send({ type: 'state', value: { amount: 1500 } });
    await waitFor(() => expect(onStateChange).toHaveBeenCalledWith({ amount: 1500 }));
    rerender(
      <MiniApp
        title="Loan calculator"
        source={source}
        initialState={{ amount: 1500 }}
        onStateChange={onStateChange}
      />,
    );
    expect(frameOf()).toBe(frame);
    expect(frame).toHaveAttribute('srcdoc', document);
  });

  it('UIC-MINI-APP-2.3 drops a posted state that is not a JSON value and reports it', async () => {
    const onStateChange = vi.fn();
    const onError = vi.fn();
    renderMiniApp({ onStateChange, onError });
    const { send } = await connect(frameOf());
    const deep: unknown[] = [];
    let level = deep;
    for (let depth = 0; depth < 70; depth += 1) level.push((level = []));
    for (const value of [new Map([['a', 1]]), new Date(0), Number.NaN, deep]) {
      send({ type: 'state', value });
    }
    send({ type: 'state', value: { totals: [1, 'two', null, { done: true }] } });
    await waitFor(() =>
      expect(onStateChange).toHaveBeenCalledExactlyOnceWith({
        totals: [1, 'two', null, { done: true }],
      }),
    );
    expect(onError).toHaveBeenCalledTimes(4);
    expect(onError).toHaveBeenLastCalledWith({
      kind: 'script',
      message: 'The mini-app saved a state that is not a JSON value; it was dropped.',
    });
  });

  it('UIC-MINI-APP-3.2 fails on a script error before ready and hides the frame', async () => {
    const onError = vi.fn();
    const onReady = vi.fn();
    renderMiniApp({ onError, onReady });
    const frame = frameOf();
    const { send } = await connect(frame);
    send({ type: 'error', message: 'rate is not defined' });
    send({ type: 'ready' });
    await waitFor(() => expect(rootOf(frame)).toHaveAttribute('data-status', 'error'));
    const root = rootOf(frame);
    expect(root).toHaveAttribute('data-error', 'script');
    expect(frame).not.toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Loan calculator could not run.');
    expect(onError).toHaveBeenCalledExactlyOnceWith({
      kind: 'script',
      message: 'rate is not defined',
    });
    expect(onReady).not.toHaveBeenCalled();
    expectHooksMatchSpec(root, 'MINI-APP', { slots: ['frame', 'status'] });
  });

  it('UIC-MINI-APP-3.2 reports a script error after ready and keeps running', async () => {
    const onError = vi.fn();
    renderMiniApp({ onError });
    const frame = frameOf();
    const { send } = await connect(frame);
    send({ type: 'ready' });
    await waitFor(() => expect(rootOf(frame)).toHaveAttribute('data-status', 'ready'));
    send({ type: 'error', message: 'Division by zero' });
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith({ kind: 'script', message: 'Division by zero' }),
    );
    expect(rootOf(frame)).toHaveAttribute('data-status', 'ready');
    expect(rootOf(frame)).not.toHaveAttribute('data-error');
    expect(frame).toBeVisible();
  });

  it('UIC-MINI-APP-3.2 fails when it is not ready within the timeout', async () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    renderMiniApp({ onError, readyTimeout: 2000 });
    const frame = frameOf();
    await act(() => vi.advanceTimersByTimeAsync(1999));
    expect(rootOf(frame)).toHaveAttribute('data-status', 'loading');
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(rootOf(frame)).toHaveAttribute('data-error', 'timeout');
    expect(onError).toHaveBeenCalledExactlyOnceWith({
      kind: 'timeout',
      message: 'The mini-app was not ready within 2000 ms.',
    });
  });

  it('UIC-MINI-APP-3.2 waits 10 seconds by default and ignores an invalid timeout', async () => {
    vi.useFakeTimers();
    renderMiniApp({ readyTimeout: -1 });
    const frame = frameOf();
    await act(() => vi.advanceTimersByTimeAsync(9999));
    expect(rootOf(frame)).toHaveAttribute('data-status', 'loading');
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(rootOf(frame)).toHaveAttribute('data-status', 'error');
  });

  it('UIC-MINI-APP-3.2 fails when the frame loads another document', async () => {
    const onError = vi.fn();
    renderMiniApp({ onError });
    const frame = frameOf();
    const { send, port } = await connect(frame);
    send({ type: 'ready' });
    await waitFor(() => expect(rootOf(frame)).toHaveAttribute('data-status', 'ready'));
    const closed = new Promise((resolve) => port.addEventListener('close', resolve));
    const root = rootOf(frame);
    fireEvent.load(frame);
    expect(root).toHaveAttribute('data-error', 'navigation');
    expect(frame).not.toBeInTheDocument();
    expect(screen.queryByTitle('Loan calculator')).not.toBeInTheDocument();
    expect(onError).toHaveBeenCalledExactlyOnceWith({
      kind: 'navigation',
      message: 'The mini-app frame loaded another document.',
    });
    await closed;
  });

  it('UIC-MINI-APP-2.1 ignores messages that are not the bridge’s', async () => {
    const onStateChange = vi.fn();
    const onError = vi.fn();
    renderMiniApp({ onStateChange, onError });
    const frame = frameOf();
    const { send, replies } = await connect(frame);
    for (const message of [
      null,
      'ready',
      { type: 'unknown' },
      { type: 'error', message: 42 },
      { type: 'call', id: '1', name: 'x' },
      { type: 'call', id: 1, name: 2 },
    ]) {
      send(message);
    }
    send({ type: 'state', value: 'last' });
    await waitFor(() => expect(onStateChange).toHaveBeenCalledWith('last'));
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(replies).toEqual([]);
    expect(rootOf(frame)).toHaveAttribute('data-status', 'loading');
  });

  it('UIC-MINI-APP-3.3 restarts with a new frame and the current initialState when the source changes', async () => {
    const { rerender } = renderMiniApp({ initialState: 1 });
    const first = frameOf();
    const { send, port } = await connect(first);
    send({ type: 'ready' });
    await waitFor(() => expect(rootOf(first)).toHaveAttribute('data-status', 'ready'));
    const closed = new Promise((resolve) => port.addEventListener('close', resolve));
    rerender(
      <MiniApp title="Loan calculator" source={{ html: '<p>Version 2</p>' }} initialState={2} />,
    );
    const second = frameOf();
    expect(second).not.toBe(first);
    expect(rootOf(second)).toHaveAttribute('data-status', 'loading');
    expect(second).toHaveAttribute('srcdoc', expect.stringContaining('<p>Version 2</p>'));
    expect(second).toHaveAttribute('srcdoc', expect.stringContaining('state: 2,'));
    await closed;
  });

  it('UIC-MINI-APP-3.3 restarts when the admitted origins change, not for an ignored entry', () => {
    const { rerender } = renderMiniApp({ allowedOrigins: ['https://cdn.example.org'] });
    const first = frameOf();
    rerender(
      <MiniApp
        title="Loan calculator"
        source={source}
        allowedOrigins={['https://cdn.example.org', 'ftp://files.example.org']}
      />,
    );
    expect(frameOf()).toBe(first);
    rerender(<MiniApp title="Loan calculator" source={source} />);
    expect(frameOf()).not.toBe(first);
    expect(frameOf()).toHaveAttribute('srcdoc', expect.stringContaining("connect-src 'none'"));
  });

  it('UIC-MINI-APP-3.3 closes the channel when unmounted', async () => {
    const { unmount } = renderMiniApp();
    const { port } = await connect(frameOf());
    const closed = new Promise((resolve) => port.addEventListener('close', resolve));
    unmount();
    await closed;
  });

  it('UIC-MINI-APP-1.4 keeps each instance on its own channel', async () => {
    const first = vi.fn();
    const second = vi.fn();
    render(
      <>
        <MiniApp title="First" source={source} onStateChange={first} />
        <MiniApp title="Second" source={source} onStateChange={second} />
      </>,
    );
    const [one, two] = await Promise.all([connect(frameOf('First')), connect(frameOf('Second'))]);
    expect(one.port).not.toBe(two.port);
    one.send({ type: 'ready' });
    two.send({ type: 'state', value: 'second' });
    await waitFor(() => expect(rootOf(frameOf('First'))).toHaveAttribute('data-status', 'ready'));
    await waitFor(() => expect(second).toHaveBeenCalledWith('second'));
    expect(first).not.toHaveBeenCalled();
    expect(rootOf(frameOf('Second'))).toHaveAttribute('data-status', 'loading');
  });
});
