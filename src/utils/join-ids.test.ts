import { describe, expect, it } from 'vitest';
import { joinIds } from './join-ids.js';

describe('joinIds', () => {
  it('UIC-COMPOSITION-2.3 joins the present ids and leaves out an empty list', () => {
    expect(joinIds('name', undefined, false, null, '', 'help')).toBe('name help');
    expect(joinIds(undefined, false)).toBeUndefined();
    expect(joinIds()).toBeUndefined();
  });
});
