import { act, createElement, useRef, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { requireDefined } from './require-defined.js';
import { useElementSize, type ElementSize, type ElementSizeOptions } from './use-element-size.js';

interface Size {
  width: number;
  height: number;
}

class FakeObserver {
  static instances: FakeObserver[] = [];
  readonly targets: Array<{ element: Element; options: ResizeObserverOptions | undefined }> = [];
  disconnected = false;
  constructor(readonly callback: ResizeObserverCallback) {
    FakeObserver.instances.push(this);
  }
  observe(element: Element, options?: ResizeObserverOptions): void {
    this.targets.push({ element, options });
  }
  unobserve(element: Element): void {
    const index = this.targets.findIndex((target) => target.element === element);
    if (index !== -1) this.targets.splice(index, 1);
  }
  disconnect(): void {
    this.disconnected = true;
  }
  /** Reports a content box, with a border box 4px wider and taller. */
  report(content: Size, element = requireDefined(this.targets[0]).element): void {
    const entry = {
      target: element,
      contentRect: { width: content.width, height: content.height },
      borderBoxSize: [{ inlineSize: content.width + 4, blockSize: content.height + 4 }],
      contentBoxSize: [{ inlineSize: content.width, blockSize: content.height }],
      devicePixelContentBoxSize: [],
    } as unknown as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }
}

interface Frames {
  run(): void;
  pending(): number;
  cancelled: number[];
}

function installFrames(view: Window): Frames {
  let next = 1;
  const queue = new Map<number, FrameRequestCallback>();
  const cancelled: number[] = [];
  Object.assign(view, {
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      queue.set(next, callback);
      return next++;
    },
    cancelAnimationFrame: (id: number) => {
      cancelled.push(id);
      queue.delete(id);
    },
  });
  return {
    run() {
      const callbacks = [...queue.values()];
      queue.clear();
      for (const callback of callbacks) callback(0);
    },
    pending: () => queue.size,
    cancelled,
  };
}

// Saved as values and written back: the fakes are written through the window's own setters, which
// a restored property descriptor would not undo for the files that run after this one.
const saved = ['ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame'].map(
  (key) => [key, (window as unknown as Record<string, unknown>)[key]] as const,
);
const roots: Root[] = [];
const sizes: Array<ElementSize | null> = [];
let frames: Frames;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  FakeObserver.instances = [];
  sizes.length = 0;
  (window as unknown as Record<string, unknown>).ResizeObserver = FakeObserver;
  frames = installFrames(window);
});

afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  for (const [key, value] of saved) {
    if (value === undefined) Reflect.deleteProperty(window, key);
    else Object.assign(window, { [key]: value });
  }
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

/** Renders into a root the test owns; `root.render` is React DOM's own API, so it needs `act`. */
function commit(root: Root, element: ReactElement): Promise<void> {
  // eslint-disable-next-line testing-library/no-unnecessary-act -- root.render is React DOM's root API, not Testing Library's render
  return act(async () => root.render(element));
}

function Measured({ options }: { options?: ElementSizeOptions | undefined }): ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);
  sizes.push(useElementSize(ref, options));
  return createElement('section', { 'data-row': 'true' }, createElement('div', { ref }));
}

async function render(root: Root, options?: ElementSizeOptions): Promise<void> {
  await commit(root, createElement(Measured, { options }));
}

async function mount(
  options?: ElementSizeOptions,
  container: HTMLElement = document.body.appendChild(document.createElement('div')),
): Promise<Root> {
  const root = createRoot(container);
  roots.push(root);
  await render(root, options);
  return root;
}

const latest = () => sizes[sizes.length - 1] ?? null;

