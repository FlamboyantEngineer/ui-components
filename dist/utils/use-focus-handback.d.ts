export interface FocusHandback {
    /** Asks for the hand-back the next time the trigger gets focus back, shortly after. */
    request: () => void;
    /** For the trigger, or an element around it. */
    ref: (element: HTMLElement | null) => (() => void) | undefined;
}
/**
 * Hands focus on to an editor after a choice in a menu, select or popover. Those overlays keep
 * focus inside while open and give it back to their trigger once they close, so after `request`
 * `focus` runs when the trigger (or the element under `ref`) gets focus back shortly after.
 */
export declare function useFocusHandback(focus: () => void): FocusHandback;
//# sourceMappingURL=use-focus-handback.d.ts.map