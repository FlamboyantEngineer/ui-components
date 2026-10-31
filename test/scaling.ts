/**
 * The time a call takes, in milliseconds. Scaling tests give inputs on which quadratic work takes
 * many seconds, so a budget of about a second separates linear from quadratic on any machine.
 */
export function measure(run: () => unknown): number {
  const start = performance.now();
  run();
  return performance.now() - start;
}

/** A budget far above linear time and far below quadratic time for the scaling inputs. */
export const linearBudget = 2500;
