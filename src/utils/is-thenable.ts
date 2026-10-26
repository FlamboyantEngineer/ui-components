/** Whether a callback returned a promise, or any object with a `then`, to wait for. */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown> | null | undefined)?.then === 'function';
}
