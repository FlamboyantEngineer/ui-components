type Wake = () => void;
/** Wakes `wake` once at `at` (epoch milliseconds); the returned function cancels it. */
export declare function subscribeClock(at: number, wake: Wake): () => void;
/** Renders the calling component again `delay` milliseconds from now, on the shared clock. */
export declare function useClockTick(delay: number | null): void;
export {};
//# sourceMappingURL=relative-time-clock.d.ts.map