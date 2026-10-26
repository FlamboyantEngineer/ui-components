import { type KeyedValue } from '../../utils/stable-keys.js';
import type { AvatarGroupProps, AvatarGroupPerson } from './avatar-group.js';
/** The people a strip shows and how many more it counts. */
export interface AvatarGroupWindow {
    visible: Array<KeyedValue<AvatarGroupPerson>>;
    hidden: Array<KeyedValue<AvatarGroupPerson>>;
    overflow: number;
}
type AvatarGroupWindowOptions = Pick<AvatarGroupProps, 'people' | 'maxVisible' | 'overflowCount'>;
interface PresenceLabelOptions extends Pick<AvatarGroupProps, 'people' | 'hiddenNames'>, Omit<AvatarGroupWindow, 'visible'> {
    ariaLabel: string | undefined;
}
export declare function windowPeople({ people, maxVisible, overflowCount, }: AvatarGroupWindowOptions): AvatarGroupWindow;
/** The group's name and the overflow's name, with blank names read as the `unnamed` string. */
export declare function usePresenceLabels({ people, hiddenNames, ariaLabel, hidden, overflow, }: PresenceLabelOptions): {
    group: string;
    overflow: string;
};
export {};
//# sourceMappingURL=avatar-group-window.d.ts.map