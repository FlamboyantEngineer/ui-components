/** Whether a callback returned a promise, or any object with a `then`, to wait for. */
export function isThenable<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
  return typeof (value as PromiseLike<unknown> | null | undefined)?.then === 'function';
}

/**
 * Calls a host callback that may answer now or with a promise: a synchronous throw comes back as a
 * rejected promise, so the caller settles it as it settles a rejection.
 */
export function callSettling<T>(call: () => T | PromiseLike<T>): T | PromiseLike<T> {
  try {
    return call();
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}
