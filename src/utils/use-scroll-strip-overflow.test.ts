import { act, createElement, useRef, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useScrollStripOverflow, type ScrollStripState } from './use-scroll-strip-overflow.js';

let frames: Map<number, FrameRequestCallback>;
let resize: () => void;
let observed: Set<Element>;
let disconnected: boolean;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  frames = new Map();
  let frameId = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  resize = () => {};
  observed = new Set();
  disconnected = false;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe(element: Element) {
        observed.add(element);
      }
      unobserve(element: Element) {
        observed.delete(element);
      }
      disconnect() {
        disconnected = true;
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

async function flush(): Promise<void> {
  await act(async () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(0));
  });
}

interface Geometry {
  position: number;
  visible: number;
  total: number;
}

function defineGeometry(element: HTMLElement, geometry: Geometry, counter: { reads: number }) {
  const getters: Record<string, () => number> = {
    scrollLeft: () => geometry.position,
    scrollTop: () => geometry.position,
    clientWidth: () => geometry.visible,
    clientHeight: () => geometry.visible,
    scrollWidth: () => geometry.total,
    scrollHeight: () => geometry.total,
  };
  for (const [key, read] of Object.entries(getters)) {
    Object.defineProperty(element, key, {
      configurable: true,
      get() {
        counter.reads += 1;
        return read();
      },
      set(value: number) {
        geometry.position = value;
      },
    });
  }
}

test('UIC-SCROLL-STRIP-1.1 UIC-SCROLL-STRIP-1.2 coalesces measurements per frame and resyncs on resize, content and orientation', async () => {
  let api!: ScrollStripState;
  function Strip({ orientation }: { orientation: 'horizontal' | 'vertical' }): ReactElement {
    const ref = useRef<HTMLDivElement>(null);
    api = useScrollStripOverflow(ref, { orientation });
    return createElement('div', { ref, 'data-testid': 'strip' });
  }
  const root = createRoot(document.body.appendChild(document.createElement('div')));
  const geometry = { position: 0, visible: 100, total: 300 };
  const counter = { reads: 0 };
  try {
    await act(async () => root.render(createElement(Strip, { orientation: 'horizontal' })));
    const strip = document.querySelector<HTMLDivElement>('[data-testid="strip"]')!;
    defineGeometry(strip, geometry, counter);

    for (let index = 0; index < 50; index += 1) {
      api.syncOverflow();
      resize();
    }
    expect(counter.reads).toBe(0);
    expect(frames.size).toBe(1);
    await flush();
    expect(counter.reads).toBe(3);
    expect(api.overflow).toEqual({ start: false, end: true });

    geometry.position = 200;
    api.syncOverflow();
    await flush();
    expect(api.overflow).toEqual({ start: true, end: false });

    geometry.total = 500;
    const child = document.createElement('span');
    await act(async () => strip.append(child));
    expect(observed.has(child)).toBe(true);
    await flush();
    expect(api.overflow).toEqual({ start: true, end: true });
    await act(async () => child.remove());
    expect(observed.has(child)).toBe(false);
    await flush();

    geometry.position = 0;
    geometry.visible = 500;
    resize();
    await flush();
    expect(api.overflow).toEqual({ start: false, end: false });

    geometry.position = 30;
    geometry.visible = 100;
    api.syncOverflow();
    await act(async () => root.render(createElement(Strip, { orientation: 'vertical' })));
    expect(frames.size).toBe(1);
    await flush();
    expect(api.overflow).toEqual({ start: true, end: true });
    api.syncOverflow();
  } finally {
    await act(async () => root.unmount());
  }
  expect(frames.size).toBe(0);
  expect(disconnected).toBe(true);
});

