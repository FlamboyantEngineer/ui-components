import { type ReactNode } from 'react';
import type { ComponentHooks, DataValues } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
/** Whether an activity part is open, which follows its progress until the reader chooses. */
export interface ActivityExpansionProps {
    /** Whether it is open (controlled); `undefined` leaves it to its progress and the reader. */
    isExpanded?: boolean | undefined;
    /** Opens or closes it from the start whatever its progress, as if the reader had chosen. */
    defaultExpanded?: boolean | undefined;
    /** Receives each state the reader requests, also while controlled. */
    onExpandedChange?: ((isExpanded: boolean) => void) | undefined;
    /** Opens on its own while the work goes on; without it, it stays closed until the reader opens it. Defaults to `true`. */
    expandsAutomatically?: boolean | undefined;
}
/** The slots the shared frame draws. */
export type ActivityDisclosureSlot = 'trigger' | 'indicator' | 'label' | 'spinner' | 'panel';
export interface ActivityDisclosureProps extends Omit<BaseProps, 'id'>, ActivityExpansionProps {
    /** The hooks of the part that renders the frame. */
    hooks: ComponentHooks<ActivityDisclosureSlot>;
    /** The work goes on: the panel opens on its own and a busy indicator shows. */
    isActive: boolean;
    /** Publishes `aria-busy` on the panel while its content is still coming in. */
    isPanelBusy?: boolean | undefined;
    /** The trigger's label, which also names the panel. */
    label: string;
    /** The part's hook values on its root. */
    data: DataValues;
    /** The panel's content. */
    children?: ReactNode;
}
/**
 * A React Aria disclosure without a heading: a trigger holding the indicator glyph, the label and,
 * while the work goes on, a decorative spinner; then the panel, a group named by the trigger.
 */
export declare function ActivityDisclosure({ hooks, isActive, isPanelBusy, label, data, isExpanded, defaultExpanded, onExpandedChange, expandsAutomatically, className, children, ...rest }: ActivityDisclosureProps): import("react").JSX.Element;
//# sourceMappingURL=activity-disclosure.d.ts.map