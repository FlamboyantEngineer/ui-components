/**
 * State that belongs to `owner`, such as the comparison a view draws: the value last set while
 * `owner` stays the same object, and `initial` again once it is a different one.
 */
export declare function useStateFor<T>(owner: unknown, initial: T): [T, (value: T) => void];
//# sourceMappingURL=use-state-for.d.ts.map