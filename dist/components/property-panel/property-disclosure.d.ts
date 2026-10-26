import type { Key } from '../../core/props.js';
/** Whether a section or card is open, which the caller may control. */
export interface PropertyExpansionProps {
    /** Whether it is open, controlled. */
    isExpanded?: boolean | undefined;
    /** Whether it starts open, uncontrolled. */
    defaultExpanded?: boolean | undefined;
    /** Called when it opens or closes. */
    onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
}
export interface ScopedExpansionOptions {
    /** Whether a query is active. */
    isFiltering: boolean;
    /** Whether the part is expanded while a query is active. */
    isExpandedWhileFiltering: boolean;
    isExpanded?: boolean | undefined;
    defaultExpanded: boolean;
    onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
    /** Remembers an uncontrolled state through the provider storage under this key. */
    persistKey?: string | undefined;
}
export interface ScopedExpansion {
    isExpanded: boolean;
    onExpandedChange: (isExpanded: boolean) => void;
}
/**
 * Disclosure state for a part that follows its caller, its stored value or the user, and that a
 * query opens: while one is active the part shows `isExpandedWhileFiltering` and ignores presses,
 * and the state the user chose returns when the query clears.
 */
export declare function useScopedExpansion({ isFiltering, isExpandedWhileFiltering, isExpanded, defaultExpanded, onExpandedChange, persistKey, }: ScopedExpansionOptions): ScopedExpansion;
/**
 * A section's disclosure state: while the panel opens and closes its sections (React Aria's
 * disclosure group), the panel's state for the key `id` (a generated key without one), which a
 * query still overrides; otherwise the section's own, as `useScopedExpansion` keeps it.
 */
export declare function useSectionExpansion({ id, isExpanded, onExpandedChange, persistKey, ...options }: ScopedExpansionOptions & {
    id: Key | undefined;
}): ScopedExpansion;
/** The mark of a section or card that holds a property overriding an inherited value. */
export declare function OverrideMark({ className }: {
    className: string;
}): import("react").JSX.Element;
//# sourceMappingURL=property-disclosure.d.ts.map