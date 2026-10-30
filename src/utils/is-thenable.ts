/** Whether a callback returned a promise, or any object with a `then`, to wait for. */
export function isThenable<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
  return typeof (value as PromiseLike<unknown> | null | undefined)?.then === 'function';
}
