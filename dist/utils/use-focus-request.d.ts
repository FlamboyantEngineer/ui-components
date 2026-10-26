/** Finds the element a focus request moves focus to, once the edit that asked for it has rendered. */
export type FocusRequestTarget = () => HTMLElement | null | undefined;
/**
 * Returns `request(target)`, which moves focus to the element `target` finds after the next render,
 * for editors that add, remove or move the element being edited. An edit made from a menu runs
 * while the menu still makes the rest of the page inert, and a collection may move its rows a frame
 * after the edit, so focus is retried on the next frames until the element holds it.
 */
export declare function useFocusRequest(): (target: FocusRequestTarget) => void;
//# sourceMappingURL=use-focus-request.d.ts.map