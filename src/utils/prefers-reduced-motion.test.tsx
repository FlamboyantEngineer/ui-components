import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion, usePrefersReducedMotion } from './prefers-reduced-motion.js';

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the reduced-motion media query', () => {
    const matchMedia = vi.fn((query: string) => ({ matches: query.includes('reduce') }));
    vi.stubGlobal('matchMedia', matchMedia);
    expect(prefersReducedMotion()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('is false without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UIC-CAROUSEL-3.4 re-renders when the preference changes and stops listening on unmount', () => {
    let onChange: (() => void) | undefined;
    const list = {
      matches: false,
      addEventListener: vi.fn((_type: string, listener: () => void) => {
        onChange = listener;
      }),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => list),
    );
    const { result, unmount } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    list.matches = true;
    act(() => onChange?.());
    expect(result.current).toBe(true);
    unmount();
    expect(list.removeEventListener).toHaveBeenCalledWith('change', onChange);
  });

  it('UIC-CAROUSEL-3.4 is false on the server', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    function Probe() {
      return String(usePrefersReducedMotion());
    }
    expect(renderToString(<Probe />)).toBe('false');
  });
});
