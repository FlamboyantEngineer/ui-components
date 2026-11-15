function slotCount(count: number): number {
  const slots = Math.trunc(count);
  return Number.isFinite(slots) && slots >= 1 ? slots : 0;
}

function hashOf(key: string): number {
  const normalized = key.trim();
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/**
 * A stable color slot for a key (a name or an id): an integer from 0 to `count - 1` that is the
 * same on every render, page and device. Leading and trailing whitespace in the key is ignored. A
 * `count` below one yields 0.
 */
export function getColorIndex(key: string, count: number): number {
  const slots = slotCount(count);
  return slots === 0 ? 0 : hashOf(key) % slots;
}

/**
 * A color slot for each of several keys, such as the people present together: each key takes its
 * `getColorIndex` slot or, when an earlier key took it, the next free one, keys taken in code unit
 * order so every view places them alike. Once every slot is taken, a key keeps its own slot.
 */
export function placeColorIndexes(keys: Iterable<string>, count: number): Map<string, number> {
  const slots = slotCount(count);
  const taken = new Set<number>();
  const placed = new Map<string, number>();
  for (const key of [...new Set(keys)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    let slot = getColorIndex(key, slots);
    for (let tries = 0; taken.has(slot) && tries < slots; tries += 1) slot = (slot + 1) % slots;
    if (taken.size < slots) taken.add(slot);
    else slot = getColorIndex(key, slots);
    placed.set(key, slot);
  }
  return placed;
}
