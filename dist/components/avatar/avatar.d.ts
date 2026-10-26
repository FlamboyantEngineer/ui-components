import { type ReactNode } from 'react';
import type { BaseProps, NativeProps, Size } from '../../core/props.js';
import type { PressEvent } from '../../core/events.js';
import type { UserCardTriggerType } from '../user-card/user-card.js';
/** Circle size. `fill` takes the whole box its container gives it. */
export type AvatarSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'> | 'fill';
/** `filled` sets initials on the colour slot; `outlined` rings the circle and leaves the ground to the host. */
export type AvatarVariant = 'filled' | 'outlined';
/** A group draws a decorative group glyph instead of a picture or initials. */
export type AvatarKind = 'person' | 'group';
/** `circle` for people; `rounded` or `square` for bots, organisations and groups. */
export type AvatarShape = 'circle' | 'rounded' | 'square';
/** No picture to load (`idle`), or the picture is loading, has loaded or has failed. */
export type AvatarLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';
/** Attributes for the picture's `<img>` besides its address. */
export type AvatarImageProps = Pick<NativeProps<'img'>, 'srcSet' | 'sizes' | 'crossOrigin' | 'referrerPolicy' | 'loading'>;
/** The identity fields every component that draws an avatar accepts and hands to it unchanged. */
export interface AvatarIdentity {
    /** Display name. The initials, the derived colour and the accessible name come from it. */
    name: string;
    /** Picture URL. A picture that fails to load falls back to the initials. */
    src?: string | undefined;
    /** The picture's `srcSet`, `sizes`, `crossOrigin`, `referrerPolicy` and `loading` attributes. */
    imageProps?: AvatarImageProps | undefined;
    /** Initials to show instead of the ones derived from `name`. */
    initials?: string | undefined;
    /** Stable key for the derived colour, such as an id, so a renamed person keeps their colour. Defaults to `name`. */
    colorKey?: string | undefined;
    /** An explicit colour slot, wrapped into the palette. Wins over the derived slot. */
    colorIndex?: number | undefined;
    /** Defaults to `person`. */
    kind?: AvatarKind | undefined;
    /** Defaults to `circle`. */
    shape?: AvatarShape | undefined;
}
export interface AvatarProps extends AvatarIdentity, BaseProps {
    /** Optional presence status, such as active, away, busy or idle. */
    status?: string | undefined;
    /** Human-readable status added to the accessible name. */
    statusLabel?: string | undefined;
    /** Makes the avatar a pressable command. */
    onPress?: ((event: PressEvent) => void) | undefined;
    /** A person card opened by this avatar. */
    card?: ReactNode;
    /** Defaults to press; hover also opens on keyboard focus. */
    cardTrigger?: UserCardTriggerType | undefined;
    /** Shows the accessible name in a tooltip, also reachable with the keyboard. */
    nameTooltip?: boolean | undefined;
    /** Defaults to `md`. */
    size?: AvatarSize | undefined;
    /** Defaults to `filled`. */
    variant?: AvatarVariant | undefined;
    /** How many colour slots the host stylesheet defines. Defaults to `DEFAULT_AVATAR_COLOR_COUNT`. */
    colorCount?: number | undefined;
    /** Accessible name, when it should say more than `name` (`Maria Santos, Away`). Defaults to `name`. */
    label?: string | undefined;
    /** Hide the avatar from assistive technology when visible text next to it already names the person. */
    decorative?: boolean | undefined;
    /** Called with the picture's loading status, first on mount and then whenever it changes. */
    onLoadingStatusChange?: ((status: AvatarLoadingStatus) => void) | undefined;
}
/** The number of colour slots a derived colour is spread over unless `colorCount` says otherwise. */
export declare const DEFAULT_AVATAR_COLOR_COUNT = 8;
/** The name a person is shown and announced by: the trimmed `name`, or `unnamed` when it is blank. */
export declare function getDisplayName(name: string, unnamed: string): string;
/** Splits a component's props into the avatar identity fields, to hand to an avatar, and the rest. */
export declare function splitAvatarIdentity<P extends AvatarIdentity>(props: P): [AvatarIdentity, Omit<P, keyof AvatarIdentity>];
/**
 * The colour slot an avatar publishes: the explicit `colorIndex` wrapped into the palette, otherwise
 * the slot derived from `colorKey` (or `name` when the key is blank). Groups have no derived colour.
 */
export declare function resolveAvatarColor(identity: Pick<AvatarIdentity, 'name' | 'colorKey' | 'colorIndex' | 'kind'>, colorCount?: number): number | undefined;
/** A person's picture, or their initials on a stable colour slot; a group glyph for a group. */
export declare function Avatar(props: AvatarProps): import("react").JSX.Element;
//# sourceMappingURL=avatar.d.ts.map