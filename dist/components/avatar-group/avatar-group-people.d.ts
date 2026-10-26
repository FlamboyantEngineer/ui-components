import type { AvatarGroupProps } from './avatar-group.js';
import type { AvatarGroupWindow } from './avatar-group-window.js';
/** The same people and overflow in stacked, spaced or decorative-dot layouts. */
export declare function AvatarGroupPeople({ presence, labels, layout, isList, overflow, ...avatar }: Pick<AvatarGroupProps, 'layout' | 'size' | 'variant' | 'colorCount' | 'onAction' | 'renderCard' | 'nameTooltip' | 'cardTrigger' | 'overflow'> & {
    presence: AvatarGroupWindow;
    labels: {
        overflow: string;
    };
    isList: boolean;
}): import("react").JSX.Element;
//# sourceMappingURL=avatar-group-people.d.ts.map