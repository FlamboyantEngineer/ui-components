import { afterEach, describe, expect, it, vi } from 'vitest';
import { listAnimations } from './list-animations.js';

describe('listAnimations', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('UIC-ENTER-EXIT-1.3 lists no animations without an element or the Web Animations API', () => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'getAnimations', { value: undefined });
    expect(listAnimations(element)).toEqual([]);
    expect(listAnimations(null)).toEqual([]);
    expect(listAnimations(undefined)).toEqual([]);
  });

  it('UIC-ENTER-EXIT-1.3 lists the running animations where the API exists', () => {
    const element = document.createElement('div');
    const running = [{ playState: 'running' }] as unknown as Animation[];
    Object.defineProperty(element, 'getAnimations', { value: () => running });
    expect(listAnimations(element)).toBe(running);
  });
});
