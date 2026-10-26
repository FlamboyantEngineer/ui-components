/**
 * A value the caller may control. A defined `value` wins; otherwise the hook holds its own copy,
 * starting at `defaultValue`. Setting it updates the own copy only when uncontrolled, and reports
 * the change through `onChange` unless the new value is the current one (`Object.is`), as React
 * Aria's controlled state does.
 */
export declare function useControllableState<T>(value: T | undefined, defaultValue: T, onChange?: ((value: T) => void) | undefined): [T, (next: T) => void];
//# sourceMappingURL=controllable-state.d.ts.map