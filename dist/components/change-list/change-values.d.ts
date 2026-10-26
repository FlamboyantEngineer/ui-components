import type { ReactNode } from 'react';
/** How a change's values are compared and drawn. */
export type ChangeListValueType = 'text' | 'value' | 'list';
/** A property's value: a text, a list of texts, or nothing. */
export type ChangeListValue = string | readonly string[] | null | undefined;
export type ChangeListVariant = 'compact' | 'detailed';
/** Draws a plain value or a list item, such as a status in a badge. */
export type ChangeListValueRenderer = (value: string) => ReactNode;
export interface ChangeValuesProps {
    type: ChangeListValueType;
    before: ChangeListValue;
    after: ChangeListValue;
    variant: ChangeListVariant;
    renderValue: ChangeListValueRenderer;
}
export declare const changeListHooks: import("../../core/hooks.js").ComponentHooks<"caption" | "text" | "empty" | "attribution" | "items" | "item" | "arrow" | "change" | "side" | "old" | "new">;
/** A change's values in the variant's arrangement. */
export declare function ChangeValues(props: ChangeValuesProps): import("react").JSX.Element;
//# sourceMappingURL=change-values.d.ts.map