import { describe, expect, it } from 'vitest';
import * as core from '../core/index.js';
import { isComposingKey } from './is-composing-key.js';

describe('isComposingKey', () => {
  it('UIC-COMPOSING-KEY-1.1 UIC-TABLE-11.2 leaves keys an input method composes, or confirms with key code 229, to it', () => {
    expect(isComposingKey({ isComposing: true, keyCode: 13 })).toBe(true);
    expect(isComposingKey({ isComposing: false, keyCode: 229 })).toBe(true);
    expect(isComposingKey({ isComposing: false, keyCode: 13 })).toBe(false);
  });

  it('UIC-COMPOSING-KEY-1.1 is exported from the core entry', () => {
    expect(core.isComposingKey).toBe(isComposingKey);
  });
});
