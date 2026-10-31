import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requireDefined } from './require-defined.js';
import { observeViewport } from './observe-viewport.js';

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }
}

class FakeMutationObserver {
  static instances: FakeMutationObserver[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(readonly callback: MutationCallback) {
    FakeMutationObserver.instances.push(this);
  }
}

let frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;

function runFrame() {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(0);
}

function mutate(type: MutationRecordType = 'childList') {
  FakeMutationObserver.instances[0]?.callback([{ type } as MutationRecord], {} as MutationObserver);
}

function resize() {
  FakeResizeObserver.instances[0]?.callback([], {} as ResizeObserver);
}

beforeEach(() => {
  frames = new Map();
  nextFrame = 0;
  FakeResizeObserver.instances = [];
  FakeMutationObserver.instances = [];
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.stubGlobal('MutationObserver', FakeMutationObserver);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
});

afterEach(() => vi.unstubAllGlobals());

describe('observeViewport', () => {
  it('UIC-SCROLL-REGION-2.7 retains unchanged observations through content mutations', () => {
    const element = document.createElement('div');
    element.replaceChildren(...Array.from({ length: 1000 }, () => document.createElement('p')));
    const measure = vi.fn();
    const current = observeViewport(element, window, { measure, subtree: true });
    const observer = requireDefined(FakeResizeObserver.instances[0]);
    expect(observer.observe).toHaveBeenCalledTimes(1001);
    for (let index = 0; index < 100; index += 1) mutate();
    resize();
    current.observe();
    current.schedule();
    expect(observer.observe).toHaveBeenCalledTimes(1001);
    expect(observer.disconnect).not.toHaveBeenCalled();
    expect(frames.size).toBe(1);
    runFrame();
    expect(measure).toHaveBeenCalledTimes(1);
    current.disconnect();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });

  it('UIC-SCROLL-REGION-2.7 observes added targets once and releases removed targets', () => {
    const element = document.createElement('div');
    const first = document.createElement('p');
    const second = document.createElement('p');
    const third = document.createElement('p');
    const header = document.createElement('header');
    const track = document.createElement('div');
    element.replaceChildren(first, second);
    let extras: Array<Element | null> = [header, first, header, null];
    const current = observeViewport(element, window, {
      measure: vi.fn(),
      getExtraTargets: () => extras,
    });
    const observer = requireDefined(FakeResizeObserver.instances[0]);
    expect(observer.observe.mock.calls).toEqual([[element], [first], [second], [header]]);
    element.replaceChildren(second, third);
    extras = [third, track, track];
    mutate();
    expect(observer.unobserve.mock.calls).toEqual([[first], [header]]);
    expect(observer.observe.mock.calls.slice(4)).toEqual([[third], [track]]);
    current.disconnect();
  });

  it('UIC-SCROLL-REGION-2.7 UIC-SCROLL-REGION-3.1 ignores callbacks and frames after release', () => {
    const measure = vi.fn();
    const current = observeViewport(document.createElement('div'), window, { measure });
    const pending = [...frames.values()];
    current.disconnect();
    mutate();
    resize();
    current.observe();
    current.schedule();
    for (const callback of pending) callback(0);
    expect(frames.size).toBe(0);
    expect(measure).not.toHaveBeenCalled();
    expect(FakeMutationObserver.instances[0]?.disconnect).toHaveBeenCalledTimes(1);
  });

  it('UIC-SCROLL-REGION-2.7 remeasures nested text, attribute and image changes without rewatching', () => {
    const element = document.createElement('div');
    element.replaceChildren(document.createElement('p'));
    const measure = vi.fn();
    const current = observeViewport(element, window, { measure, subtree: true });
    const observer = requireDefined(FakeResizeObserver.instances[0]);
    expect(FakeMutationObserver.instances[0]?.observe).toHaveBeenCalledWith(element, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    runFrame();
    measure.mockClear();
    observer.observe.mockClear();
    mutate('characterData');
    mutate('attributes');
    element.firstElementChild?.dispatchEvent(new Event('load'));
    runFrame();
    expect(measure).toHaveBeenCalledTimes(1);
    expect(observer.observe).not.toHaveBeenCalled();
    current.disconnect();
    element.firstElementChild?.dispatchEvent(new Event('load'));
    expect(frames.size).toBe(0);
  });

  it('UIC-SCROLL-REGION-2.7 watches only direct children without the subtree option', () => {
    const element = document.createElement('div');
    const current = observeViewport(element, window, { measure: vi.fn() });
    expect(FakeMutationObserver.instances[0]?.observe).toHaveBeenCalledWith(element, {
      childList: true,
    });
    current.disconnect();
  });

  it('UIC-SCROLL-REGION-2.7 still measures mutations without a resize observer', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const measure = vi.fn();
    const current = observeViewport(document.createElement('div'), window, { measure });
    mutate();
    runFrame();
    expect(measure).toHaveBeenCalledTimes(1);
    current.disconnect();
  });

  it('UIC-SCROLL-REGION-2.7 UIC-SCROLL-REGION-4.1 measures resizes and child changes at once in immediate mode', () => {
    const element = document.createElement('div');
    const measure = vi.fn();
    const current = observeViewport(element, window, { measure, subtree: true, immediate: true });
    expect(frames.size).toBe(0);
    mutate('attributes');
    expect(frames.size).toBe(1);
    resize();
    expect(measure).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    FakeMutationObserver.instances[0]?.callback(
      [{ type: 'childList', target: element } as unknown as MutationRecord],
      {} as MutationObserver,
    );
    expect(measure).toHaveBeenCalledTimes(2);
    mutate('childList');
    expect(measure).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(1);
    current.disconnect();
    resize();
    expect(measure).toHaveBeenCalledTimes(2);
  });
});
