import { act, renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { DiagramPalette } from './diagram-palette.js';

type DropOptions = { onDrop: (event: unknown) => void };
const drops: DropOptions[] = [];

vi.mock('../../primitives/index.js', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useDrop: (options: DropOptions) => {
    drops.push(options);
    return { dropProps: {}, isDropTarget: false };
  },
}));

const { usePaletteDrop } = await import('./diagram-palette.js');

function deferredText() {
  let resolve!: (text: string) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<string>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function makePalette(request: DiagramPalette['request'], isEnabled = true): DiagramPalette {
  return {
    isEnabled,
    request,
    add: vi.fn(),
    place: ({ x, y }) => ({ x: x + 1000, y: y + 1000 }),
  };
}

/** Drops a palette item whose text settles later, through the latest drop options. */
function drop(text: Promise<string>) {
  const getText = vi.fn(() => text);
  drops.at(-1)?.onDrop({
    x: 10,
    y: 20,
    items: [{ kind: 'text', types: new Set(['application/x-ui-diagram-node']), getText }],
  });
}

describe('usePaletteDrop', () => {
  const ref = createRef<HTMLElement>();
  const mount = (palette: DiagramPalette) =>
    renderHook(({ current }) => usePaletteDrop({ ref, palette: current }), {
      initialProps: { current: palette },
    });

  it('UIC-DIAGRAM-CANVAS-5.3 adds once a drop’s text settles, at the point under the drop', async () => {
    const request = vi.fn();
    mount(makePalette(request));
    const text = deferredText();
    drop(text.promise);
    await act(async () => text.resolve('valve'));
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('valve', { x: 1010, y: 1020 });
    const failing = deferredText();
    drop(failing.promise);
    await act(async () => failing.reject(new Error('unreadable')));
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('UIC-DIAGRAM-CANVAS-5.3 drops a pending drop when adding stops, the canvas goes, and asks the current callback otherwise', async () => {
    const first = vi.fn();
    const { rerender, unmount } = mount(makePalette(first));
    const stopped = deferredText();
    drop(stopped.promise);
    rerender({ current: makePalette(first, false) });
    rerender({ current: makePalette(first) });
    await act(async () => stopped.resolve('valve'));
    expect(first).not.toHaveBeenCalled();

    const replaced = deferredText();
    drop(replaced.promise);
    const second = vi.fn();
    rerender({ current: makePalette(second) });
    await act(async () => replaced.resolve('tank'));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('tank', { x: 1010, y: 1020 });

    const gone = deferredText();
    drop(gone.promise);
    unmount();
    await act(async () => gone.resolve('pump'));
    expect(second).toHaveBeenCalledTimes(1);
  });
});
