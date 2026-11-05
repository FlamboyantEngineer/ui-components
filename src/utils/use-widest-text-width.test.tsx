import { act, render, screen, waitFor } from '@testing-library/react';
import { createElement, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWidestTextWidth } from './use-widest-text-width.js';

function Probe({ texts }: { texts: readonly string[] }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const width = useWidestTextWidth(ref, texts);
  return (
    <span ref={ref} role="status" aria-label="Widest text">
      {String(width)}
    </span>
  );
}

function stubCanvas() {
  const fonts: string[] = [];
  const measureText = vi.fn((text: string) => ({ width: text.length * 6.5 }));
  const context = {
    measureText,
    set font(value: string) {
      fonts.push(value);
    },
  };
  vi.stubGlobal(
    'OffscreenCanvas',
    vi.fn(function () {
      return { getContext: () => context };
    }),
  );
  return { measureText, fonts };
}

/** A document font set: ready once `ready` settles, and an event target for later loading. */
function installFonts(ready: Promise<void>) {
  const fonts = Object.assign(new EventTarget(), { ready });
  Object.defineProperty(document, 'fonts', { value: fonts, configurable: true });
  return fonts;
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, 'fonts');
});

const probe = () => screen.getByRole('status', { name: 'Widest text' });

describe('useWidestTextWidth', () => {
  it('UIC-MEASUREMENT-3.1 measures the widest text in the element font, rounded up', async () => {
    const { measureText, fonts } = stubCanvas();
    const { rerender } = render(createElement(Probe, { texts: ['Fig', 'Banana'] }));
    await waitFor(() => expect(probe()).toHaveTextContent('39'));
    expect(fonts.at(-1)).toMatch(/\S/);
    const calls = measureText.mock.calls.length;
    rerender(createElement(Probe, { texts: ['Fig', 'Banana'] }));
    expect(measureText).toHaveBeenCalledTimes(calls);
    rerender(createElement(Probe, { texts: ['Fig', 'Clementine'] }));
    await waitFor(() => expect(probe()).toHaveTextContent('65'));
  });

  it('UIC-MEASUREMENT-3.1 measures again once the fonts load', async () => {
    const { measureText } = stubCanvas();
    let loaded: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      loaded = resolve;
    });
    installFonts(ready);
    render(createElement(Probe, { texts: ['Pear'] }));
    await waitFor(() => expect(probe()).toHaveTextContent('26'));
    const calls = measureText.mock.calls.length;
    loaded();
    await waitFor(() => expect(measureText.mock.calls.length).toBeGreaterThan(calls));
  });

  it('UIC-MEASUREMENT-3.1 preserves newlines within labels and distinguishes an empty list', () => {
    const { measureText } = stubCanvas();
    const { rerender } = render(createElement(Probe, { texts: ['A', 'B'] }));
    expect(probe()).toHaveTextContent('7');
    measureText.mockClear();
    rerender(createElement(Probe, { texts: ['A\nB'] }));
    expect(measureText).toHaveBeenCalledWith('A\nB');
    expect(probe()).toHaveTextContent('20');
    measureText.mockClear();
    rerender(createElement(Probe, { texts: [] }));
    expect(probe()).toHaveTextContent('0');
    expect(measureText).not.toHaveBeenCalled();
    rerender(createElement(Probe, { texts: [''] }));
    expect(measureText).toHaveBeenCalledWith('');
  });

  it('UIC-MEASUREMENT-3.1 ignores font readiness after unmount', async () => {
    const { measureText } = stubCanvas();
    let loaded = () => {};
    const ready = new Promise<void>((resolve) => {
      loaded = resolve;
    });
    installFonts(ready);
    const { unmount } = render(createElement(Probe, { texts: ['Pear'] }));
    expect(measureText).toHaveBeenCalledTimes(1);
    unmount();
    loaded();
    await ready;
    expect(measureText).toHaveBeenCalledTimes(1);
  });

  it('UIC-MEASUREMENT-3.1 returns null without an offscreen canvas', () => {
    vi.stubGlobal('OffscreenCanvas', undefined);
    render(createElement(Probe, { texts: ['Plum'] }));
    expect(probe()).toHaveTextContent('null');
  });

  it('UIC-MEASUREMENT-3.1 measures again whenever fonts finish loading later, until unmount', async () => {
    const { measureText } = stubCanvas();
    const fonts = installFonts(Promise.resolve());
    const { unmount } = render(createElement(Probe, { texts: ['Pear'] }));
    await waitFor(() => expect(probe()).toHaveTextContent('26'));
    measureText.mockImplementation((text: string) => ({ width: text.length * 15 }));
    act(() => {
      fonts.dispatchEvent(new Event('loadingdone'));
    });
    expect(probe()).toHaveTextContent('60');
    measureText.mockImplementation((text: string) => ({ width: text.length * 20 }));
    act(() => {
      fonts.dispatchEvent(new Event('loadingdone'));
    });
    expect(probe()).toHaveTextContent('80');
    const calls = measureText.mock.calls.length;
    unmount();
    fonts.dispatchEvent(new Event('loadingdone'));
    expect(measureText).toHaveBeenCalledTimes(calls);
  });
});
