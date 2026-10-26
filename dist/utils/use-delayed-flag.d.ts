/** True once an active flag's delay elapses; an absent delay disables the timer. */
export declare function useDelayedFlag(isActive: boolean, delay: number | undefined): boolean;
/** An active flag held back until it has stayed active for `delay` milliseconds; at once without one. */
export declare function useActiveAfter(isActive: boolean, delay: number): boolean;
//# sourceMappingURL=use-delayed-flag.d.ts.map