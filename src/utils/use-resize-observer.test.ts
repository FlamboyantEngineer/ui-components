import { act, createElement, createRef, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useResizeObserver, type ResizeObserverTargets } from './use-resize-observer.js';

class FakeObserver {
  static instances: FakeObserver[] = [];
  readonly elements = new Set<Element>();
  readonly boxes: ResizeObserverOptions[] = [];
  disconnected = false;
  constructor(readonly callback: ResizeObserverCallback) {
    FakeObserver.instances.push(this);
  }
  observe(element: Element, options: ResizeObserverOptions): void {
    this.elements.add(element);
    this.boxes.push(options);
  }
  unobserve(element: Element): void {
    this.elements.delete(element);
  }
  disconnect(): void {
    this.disconnected = true;
    this.elements.clear();
  }
  report(entries: ResizeObserverEntry[] = []): void {
    this.callback(entries, this as unknown as ResizeObserver);
  }
}

const roots: Root[] = [];

beforeEach(() => {
  FakeObserver.instances = [];
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('ResizeObserver', FakeObserver);
});

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

/** Renders into a root the test owns; `root.render` is React DOM's own API, so it needs `act`. */
function commit(root: Root, element: ReactElement): Promise<void> {
  // eslint-disable-next-line testing-library/no-unnecessary-act -- root.render is React DOM's root API, not Testing Library's render
  return act(async () => root.render(element));
}

function newRoot(): Root {
  const root = createRoot(document.body.appendChild(document.createElement('div')));
  roots.push(root);
  return root;
}

function Watch({
  targets,
  onResize,
}: {
  targets: ResizeObserverTargets;
  onResize: ResizeObserverCallback;
}): null {
  useResizeObserver(targets, onResize);
  return null;
}

test('UIC-MEASUREMENT-1.1 shares one observer across refs, keeps it for fresh arrays and calls the latest callback', async () => {
  const root = newRoot();
  const callbacks = [vi.fn(), vi.fn()] as const;
  const refs = [createRef<HTMLDivElement>(), createRef<HTMLDivElement>()] as const;
  function Panel({ version, second = true }: { version: 0 | 1; second?: boolean }): ReactElement {
    useResizeObserver([refs[0], refs[1], refs[0]], callbacks[version]);
    return createElement(
      'section',
      null,
      createElement('div', { ref: refs[0] }),
      second ? createElement('div', { ref: refs[1] }) : null,
    );
  }
  await commit(root, createElement(Panel, { version: 0 }));
  expect(FakeObserver.instances).toHaveLength(1);
  const observer = FakeObserver.instances[0]!;
  expect([...observer.elements]).toEqual([refs[0].current, refs[1].current]);
  expect(observer.boxes).toEqual([{ box: 'content-box' }, { box: 'content-box' }]);

  const entries = [{ target: refs[0].current } as unknown as ResizeObserverEntry];
  observer.report(entries);
  expect(callbacks[0]).toHaveBeenCalledWith(entries, observer);

  await commit(root, createElement(Panel, { version: 1, second: false }));
  expect(FakeObserver.instances).toHaveLength(1);
  expect([...observer.elements]).toEqual([refs[0].current]);
  observer.report(entries);
  expect(callbacks[0]).toHaveBeenCalledTimes(1);
  expect(callbacks[1]).toHaveBeenCalledWith(entries, observer);

  await commit(root, createElement(Panel, { version: 1 }));
  expect(observer.elements.has(refs[1].current!)).toBe(true);
});

test('UIC-MEASUREMENT-1.2 target functions swap elements, and no targets disconnects and silences late reports', async () => {
  const root = newRoot();
  const callback = vi.fn();
  const first = document.createElement('div');
  const second = document.createElement('div');
  let target: Element | null = null;
  const targets = () => [target];
  const render = () => commit(root, createElement(Watch, { targets, onResize: callback }));

  await render();
  expect(FakeObserver.instances).toHaveLength(0);
  target = first;
  await render();
  const observer = FakeObserver.instances[0]!;
  target = second;
  await render();
  expect(FakeObserver.instances).toHaveLength(1);
  expect([...observer.elements]).toEqual([second]);

  target = null;
  await render();
  expect(observer.disconnected).toBe(true);
  observer.report();
  expect(callback).not.toHaveBeenCalled();

  target = first;
  await render();
  const next = FakeObserver.instances[1]!;
  await act(async () => roots.pop()!.unmount());
  expect(next.disconnected).toBe(true);
  next.report();
  expect(callback).not.toHaveBeenCalled();
});

test('UIC-MEASUREMENT-1.3 observes iframe content with the iframe window and skips windows without an observer', async () => {
  const root = newRoot();
  const iframe = document.body.appendChild(document.createElement('iframe'));
  const inner = iframe.contentDocument!.body;
  class FrameObserver extends FakeObserver {}
  Object.defineProperty(iframe.contentWindow!, 'ResizeObserver', {
    configurable: true,
    value: FrameObserver,
  });
  const callback = vi.fn();
  const targets = [document.body, inner];
  await commit(root, createElement(Watch, { targets, onResize: callback }));
  expect(FakeObserver.instances).toHaveLength(2);
  const [outer, framed] = FakeObserver.instances as [FakeObserver, FakeObserver];
  expect(framed).toBeInstanceOf(FrameObserver);
  expect([...framed.elements]).toEqual([inner]);
  expect([...outer.elements]).toEqual([document.body]);
  framed.report();
  expect(callback).toHaveBeenCalledTimes(1);

  Reflect.deleteProperty(iframe.contentWindow!, 'ResizeObserver');
  await commit(root, createElement(Watch, { targets, onResize: callback }));
  expect(framed.disconnected).toBe(true);
  expect(FakeObserver.instances).toHaveLength(2);
  await act(async () => roots.pop()!.unmount());
  expect(outer.disconnected).toBe(true);
});

test('UIC-MEASUREMENT-1.3 watches one element in two boxes with one observer per box', async () => {
  const root = newRoot();
  const element = document.createElement('div');
  const targets = [
    { element, box: 'border-box' as const },
    { element, box: 'content-box' as const },
  ];
  await commit(root, createElement(Watch, { targets, onResize() {} }));
  expect(FakeObserver.instances.map((observer) => observer.boxes)).toEqual([
    [{ box: 'border-box' }],
    [{ box: 'content-box' }],
  ]);
});
