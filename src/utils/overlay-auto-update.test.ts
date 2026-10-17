import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { autoUpdateOverlay } from './overlay-auto-update.js';

let frames = new Map<number, FrameRequestCallback>();
let nextFrame = 1;

function runFrame() {
  const pending = [...frames.values()];
  frames = new Map();
  for (const callback of pending) callback(0);
}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  readonly elements: Element[] = [];
  disconnected = false;
  constructor(readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }
  observe(element: Element) {
    this.elements.push(element);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
}

function setup() {
  const anchor = document.body.appendChild(document.createElement('button'));
  const overlay = document.body.appendChild(document.createElement('div'));
  const scroller = document.body.appendChild(document.createElement('div'));
  const update = vi.fn();
  return { anchor, overlay, scroller, update };
}

beforeEach(() => {
  frames = new Map();
  FakeResizeObserver.instances = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('autoUpdateOverlay', () => {
  it('UIC-OVERLAY-POSITION-3.5 solves at once, then once per frame after scrolls and resizes', () => {
    const { anchor, overlay, scroller, update } = setup();
    const stop = autoUpdateOverlay({ anchor, overlay, update });
    expect(update).toHaveBeenCalledTimes(1);
    expect(FakeResizeObserver.instances[0]?.elements).toEqual([anchor, overlay]);

    scroller.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    FakeResizeObserver.instances[0]?.callback([], {} as ResizeObserver);
    expect(update).toHaveBeenCalledTimes(1);
    runFrame();
    expect(update).toHaveBeenCalledTimes(2);

    scroller.dispatchEvent(new Event('scroll'));
    stop();
    runFrame();
    window.dispatchEvent(new Event('resize'));
    runFrame();
    expect(update).toHaveBeenCalledTimes(2);
    expect(FakeResizeObserver.instances[0]?.disconnected).toBe(true);
  });

  it('UIC-OVERLAY-POSITION-3.5 follows an anchor that moves on its own with everyFrame', () => {
    const { anchor, overlay, update } = setup();
    let top = 10;
    anchor.getBoundingClientRect = () => DOMRect.fromRect({ x: 5, y: top, width: 40, height: 20 });
    const stop = autoUpdateOverlay({ anchor, overlay, update, everyFrame: true });
    expect(update).toHaveBeenCalledTimes(1);
    runFrame();
    expect(update).toHaveBeenCalledTimes(1);
    top = 30;
    runFrame();
    expect(update).toHaveBeenCalledTimes(2);
    runFrame();
    expect(update).toHaveBeenCalledTimes(2);
    stop();
    top = 50;
    runFrame();
    expect(update).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);
  });
});
