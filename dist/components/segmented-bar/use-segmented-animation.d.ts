export type SegmentedAnimationState = 'waiting' | 'running' | 'complete';
/** One entry sequence per mount; updates and later viewport entries keep the completed drawing. */
export declare function useSegmentedAnimation(element: Element | null, animated: boolean): SegmentedAnimationState;
//# sourceMappingURL=use-segmented-animation.d.ts.map