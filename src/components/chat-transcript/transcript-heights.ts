/** The virtual feed's keys in draw order and each key's position. */
export interface TranscriptOrder {
  readonly keys: readonly string[];
  readonly indexOf: ReadonlyMap<string, number>;
}

interface Measurements {
  sum: number;
  count: number;
}

interface HeightTree {
  sums: Float64Array;
  counts: Uint32Array;
}

interface OrderedHeights {
  /** The estimated height of the children from `start` up to `end`, without gaps. */
  heightBetween(start: number, end: number): number;
  /** The longest prefix satisfying a condition that stops holding as the height grows, or zero. */
  findPrefix(accept: (end: number, height: number) => boolean): number;
}

interface HeightIndex extends OrderedHeights {
  order: TranscriptOrder;
  update(key: string, change: Measurements): void;
}

interface TranscriptHeights {
  set(key: string, height: number): void;
  inOrder(order: TranscriptOrder): OrderedHeights;
  reset(): void;
}

/** What an unmeasured child is taken to be before anything is measured, in pixels. */
const fallbackHeight = 64;

/** A Fenwick tree stores measured sums and counts separately so a new average costs no rebuild. */
function buildHeightTree(
  order: TranscriptOrder,
  measured: ReadonlyMap<string, number>,
): HeightTree {
  const sums = new Float64Array(order.keys.length + 1);
  const counts = new Uint32Array(sums.length);
  for (const [key, height] of measured) {
    const index = order.indexOf.get(key);
    if (index === undefined) continue;
    sums[index + 1] = height;
    counts[index + 1] = 1;
  }
  for (let child = 1; child < sums.length; child += 1) {
    const parent = child + (child & -child);
    if (parent >= sums.length) continue;
    sums[parent] = (sums[parent] as number) + (sums[child] as number);
    counts[parent] = (counts[parent] as number) + (counts[child] as number);
  }
  return { sums, counts };
}

function readPrefix({ sums, counts }: HeightTree, end: number): Measurements {
  let sum = 0;
  let count = 0;
  for (let node = end; node > 0; node -= node & -node) {
    sum += sums[node] as number;
    count += counts[node] as number;
  }
  return { sum, count };
}

function createHeightIndex(
  order: TranscriptOrder,
  measured: ReadonlyMap<string, number>,
  average: () => number,
): HeightIndex {
  const tree = buildHeightTree(order, measured);
  const { sums, counts } = tree;
  const maxStep = 2 ** Math.floor(Math.log2(order.keys.length));
  return {
    order,
    update(key, change) {
      const index = order.indexOf.get(key);
      if (index === undefined) return;
      for (let node = index + 1; node < sums.length; node += node & -node) {
        sums[node] = (sums[node] as number) + change.sum;
        counts[node] = (counts[node] as number) + change.count;
      }
    },
    heightBetween(start, end) {
      const before = readPrefix(tree, start);
      const after = readPrefix(tree, end);
      return after.sum - before.sum + (end - start - after.count + before.count) * average();
    },
    findPrefix(accept) {
      const estimate = average();
      let end = 0;
      let sum = 0;
      let count = 0;
      // Each step adds the next disjoint block, testing the prefix without another tree lookup.
      for (let step = maxStep; step >= 1; step >>= 1) {
        const candidate = end + step;
        if (candidate >= sums.length) continue;
        const nextSum = sum + (sums[candidate] as number);
        const nextCount = count + (counts[candidate] as number);
        if (!accept(candidate, nextSum + (candidate - nextCount) * estimate)) continue;
        end = candidate;
        sum = nextSum;
        count = nextCount;
      }
      return end;
    },
  };
}

/** Keeps each measured height by key across reordering and estimates the rest from the average. */
export function createTranscriptHeights(): TranscriptHeights {
  const measured = new Map<string, number>();
  let total = 0;
  let index: HeightIndex | undefined;
  const average = () => (measured.size > 0 ? total / measured.size : fallbackHeight);

  return {
    set(key, height) {
      const previous = measured.get(key);
      if (previous === height) return;
      const sum = height - (previous ?? 0);
      total += sum;
      measured.set(key, height);
      index?.update(key, { sum, count: previous === undefined ? 1 : 0 });
    },
    inOrder(order) {
      if (index?.order.keys !== order.keys) index = createHeightIndex(order, measured, average);
      return index;
    },
    reset() {
      measured.clear();
      total = 0;
      index = undefined;
    },
  };
}
