/** Whether a callback returned a promise, or any object with a `then`, to wait for. */
export function isThenable(value) {
    return typeof value?.then === 'function';
}
//# sourceMappingURL=is-thenable.js.map