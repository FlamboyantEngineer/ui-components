import { describe, expect, it, vi } from 'vitest';
import { resolveDestination, toDisplayedPoint } from './pdf-destination.js';
import type { LoadedPdf } from './use-pdf-document.js';

const page = { rotate: 0, view: [0, 0, 420, 595] };

function createLoaded(rotation = 0): LoadedPdf {
  const pages = [page, page, { ...page, view: [10, 20, 430, 615] }];
  return {
    rotation,
    pages,
    document: {
      getDestination: vi.fn(async (name: string) =>
        name === 'markets' ? [{ num: 2, gen: 0 }, { name: 'XYZ' }, null, 568, null] : null,
      ),
      getPageIndex: vi.fn(async (ref: { num: number }) => ref.num),
    },
  } as unknown as LoadedPdf;
}

describe('PDF destinations', () => {
  it('UIC-PDF-VIEWER-4.5 places a point of user space on the page as displayed, at every rotation', () => {
    const point = { x: 48, y: 545 };
    expect(toDisplayedPoint(page, 0, point)).toEqual({ left: 48, top: 50 });
    expect(toDisplayedPoint(page, 90, point)).toEqual({ left: 545, top: 48 });
    expect(toDisplayedPoint(page, 180, point)).toEqual({ left: 372, top: 545 });
    expect(toDisplayedPoint(page, -90, point)).toEqual({ left: 50, top: 372 });
    expect(toDisplayedPoint({ ...page, rotate: 90 }, 270, point)).toEqual({ left: 48, top: 50 });
  });

  it('UIC-PDF-VIEWER-4.5 resolves the spot each kind of destination names', async () => {
    const loaded = createLoaded();
    const ref = { num: 1, gen: 0 };
    const at = (dest: unknown[]) => resolveDestination(loaded, dest);
    expect(await at([ref, { name: 'XYZ' }, 48, 545, 2])).toEqual({
      pageIndex: 1,
      rect: { left: 48, top: 50, width: 0, height: 0 },
    });
    expect(await at([ref, { name: 'FitH' }, 495])).toEqual({
      pageIndex: 1,
      rect: { left: 0, top: 100, width: 0, height: 0 },
    });
    expect(await at([ref, { name: 'FitV' }, 30])).toEqual({
      pageIndex: 1,
      rect: { left: 30, top: 0, width: 0, height: 0 },
    });
    expect(await at([ref, { name: 'FitR' }, 40, 100, 200, 300])).toEqual({
      pageIndex: 1,
      rect: { left: 40, top: 295, width: 0, height: 0 },
    });
    expect(await at([ref, { name: 'Fit' }])).toEqual({ pageIndex: 1, rect: null });
    expect(await at([0, { name: 'XYZ' }, null, null, null])).toEqual({ pageIndex: 0, rect: null });
  });

  it('UIC-PDF-VIEWER-4.5 resolves a named destination and refuses unknown ones', async () => {
    const loaded = createLoaded();
    expect(await resolveDestination(loaded, 'markets')).toEqual({
      pageIndex: 2,
      rect: { left: 0, top: 47, width: 0, height: 0 },
    });
    expect(await resolveDestination(createLoaded(90), 'markets')).toEqual({
      pageIndex: 2,
      rect: { left: 548, top: 0, width: 0, height: 0 },
    });
    expect(await resolveDestination(loaded, 'orchards')).toBeNull();
    expect(await resolveDestination(loaded, [{ num: 9, gen: 0 }, { name: 'Fit' }])).toBeNull();
    expect(await resolveDestination(loaded, [1.5, { name: 'Fit' }])).toBeNull();
    expect(await resolveDestination(loaded, null)).toBeNull();
    loaded.document.getPageIndex = () => Promise.reject(new Error('Bad reference'));
    expect(await resolveDestination(loaded, [{ num: 1, gen: 0 }])).toBeNull();
  });
});
