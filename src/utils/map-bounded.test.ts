import { describe, expect, it } from 'vitest';
import { mapBounded } from './map-bounded.js';

describe('mapBounded', () => {
  it('UIC-PDF-VIEWER-1.7 keeps at most the limit in flight and returns results in order', async () => {
    let inFlight = 0;
    let peak = 0;
    const results = await mapBounded(
      20,
      async (index) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise((resolve) => setTimeout(resolve, (20 - index) % 3));
        inFlight -= 1;
        return index * 2;
      },
      { limit: 4 },
    );
    expect(results).toEqual(Array.from({ length: 20 }, (_, index) => index * 2));
    expect(peak).toBe(4);
    expect(await mapBounded(0, async () => 1, { limit: 4 })).toEqual([]);
  });

  it('UIC-PDF-VIEWER-1.7 starts nothing more once cancelled or failed', async () => {
    const started: number[] = [];
    let isCancelled = false;
    await mapBounded(
      10,
      async (index) => {
        started.push(index);
        if (index === 3) isCancelled = true;
        await Promise.resolve();
      },
      { limit: 2, isCancelled: () => isCancelled },
    );
    expect(started).toEqual([0, 1, 2, 3]);
    started.length = 0;
    await expect(
      mapBounded(
        10,
        async (index) => {
          started.push(index);
          if (index === 1) throw new Error('broken');
        },
        { limit: 2 },
      ),
    ).rejects.toThrow('broken');
    expect(started.length).toBeLessThan(10);
  });
});
