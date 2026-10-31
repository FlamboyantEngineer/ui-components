import { describe, expect, it, vi } from 'vitest';
import { stopConsumedEscape } from './consumed-escape.js';

describe('stopConsumedEscape', () => {
  it('UIC-MODAL-2.1 stops only an Escape that was already handled', () => {
    const event = (key: string, defaultPrevented: boolean) => ({
      key,
      defaultPrevented,
      stopPropagation: vi.fn(),
    });
    const handled = event('Escape', true);
    expect(stopConsumedEscape(handled)).toBe(true);
    expect(handled.stopPropagation).toHaveBeenCalledOnce();
    for (const other of [event('Escape', false), event('Enter', true)]) {
      expect(stopConsumedEscape(other)).toBe(false);
      expect(other.stopPropagation).not.toHaveBeenCalled();
    }
  });
});
