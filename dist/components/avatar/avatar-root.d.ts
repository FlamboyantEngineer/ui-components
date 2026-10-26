import type { ReactNode } from 'react';
import type { BaseProps } from '../../core/props.js';
import type { AvatarProps } from './avatar.js';
interface AvatarRootProps extends BaseProps, Pick<AvatarProps, 'onPress' | 'card' | 'cardTrigger'> {
    imageLabel: string | undefined;
    isFocusable: boolean;
    'aria-describedby'?: string | undefined;
    children: ReactNode;
}
/** Interactive avatars use their root as the trigger, leaving the status dot outside the picture. */
export declare function AvatarRoot({ onPress, card, cardTrigger, imageLabel, isFocusable, children, ...rest }: AvatarRootProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=avatar-root.d.ts.map