function wheel(target: Element, init: WheelEventInit): WheelEvent {
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

test('UIC-SCROLL-STRIP-1.3 turns wheel input into horizontal scrolling, except inside popups or with modifiers', async () => {
  const onWheelScroll = vi.fn();
  function Strip(): ReactElement {
    const ref = useRef<HTMLDivElement>(null);
    useScrollStripOverflow(ref, { onWheelScroll });
    return createElement(
      'div',
      { ref, 'data-testid': 'strip' },
      createElement('button', { type: 'button' }, 'Apple'),
      createElement('div', { role: 'menu' }, createElement('span', { 'data-testid': 'item' })),
    );
  }
  const root = createRoot(document.body.appendChild(document.createElement('div')));
  try {
    await act(async () => root.render(createElement(Strip)));
    const strip = document.querySelector<HTMLDivElement>('[data-testid="strip"]')!;
    const geometry = { position: 0, visible: 100, total: 300 };
    defineGeometry(strip, geometry, { reads: 0 });
    const button = strip.querySelector('button')!;

    const scrolled = wheel(button, { deltaY: 40 });
    expect(scrolled.defaultPrevented).toBe(true);
    expect(geometry.position).toBe(40);
    expect(onWheelScroll).toHaveBeenCalledTimes(1);

    wheel(button, { deltaX: 3, deltaY: 1, deltaMode: 1 });
    expect(geometry.position).toBe(88);

    wheel(button, { deltaY: 1, deltaMode: 2 });
    expect(geometry.position).toBe(188);
    expect(wheel(button, { deltaY: 10 }).defaultPrevented).toBe(true);
    expect(geometry.position).toBe(198);
    expect(wheel(button, { deltaY: 10 }).defaultPrevented).toBe(true);
    expect(geometry.position).toBe(200);
    expect(wheel(button, { deltaY: 10 }).defaultPrevented).toBe(false);

    expect(wheel(button, { deltaY: -10, ctrlKey: true }).defaultPrevented).toBe(false);
    expect(
      wheel(strip.querySelector('[data-testid="item"]')!, { deltaY: -10 }).defaultPrevented,
    ).toBe(false);
    expect(geometry.position).toBe(200);
  } finally {
    await act(async () => root.unmount());
  }
});

test('UIC-SCROLL-STRIP-1.4 reports and scrolls a right-to-left strip from its inline start', async () => {
  let api!: ScrollStripState;
  function Strip(): ReactElement {
    const ref = useRef<HTMLDivElement>(null);
    api = useScrollStripOverflow(ref);
    return createElement('div', { ref, dir: 'rtl', 'data-testid': 'strip' });
  }
  const root = createRoot(document.body.appendChild(document.createElement('div')));
  try {
    await act(async () => root.render(createElement(Strip)));
    const strip = document.querySelector<HTMLDivElement>('[data-testid="strip"]')!;
    strip.style.direction = 'rtl';
    const geometry = { position: 0, visible: 100, total: 300 };
    defineGeometry(strip, geometry, { reads: 0 });
    api.syncOverflow();
    await flush();
    expect(api.overflow).toEqual({ start: false, end: true });

    wheel(strip, { deltaY: 50 });
    expect(geometry.position).toBe(-50);
    api.syncOverflow();
    await flush();
    expect(api.overflow).toEqual({ start: true, end: true });

    wheel(strip, { deltaY: 500 });
    expect(geometry.position).toBe(-200);
    api.syncOverflow();
    await flush();
    expect(api.overflow).toEqual({ start: true, end: false });
  } finally {
    await act(async () => root.unmount());
  }
});

test('UIC-SCROLL-STRIP-1.3 leaves a vertical strip to native wheel scrolling', async () => {
  function Strip(): ReactElement {
    const ref = useRef<HTMLDivElement>(null);
    useScrollStripOverflow(ref, { orientation: 'vertical' });
    return createElement('div', { ref, 'data-testid': 'strip' });
  }
  const root = createRoot(document.body.appendChild(document.createElement('div')));
  try {
    await act(async () => root.render(createElement(Strip)));
    const strip = document.querySelector<HTMLDivElement>('[data-testid="strip"]')!;
    defineGeometry(strip, { position: 0, visible: 100, total: 300 }, { reads: 0 });
    expect(wheel(strip, { deltaY: 40 }).defaultPrevented).toBe(false);
  } finally {
    await act(async () => root.unmount());
  }
});
