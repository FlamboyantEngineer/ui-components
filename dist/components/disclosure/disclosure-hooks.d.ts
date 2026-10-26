import type { HeadingLevel } from '../section-header/section-header.js';
/** Where the trigger's indicator sits: before the title (`start`) or after it (`end`). */
export type DisclosureIndicatorPosition = 'start' | 'end';
/** What a disclosure hands its title and panel. */
export interface DisclosureParts {
    /** The title's heading level; the panel's content takes the levels below it. */
    level: HeadingLevel;
    indicatorPosition: DisclosureIndicatorPosition;
}
/** The hooks of the disclosure family, shared by its modules. */
export declare const disclosureHooks: import("../../core/hooks.js").ComponentHooks<"header" | "title" | "heading" | "trigger" | "panel" | "indicator">;
export declare const disclosureGroupHooks: import("../../core/hooks.js").ComponentHooks<never>;
/** The enclosing disclosure's heading level and indicator position. */
export declare const DisclosurePartsContext: import("react").Context<DisclosureParts>;
//# sourceMappingURL=disclosure-hooks.d.ts.map