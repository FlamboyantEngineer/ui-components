import type { BaseProps } from '../../core/props.js';
import type { UiStrings } from '../../core/strings.js';
import type { IconSource } from '../icon/icon.js';
import type { ButtonProps } from '../button/button.js';
import type { MenuEntry, MenuProps } from '../menu/menu.js';
/**
 * The standard verbs, in the order an action row draws them after its custom actions. Each verb has a
 * fixed glyph and a provider string for its label.
 */
export declare const actionVerbs: {
    readonly add: {
        readonly glyph: "plus";
        readonly label: "add";
    };
    readonly refresh: {
        readonly glyph: "refresh";
        readonly label: "refresh";
    };
    readonly more: {
        readonly glyph: "more";
        readonly label: "more";
    };
    readonly edit: {
        readonly glyph: "edit";
        readonly label: "edit";
    };
    readonly delete: {
        readonly glyph: "delete";
        readonly label: "delete";
    };
    readonly save: {
        readonly glyph: "save";
        readonly label: "save";
        readonly pendingLabel: "saving";
    };
    readonly cancel: {
        readonly glyph: "close";
        readonly label: "cancel";
    };
    readonly close: {
        readonly glyph: "close";
        readonly label: "close";
    };
};
export type ActionVerb = keyof typeof actionVerbs;
interface ActionRowActionBase extends Omit<BaseProps, 'className'>, Pick<ButtonProps, 'isDisabled' | 'isPending' | 'aria-controls' | 'aria-haspopup' | 'onPress'> {
    /** Tooltip text when it says more than the label (a shortcut, why the action is disabled). */
    tooltip?: string | undefined;
    /** A disclosure's state, published as `aria-expanded`. */
    isExpanded?: boolean | undefined;
    /**
     * The entries of a menu the action opens, as `Menu` takes them: items (with icons, descriptions,
     * shortcuts, tones and submenus), sections and separators. The button then opens the menu
     * instead of calling `onPress`, and the menu owns its popup attributes.
     */
    items?: readonly MenuEntry[] | undefined;
    /** Called with the id of the menu item chosen. */
    onAction?: MenuProps['onAction'];
}
/** A standard verb with its fixed glyph, label and place. */
export interface ActionRowVerbAction extends ActionRowActionBase {
    verb: ActionVerb;
    /** Replaces the verb's label, for example to name its subject ("Add comment"). */
    label?: string | undefined;
}
/** An action of the caller's own, drawn before the standard verbs in the order given. */
export interface ActionRowCustomAction extends ActionRowActionBase, Pick<ButtonProps, 'icon' | 'label' | 'isSelected' | 'ref'> {
    verb: 'custom';
    label: string;
}
export type ActionRowAction = ActionRowVerbAction | ActionRowCustomAction;
export interface ActionContent {
    icon: IconSource;
    label: string;
    pendingLabel?: string | undefined;
}
/** A custom action's own icon and label, or a verb's glyph and provider strings. */
export declare function toActionContent(action: ActionRowAction, strings: UiStrings): ActionContent;
/** Custom actions in their given order, then the standard verbs in their fixed order. */
export declare function orderActions<A extends ActionRowAction>(actions: readonly A[]): A[];
export {};
//# sourceMappingURL=action-verbs.d.ts.map