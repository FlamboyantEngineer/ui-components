import { type DisplayOptionsDensity, type DisplayOptionsProperty, type DisplayOptionsValue } from './display-options-model.js';
export interface DisplayOptionsSectionProps {
    properties: readonly DisplayOptionsProperty[];
    value: DisplayOptionsValue;
    onChange: (value: DisplayOptionsValue) => void;
}
export declare const displayOptionsHooks: import("../../core/hooks.js").ComponentHooks<"direction" | "visibility" | "sort" | "density" | "trigger" | "property" | "popover" | "properties" | "group-by" | "sort-by" | "properties-label" | "density-label">;
/** The property rows are grouped by, among those that allow grouping. */
export declare function GroupBySection({ properties, value, onChange }: DisplayOptionsSectionProps): import("react").JSX.Element | null;
/** The property rows are sorted by, among those that allow sorting, and the direction. */
export declare function SortSection({ properties, value, onChange }: DisplayOptionsSectionProps): import("react").JSX.Element | null;
/** The properties, each shown or hidden by its checkbox, in an order the reader changes by dragging. */
export declare function PropertiesSection({ properties, value, onChange }: DisplayOptionsSectionProps): import("react").JSX.Element;
/** Row spacing, among the densities offered. */
export declare function DensitySection({ densities, value, onChange, }: Omit<DisplayOptionsSectionProps, 'properties'> & {
    densities: readonly DisplayOptionsDensity[];
}): import("react").JSX.Element;
//# sourceMappingURL=display-options-sections.d.ts.map