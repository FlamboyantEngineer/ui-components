import { describe, expect, it } from 'vitest';
import { toKeyIdentity } from './to-key-identity.js';

describe('toKeyIdentity', () => {
  it('UIC-REDLINE-COMPARE-1.1 UIC-DIAGRAM-CANVAS-2.1 retains key types and delimiter text', () => {
    const keys = [1, '1', 'number:1', 'a:b', '["number","1"]', Infinity, -Infinity, NaN];
    expect(new Set(keys.map(toKeyIdentity)).size).toBe(keys.length);
    expect(toKeyIdentity(0)).toBe(toKeyIdentity(-0));
    expect(toKeyIdentity('a:b')).toBe(toKeyIdentity('a:b'));
  });
});
