import { type RefObject } from 'react';
/**
 * A ref holding the `value` of the latest committed render, for event handlers and effects that
 * must read it without re-rendering or re-subscribing when it changes.
 */
export declare function useLatest<T>(value: T): RefObject<T>;
//# sourceMappingURL=use-latest.d.ts.map