test('UIC-MEASUREMENT-2.1 is null until measured, applies the first report at once and coalesces later ones per frame', async () => {
  await mount();
  expect(latest()).toBeNull();
  const observer = requireDefined(FakeObserver.instances[0]);
  expect(observer.targets[0]?.options).toEqual({ box: 'content-box' });

  await act(async () => observer.report({ width: 300, height: 40 }));
  expect(latest()).toEqual({ width: 300, height: 40 });
  expect(frames.pending()).toBe(0);

  const renders = sizes.length;
  await act(async () => {
    observer.report({ width: 280, height: 40 });
    observer.report({ width: 260, height: 40 });
  });
  expect(sizes.length).toBe(renders);
  expect(frames.pending()).toBe(1);
  await act(async () => frames.run());
  expect(latest()).toEqual({ width: 260, height: 40 });
  expect(sizes.length).toBe(renders + 1);

  const settled = latest();
  await act(async () => {
    observer.report({ width: 260, height: 40 });
    frames.run();
  });
  expect(latest()).toBe(settled);
});

test('UIC-MEASUREMENT-2.2 measures the border box, the client box or the parent', async () => {
  await mount({ box: 'border-box' });
  const border = requireDefined(FakeObserver.instances[0]);
  expect(border.targets[0]?.options).toEqual({ box: 'border-box' });
  await act(async () => border.report({ width: 100, height: 20 }));
  expect(latest()).toEqual({ width: 104, height: 24 });

  const container = document.body.appendChild(document.createElement('div'));
  await mount({ box: 'client', parent: true }, container);
  const client = requireDefined(FakeObserver.instances[1]);
  const row = requireDefined(container.querySelector<HTMLElement>('[data-row="true"]'));
  expect(client.targets[0]?.element).toBe(row);
  expect(client.targets[0]?.options).toEqual({ box: 'border-box' });
  const scrollbar = requireDefined(FakeObserver.instances[2]);
  expect(scrollbar.targets).toEqual([{ element: row, options: { box: 'content-box' } }]);

  Object.defineProperties(row, {
    clientWidth: { configurable: true, value: 1000 },
    clientHeight: { configurable: true, value: 600 },
  });
  await act(async () => client.report({ width: 990, height: 590 }));
  expect(latest()).toEqual({ width: 1000, height: 600 });
  Object.defineProperty(row, 'clientWidth', { configurable: true, value: 980 });
  await act(async () => {
    scrollbar.report({ width: 970, height: 590 });
    frames.run();
  });
  expect(latest()).toEqual({ width: 980, height: 600 });
  await act(async () => requireDefined(roots.pop()).unmount());
  expect(client.disconnected && scrollbar.disconnected).toBe(true);
});

test('UIC-MEASUREMENT-2.3 is null while disabled or unsupported, and stopping cancels the pending frame', async () => {
  const root = await mount({ enabled: false });
  expect(FakeObserver.instances).toHaveLength(0);
  expect(latest()).toBeNull();

  await render(root, { enabled: true });
  const observer = requireDefined(FakeObserver.instances[0]);
  await act(async () => {
    observer.report({ width: 50, height: 10 });
    observer.report({ width: 60, height: 10 });
  });
  expect(frames.pending()).toBe(1);
  await render(root, { enabled: false });
  expect(observer.disconnected).toBe(true);
  expect(frames.cancelled).toHaveLength(1);
  expect(latest()).toBeNull();

  await render(root, { enabled: true });
  expect(latest()).toBeNull();

  Reflect.deleteProperty(window, 'ResizeObserver');
  await mount();
  expect(latest()).toBeNull();
});

test('UIC-MEASUREMENT-2.4 measures iframe content with the iframe window observer and frames', async () => {
  const iframe = document.body.appendChild(document.createElement('iframe'));
  const frameWindow = requireDefined(iframe.contentWindow);
  const frameDocument = requireDefined(iframe.contentDocument);
  class FrameObserver extends FakeObserver {}
  (frameWindow as unknown as Record<string, unknown>).ResizeObserver = FrameObserver;
  const innerFrames = installFrames(frameWindow);
  Reflect.deleteProperty(window, 'ResizeObserver');

  await mount(undefined, frameDocument.body.appendChild(frameDocument.createElement('div')));
  const observer = requireDefined(FakeObserver.instances[0]);
  expect(observer).toBeInstanceOf(FrameObserver);
  await act(async () => {
    observer.report({ width: 10, height: 10 });
    observer.report({ width: 20, height: 10 });
  });
  expect(innerFrames.pending()).toBe(1);
  expect(frames.pending()).toBe(0);
  await act(async () => innerFrames.run());
  expect(latest()).toEqual({ width: 20, height: 10 });
});

