import { type Ref, type RefCallback, type RefObject } from 'react';
/**
 * A ref object for a component's own use, and the ref callback to put on its element, which also
 * hands the element to the caller's `ref` (running a React 19 callback ref's cleanup on detach).
 */
export declare function useForwardedRef<T>(ref: Ref<T> | undefined): [RefObject<T | null>, RefCallback<T>];
//# sourceMappingURL=use-forwarded-ref.d.ts.map