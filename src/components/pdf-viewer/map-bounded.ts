interface MapBoundedOptions {
  /** How many calls may be in flight at once. */
  limit: number;
  /** Once it returns true, no further call starts. */
  isCancelled?: (() => boolean) | undefined;
}

/**
 * Maps `count` indexes through `load` with at most `limit` calls in flight, resolving with the
 * results in index order. Rejects with the first failure, after which no further call starts.
 */
export async function mapBounded<T>(
  count: number,
  load: (index: number) => Promise<T>,
  { limit, isCancelled = () => false }: MapBoundedOptions,
): Promise<T[]> {
  const results = new Array<T>(count);
  let next = 0;
  let hasFailed = false;
  const work = async () => {
    while (next < count && !hasFailed && !isCancelled()) {
      const index = next;
      next += 1;
      try {
        results[index] = await load(index);
      } catch (error) {
        hasFailed = true;
        throw error;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), count) }, work));
  return results;
}
