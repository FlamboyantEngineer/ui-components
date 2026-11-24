const maximumDelay = 2 ** 31 - 1;

/** A toast counts only its running time. Zero remaining is due. Null has no lifetime. */
export function createToastTimer(timeout: number, onExpire: () => void) {
  let remaining = timeout > 0 ? timeout : null;
  let deadline = 0;
  let handle: ReturnType<typeof setTimeout> | undefined;

  function pause() {
    if (handle === undefined) return;
    clearTimeout(handle);
    handle = undefined;
    remaining = Math.max(0, deadline - Date.now());
  }

  function resume() {
    if (handle !== undefined || remaining === null) return;
    const delay = Math.min(remaining, maximumDelay);
    const needsAnotherTimeout = delay < remaining;
    deadline = Date.now() + remaining;
    handle = setTimeout(() => {
      handle = undefined;
      if (needsAnotherTimeout) {
        remaining = Math.max(0, deadline - Date.now());
        resume();
        return;
      }
      remaining = null;
      onExpire();
    }, delay);
  }

  return {
    pause,
    resume,
    reset: (nextTimeout: number) => {
      pause();
      remaining = nextTimeout > 0 ? nextTimeout : null;
    },
  };
}
