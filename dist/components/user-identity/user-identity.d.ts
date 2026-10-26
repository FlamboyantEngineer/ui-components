import type { ReactNode } from 'react';
import type { BaseProps, Size } from '../../core/props.js';
import { type AvatarIdentity, type AvatarProps } from '../avatar/avatar.js';
export type UserIdentitySize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
export interface UserIdentityProps extends AvatarIdentity, Pick<AvatarProps, 'colorCount'>, BaseProps {
    /** A secondary line under the name: an email, a role, a timestamp. Blank values draw no line. */
    description?: ReactNode;
    /** Content after the name on the same line, such as a badge. */
    nameSuffix?: ReactNode;
    /** Selects the avatar size. Defaults to `md`. */
    size?: UserIdentitySize | undefined;
    /** What the person is doing, as any word the host stylesheet knows (`active`, `away`, …). */
    status?: string | undefined;
    /** Human-readable status, which names the status badge for assistive technology. */
    statusLabel?: string | undefined;
}
/**
 * A decorative avatar, a display name, an optional secondary line and an optional status badge, for
 * rows that name a person.
 */
export declare function UserIdentity(props: UserIdentityProps): import("react").JSX.Element;
//# sourceMappingURL=user-identity.d.ts.map