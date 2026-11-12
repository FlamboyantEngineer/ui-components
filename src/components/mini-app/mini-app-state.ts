import type { MiniAppState } from './mini-app-document.js';

// The mini-app's script shares the frame with the bridge and can post on the port directly, and a
// port carries structured clones, so a posted state may hold a `Map`, a `Date` or a cycle.

/** How deep a saved state may nest; a cycle or a deeper value is refused. */
const maxStateDepth = 64;

/** Whether a value is a plain object, from any realm: what `JSON.parse` would make. */
function isPlainRecord(value: object): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

/** Whether a posted value is a JSON value, nested no deeper than `maxStateDepth`. */
export function isMiniAppState(value: unknown, depth = 0): value is MiniAppState {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || depth >= maxStateDepth) return false;
  if (Array.isArray(value)) return value.every((item) => isMiniAppState(item, depth + 1));
  return (
    isPlainRecord(value) && Object.values(value).every((item) => isMiniAppState(item, depth + 1))
  );
}
