import { describe, expect, it } from 'vitest';
import { isFreeEditKey, type EditKey } from './is-free-edit-key.js';

const plain: EditKey = {
  isComposing: false,
  keyCode: 39,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  defaultPrevented: false,
};

describe('isFreeEditKey', () => {
  it('UIC-TIMELINE-2.2 UIC-DASHBOARD-GRID-2.2 takes a plain key and leaves claimed ones', () => {
    expect(isFreeEditKey(plain)).toBe(true);
    expect(isFreeEditKey({ ...plain, altKey: true })).toBe(false);
    expect(isFreeEditKey({ ...plain, ctrlKey: true })).toBe(false);
    expect(isFreeEditKey({ ...plain, metaKey: true })).toBe(false);
    expect(isFreeEditKey({ ...plain, isComposing: true })).toBe(false);
    expect(isFreeEditKey({ ...plain, keyCode: 229 })).toBe(false);
    expect(isFreeEditKey({ ...plain, defaultPrevented: true })).toBe(false);
  });
});
