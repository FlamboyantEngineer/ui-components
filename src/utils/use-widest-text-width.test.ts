import { render, screen, waitFor } from '@testing-library/react';
import { createElement, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWidestTextWidth } from './use-widest-text-width.js';

function Probe({ texts }: { texts: readonly string[] }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const width = useWidestTextWidth(ref, texts);
  return createElement('span', { ref, 'data-testid': 'probe' }, String(width));
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

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, 'fonts');
});

describe('useWidestTextWidth', () => {
  it('UIC-MEASUREMENT-3.1 measures the widest text in the element font, rounded up', async () => {
    const { measureText, fonts } = stubCanvas();
    const { rerender } = render(createElement(Probe, { texts: ['Fig', 'Banana'] }));
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('39'));
    expect(fonts.at(-1)).toMatch(/\S/);
    const calls = measureText.mock.calls.length;
    rerender(createElement(Probe, { texts: ['Fig', 'Banana'] }));
    expect(measureText).toHaveBeenCalledTimes(calls);
    rerender(createElement(Probe, { texts: ['Fig', 'Clementine'] }));
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('65'));
  });

  it('UIC-MEASUREMENT-3.1 measures again once the fonts load', async () => {
    const { measureText } = stubCanvas();
    let loaded: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      loaded = resolve;
    });
    Object.defineProperty(document, 'fonts', { value: { ready }, configurable: true });
    render(createElement(Probe, { texts: ['Pear'] }));
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('26'));
    const calls = measureText.mock.calls.length;
    loaded();
    await waitFor(() => expect(measureText.mock.calls.length).toBeGreaterThan(calls));
  });

  it('UIC-MEASUREMENT-3.1 returns null without an offscreen canvas', () => {
    vi.stubGlobal('OffscreenCanvas', undefined);
    render(createElement(Probe, { texts: ['Plum'] }));
    expect(screen.getByTestId('probe')).toHaveTextContent('null');
  });
});