test('UIC-MEASUREMENT-2.2 switching from the client to the border box rereads the last report', async () => {
  const root = await mount({ box: 'client' });
  const observer = requireDefined(FakeObserver.instances[0]);
  const element = requireDefined(observer.targets[0]).element;
  Object.defineProperties(element, { clientWidth: { value: 110 }, clientHeight: { value: 30 } });
  await act(async () => observer.report({ width: 100, height: 20 }));
  expect(latest()).toEqual({ width: 110, height: 30 });
  await render(root, { box: 'border-box' });
  expect(FakeObserver.instances).toHaveLength(2);
  expect(observer.disconnected).toBe(false);
  expect(requireDefined(FakeObserver.instances[1]).disconnected).toBe(true);
  expect(latest()).toEqual({ width: 104, height: 24 });
});

test('UIC-MEASUREMENT-2.5 an element held in state is measured when it mounts and reset when replaced', async () => {
  function Panel({ elementKey }: { elementKey: string | null }): ReactElement | null {
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    sizes.push(useElementSize(element));
    return elementKey === null ? null : createElement('div', { ref: setElement, key: elementKey });
  }
  const root = createRoot(document.body.appendChild(document.createElement('div')));
  roots.push(root);
  const renderPanel = (elementKey: string | null) =>
    commit(root, createElement(Panel, { elementKey }));

  await renderPanel(null);
  expect(FakeObserver.instances).toHaveLength(0);
  await renderPanel('first');
  const observer = requireDefined(FakeObserver.instances[0]);
  const first = requireDefined(observer.targets[0]).element;
  await act(async () => observer.report({ width: 100, height: 20 }));
  expect(latest()).toEqual({ width: 100, height: 20 });
  await act(async () => observer.report({ width: 200, height: 20 }));
  expect(frames.pending()).toBe(1);

  await renderPanel('second');
  expect(requireDefined(observer.targets[0]).element).not.toBe(first);
  expect(latest()).toBeNull();
  expect(frames.pending()).toBe(0);
  await act(async () => observer.report({ width: 900, height: 900 }, first));
  expect(latest()).toBeNull();
  await act(async () => observer.report({ width: 300, height: 40 }));
  expect(latest()).toEqual({ width: 300, height: 40 });

  await renderPanel(null);
  expect(latest()).toBeNull();
  expect(observer.disconnected).toBe(true);
});

test('UIC-MEASUREMENT-2.5 follows the parent of an element held in state and keeps the object across commits', async () => {
  function Panel({ visible, rowKey }: { visible: boolean; rowKey: string }): ReactElement | null {
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    sizes.push(useElementSize(element, { parent: true, box: 'border-box' }));
    return visible
      ? createElement(
          'section',
          { key: rowKey, 'data-row': rowKey },
          createElement('div', { ref: setElement }),
        )
      : null;
  }
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  roots.push(root);
  const renderPanel = (visible: boolean, rowKey = 'first') =>
    commit(root, createElement(Panel, { visible, rowKey }));

  await renderPanel(true);
  const observer = requireDefined(FakeObserver.instances[0]);
  expect(requireDefined(observer.targets[0]).element).toBe(
    host.querySelector('[data-row="first"]'),
  );
  await act(async () => observer.report({ width: 100, height: 20 }));
  expect(latest()).toEqual({ width: 104, height: 24 });
  const settled = latest();
  await renderPanel(true);
  expect(FakeObserver.instances).toHaveLength(1);
  expect(latest()).toBe(settled);

  await renderPanel(true, 'second');
  expect(latest()).toBeNull();
  expect(requireDefined(observer.targets[0]).element).toBe(
    host.querySelector('[data-row="second"]'),
  );
  await renderPanel(false);
  expect(latest()).toBeNull();
  expect(observer.disconnected).toBe(true);
});
