import { type ReactNode } from 'react';
export interface ProjectionProviderProps {
    /** The content that publishes to and renders the slots. */
    children?: ReactNode;
    /**
     * The only slots this provider owns. Content and outlets of other slots below it reach the
     * enclosing provider, as if this one were not there. Without it the provider owns every slot.
     */
    slots?: readonly string[] | undefined;
}
export interface ProjectionContentProps {
    /** The slot name an outlet renders. */
    slot: string;
    /** The content the slot's outlet renders. */
    children?: ReactNode;
}
export interface ProjectionOutletProps {
    /** The slot name to render. */
    slot: string;
    /** Rendered while the slot has no content. */
    fallback?: ReactNode;
}
/** Owns the named slots that `ProjectionContent` publishes to and `ProjectionOutlet` renders. */
export declare function ProjectionProvider({ slots, children }: ProjectionProviderProps): import("react").JSX.Element;
/**
 * Declares content for a named slot. It renders nothing in place: the slot's outlet renders it.
 * Without a provider above, it renders its children in place.
 */
export declare function ProjectionContent({ slot, children }: ProjectionContentProps): import("react").JSX.Element | null;
/**
 * The content of the most recently mounted `ProjectionContent` for `slot`, or `undefined` while the
 * slot has none, so a component can leave out the element that would hold it.
 */
export declare function useProjectedContent(slot: string): ReactNode;
/** Renders the content of the most recently mounted `ProjectionContent` for its slot. */
export declare function ProjectionOutlet({ slot, fallback }: ProjectionOutletProps): import("react").JSX.Element;
//# sourceMappingURL=projection.d.ts.map