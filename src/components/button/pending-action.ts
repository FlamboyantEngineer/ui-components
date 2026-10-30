export type PendingAction = (() => unknown) | undefined;

/**
 * Runs `action` unless `blocked`, keeping `setPending(true)` until it settles. Resolves to whether the
 * action ran. A rejection reaches `onError`, or is rethrown.
 */
export async function runPendingAction(options: {
  blocked: boolean;
  setPending: (pending: boolean) => void;
  action?: PendingAction;
  onError?: ((error: unknown) => void) | undefined;
}): Promise<boolean> {
  if (options.blocked) return false;
  options.setPending(true);
  try {
    await options.action?.();
    return true;
  } catch (error) {
    if (options.onError) {
      options.onError(error);
      return false;
    }
    throw error;
  } finally {
    options.setPending(false);
  }
}
