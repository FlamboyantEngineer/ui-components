import { describe, expect, it } from 'vitest';
import { getShownGridSize, moveGridSize } from './grid-size.js';

const max = { rows: 8, columns: 6 };

function move(key: string, options: { isRtl?: boolean; isCorner?: boolean } = {}) {
  return moveGridSize(
    { rows: 3, columns: 2 },
    { key, isRtl: options.isRtl ?? false, isCorner: options.isCorner ?? false, max },
  );
}

describe('moveGridSize', () => {
  it('UIC-GRID-SIZE-PICKER-2.1 moves one cell with the arrows, mirrored right to left', () => {
    expect(move('ArrowUp')).toEqual({ rows: 2, columns: 2 });
    expect(move('ArrowDown')).toEqual({ rows: 4, columns: 2 });
    expect(move('ArrowLeft')).toEqual({ rows: 3, columns: 1 });
    expect(move('ArrowRight')).toEqual({ rows: 3, columns: 3 });
    expect(move('ArrowRight', { isRtl: true })).toEqual({ rows: 3, columns: 1 });
    expect(move('ArrowLeft', { isRtl: true })).toEqual({ rows: 3, columns: 3 });
  });

  it('UIC-GRID-SIZE-PICKER-2.1 reaches the row ends and the corners with Home and End', () => {
    expect(move('Home')).toEqual({ rows: 3, columns: 1 });
    expect(move('End')).toEqual({ rows: 3, columns: 6 });
    expect(move('Home', { isCorner: true })).toEqual({ rows: 1, columns: 1 });
    expect(move('End', { isCorner: true })).toEqual({ rows: 8, columns: 6 });
  });

  it('UIC-GRID-SIZE-PICKER-2.1 stays between one and the maximum and ignores other keys', () => {
    const corner = { rows: 1, columns: 1 };
    const options = { isRtl: false, isCorner: false, max };
    expect(moveGridSize(corner, { ...options, key: 'ArrowUp' })).toEqual(corner);
    expect(moveGridSize(corner, { ...options, key: 'ArrowLeft' })).toEqual(corner);
    const far = { rows: 8, columns: 6 };
    expect(moveGridSize(far, { ...options, key: 'ArrowDown' })).toEqual(far);
    expect(moveGridSize(far, { ...options, key: 'ArrowRight' })).toEqual(far);
    expect(moveGridSize(far, { ...options, key: 'Enter' })).toBeNull();
  });
});

describe('getShownGridSize', () => {
  const bounds = { min: { rows: 5, columns: 4 }, max: { rows: 8, columns: 6 } };

  it('UIC-GRID-SIZE-PICKER-1.3 shows the minimum until the preview reaches it', () => {
    expect(getShownGridSize({ rows: 1, columns: 1 }, bounds)).toEqual({ rows: 5, columns: 4 });
    expect(getShownGridSize({ rows: 4, columns: 3 }, bounds)).toEqual({ rows: 5, columns: 4 });
  });

  it('UIC-GRID-SIZE-PICKER-1.3 grows one past the preview up to the maximum', () => {
    expect(getShownGridSize({ rows: 5, columns: 4 }, bounds)).toEqual({ rows: 6, columns: 5 });
    expect(getShownGridSize({ rows: 8, columns: 6 }, bounds)).toEqual({ rows: 8, columns: 6 });
  });
});
