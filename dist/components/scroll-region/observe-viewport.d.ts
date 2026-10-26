export interface ViewportObserverOptions {
    /** Reads the layout; called at most once per animation frame. */
    measure: () => void;
    /** Elements watched besides the viewport and its children, read again on every content change. */
    getExtraTargets?: (() => Iterable<Element | null>) | undefined;
    /** Watch content changes anywhere inside the viewport, not only its children. */
    subtree?: boolean | undefined;
}
export interface ViewportObserver {
    /** Schedules a measurement for the next animation frame. */
    schedule: () => void;
    /** Watches the current set of elements again and schedules a measurement. */
    observe: () => void;
    disconnect: () => void;
}
/**
 * Observes `element` with the observers of its window `view`. Without `ResizeObserver`, content
 * changes and explicit `schedule` calls still remeasure.
 */
export declare function observeViewport(element: HTMLElement, view: Window & typeof globalThis, { measure, getExtraTargets, subtree }: ViewportObserverOptions): ViewportObserver;
//# sourceMappingURL=observe-viewport.d.ts.map