import type { ReactNode } from 'react';
import type { FieldControlProps, FieldState } from '../field/field.js';
import type { RelativeDateText } from './relative-date.js';
/** One preset of the list, with whether the field's bounds refuse it. */
export interface RelativePresetItem {
    id: string;
    label: string;
    isDisabled: boolean;
}
export interface PresetSelectProps {
    control: FieldControlProps;
    state: FieldState<unknown>;
    items: readonly RelativePresetItem[];
    text: RelativeDateText | null;
    placeholder: string;
    onPick: (id: string) => void;
    /** Drawn beside the presets in the popover, such as a calendar. */
    aside?: ReactNode;
    isOpen?: boolean | undefined;
    defaultOpen?: boolean | undefined;
    onOpenChange?: ((isOpen: boolean) => void) | undefined;
}
/**
 * The preset list: a select that never holds a choice, so picking the same preset again commits.
 * Only the open list picks; a locked field neither opens it nor reports opening. Its popover can
 * hold more beside the list, such as a calendar.
 */
export declare function PresetSelect({ control, state, items, text, placeholder, onPick, aside, isOpen, defaultOpen, onOpenChange, }: PresetSelectProps): import("react").JSX.Element;
//# sourceMappingURL=relative-date-select.d.ts.map