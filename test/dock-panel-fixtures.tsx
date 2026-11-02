// Shared fixtures for the dock panel's unit tests.

import { act, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { FolderGlyph, LockGlyph, UsersGlyph } from '../src/core/glyphs.js';
import {
  DockPanel,
  DockPanelPane,
  type DockPanelProps,
} from '../src/components/dock-panel/dock-panel.js';
import { requireDefined } from '../src/utils/require-defined.js';

export const addFile = vi.fn();

/** A panel of three panes: Files with an action and a footer, People with a count, Locked off. */
export function Panel(props: Partial<DockPanelProps>) {
  return (
    <DockPanel label="Details" {...props}>
      <DockPanelPane
        id="files"
        label="Files"
        icon={FolderGlyph}
        actions={[{ verb: 'add', onPress: addFile }]}
        footer="Three files"
      >
        <input aria-label="File filter" />
      </DockPanelPane>
      <DockPanelPane id="people" label="People" icon={UsersGlyph} count={3}>
        <p>Maria Santos</p>
      </DockPanelPane>
      <DockPanelPane id="locked" label="Locked" icon={LockGlyph} isDisabled>
        <p>Hidden</p>
      </DockPanelPane>
      {null}
      <p>Not a pane</p>
    </DockPanel>
  );
}

/** A frame whose client size the fake observer reports. */
export function Frame({ children }: { children: ReactNode }) {
  return (
    <div role="region" aria-label="Frame">
      {children}
    </div>
  );
}

class FakeResizeObserver {
  static observers: FakeResizeObserver[] = [];
  readonly elements = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.observers.push(this);
  }
  observe(element: Element) {
    this.elements.add(element);
  }
  unobserve(element: Element) {
    this.elements.delete(element);
  }
  disconnect() {
    this.elements.clear();
  }
}

const frames = new Map<number, FrameRequestCallback>();
let frameId = 0;

/** Queues animation frames, which `flushFrames` runs, and observes sizes through a fake observer. */
export function stubFrames() {
  FakeResizeObserver.observers = [];
  frames.clear();
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
}

/** Runs the queued animation frames. */
export function flushFrames() {
  act(() => {
    const queued = [...frames.values()];
    frames.clear();
    for (const callback of queued) callback(0);
  });
}

/** Gives the frame a client size and reports it to every observer watching it. */
export function resizeFrame(width: number, height: number) {
  // An open drawer hides the frame from the accessibility tree, so look past that.
  const frame = screen.getByRole('region', { name: 'Frame', hidden: true });
  Object.defineProperties(frame, {
    clientWidth: { configurable: true, value: width },
    clientHeight: { configurable: true, value: height },
  });
  const entry = {
    target: frame,
    contentRect: { width, height },
    borderBoxSize: [{ inlineSize: width, blockSize: height }],
  } as unknown as ResizeObserverEntry;
  act(() => {
    for (const observer of FakeResizeObserver.observers) {
      if (observer.elements.has(frame))
        observer.callback([entry], observer as unknown as ResizeObserver);
    }
  });
  flushFrames();
}

/** Stubs what React Aria's sheet needs in jsdom. */
export function stubSheet() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
}

/** Ends the drawer's slide. */
export async function settleDrawer() {
  await act(async () => {
    for (const scroller of document.querySelectorAll('[data-sheet-scroll]')) {
      scroller.dispatchEvent(new Event('scrollend'));
    }
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
  flushFrames();
}

export function panelRoot(container: HTMLElement) {
  return requireDefined(container.querySelector<HTMLElement>('.ui-dock-panel'));
}

/** Lets a separator take pointer capture in jsdom. */
export function prepareCapture(handle: HTMLElement) {
  const capture = { id: null as number | null };
  Object.assign(handle, {
    setPointerCapture: (id: number) => {
      capture.id = id;
    },
    hasPointerCapture: (id: number) => capture.id === id,
    releasePointerCapture: () => {
      capture.id = null;
    },
  });
}
