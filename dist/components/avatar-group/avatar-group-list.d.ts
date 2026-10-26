import type { ReactNode } from 'react';
import type { KeyedValue } from '../../utils/stable-keys.js';
import type { AvatarGroupProps, AvatarGroupPerson } from './avatar-group.js';
/** Opens the full list from the non-interactive stack's content. */
export declare function AvatarGroupListTrigger({ people, colorCount, children, }: Pick<AvatarGroupProps, 'colorCount'> & {
    people: Array<KeyedValue<AvatarGroupPerson>>;
    children: ReactNode;
}): import("react").JSX.Element;
//# sourceMappingURL=avatar-group-list.d.ts.map