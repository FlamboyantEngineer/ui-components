import { describe, expect, it } from 'vitest';
import {
  listMatrixIndices,
  resolveMatrixColumnTracks,
  resolveMatrixSpan,
} from './matrix-window.js';

describe('matrix window', () => {
  it('UIC-RELATION-MATRIX-3.1 finds the items in view with an overscan', () => {
    const base = { extent: 100, size: 20, count: 50, overscan: 2 };
    expect(resolveMatrixSpan({ ...base, offset: 0 })).toEqual({ start: 0, end: 7 });
    expect(resolveMatrixSpan({ ...base, offset: -40 })).toEqual({ start: 0, end: 5 });
    expect(resolveMatrixSpan({ ...base, offset: 210 })).toEqual({ start: 8, end: 18 });
    expect(resolveMatrixSpan({ ...base, offset: 2000 })).toEqual({ start: 50, end: 50 });
    expect(resolveMatrixSpan({ ...base, size: 0, offset: 0 })).toEqual({ start: 0, end: 50 });
  });

  it('UIC-RELATION-MATRIX-3.1 keeps the focused index rendered outside the span', () => {
    expect(listMatrixIndices({ start: 3, end: 6 }, 4)).toEqual([3, 4, 5]);
    expect(listMatrixIndices({ start: 3, end: 6 }, 0)).toEqual([0, 3, 4, 5]);
    expect(listMatrixIndices({ start: 3, end: 6 }, 9)).toEqual([3, 4, 5, 9]);
    expect(listMatrixIndices({ start: 3, end: 6 }, -1)).toEqual([3, 4, 5]);
  });

  it('UIC-RELATION-MATRIX-3.1 places rendered columns on tracks with gaps for the others', () => {
    const tracks = resolveMatrixColumnTracks({ indices: [0, 4, 5], count: 8, width: 30 });
    expect(tracks.template).toBe('auto 30px 90px 30px 30px 60px');
    expect([...tracks.lines]).toEqual([
      [0, 2],
      [4, 4],
      [5, 5],
    ]);
    expect(resolveMatrixColumnTracks({ indices: [], count: 2, width: 10 }).template).toBe(
      'auto 20px',
    );
  });
});
