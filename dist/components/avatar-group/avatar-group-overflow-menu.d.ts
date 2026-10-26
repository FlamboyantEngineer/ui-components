import type { KeyedValue } from '../../utils/stable-keys.js';
import { type AvatarProps } from '../avatar/avatar.js';
import type { AvatarGroupPerson } from './avatar-group.js';
export interface AvatarGroupOverflowMenuProps extends Pick<AvatarProps, 'colorCount'> {
    /** The `+N` count. */
    count: number;
    /** Names the button: the count and the names it hides. */
    label: string;
    /** The people past `maxVisible`, keyed for the menu. */
    hidden: Array<KeyedValue<AvatarGroupPerson>>;
    /** Reports the chosen person's id. */
    onAction?: ((id: string) => void) | undefined;
}
/** The `+N` count as a button that opens a menu of the people it hides. */
export declare function AvatarGroupOverflowMenu({ count, label, hidden, colorCount, onAction, }: AvatarGroupOverflowMenuProps): import("react").JSX.Element;
//# sourceMappingURL=avatar-group-overflow-menu.d.ts.map