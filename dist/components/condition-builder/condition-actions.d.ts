export interface ConditionActionsProps {
    /** The rule's or the group's id. */
    id: string;
    /** Its position among its siblings. */
    index: number;
    /** How many siblings it has, itself included. */
    count: number;
}
/**
 * A rule's or a group's menu: move up, move down, duplicate and delete. Alt+Arrow Up and Alt+Arrow
 * Down on the menu button move the node without opening the menu.
 */
export declare function ConditionActions({ id, index, count }: ConditionActionsProps): import("react").JSX.Element;
//# sourceMappingURL=condition-actions.d.ts.map