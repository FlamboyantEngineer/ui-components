import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { getColorIndex } from '../../utils/color-index.js';
import { getInitials } from '../../utils/initials.js';
import { toImageProps } from '../icon/icon.js';
import { AvatarRoot } from './avatar-root.js';
import { Tooltip } from '../tooltip/tooltip.js';
/** The number of colour slots a derived colour is spread over unless `colorCount` says otherwise. */
export const DEFAULT_AVATAR_COLOR_COUNT = 8;
const hooks = createHooks('avatar', ['image', 'initials', 'glyph', 'surface', 'indicator']);
function paletteSize(colorCount) {
    return colorCount !== undefined && Number.isFinite(colorCount) && colorCount >= 1
        ? Math.trunc(colorCount)
        : DEFAULT_AVATAR_COLOR_COUNT;
}
/** The picture an identity draws: its trimmed `src`, or none for a group or a blank address. */
function pictureOf({ src, kind }) {
    return kind === 'group' ? '' : (src?.trim() ?? '');
}
/** Tracks whether `picture` has loaded or failed; a different address starts loading afresh. */
function useAvatarPicture(picture, onLoadingStatusChange) {
    const [settled, setSettled] = useState(null);
    const status = picture === '' ? 'idle' : settled?.src === picture ? settled.status : 'loading';
    const settle = useCallback((next) => setSettled((previous) => previous?.src === picture && previous.status === next
        ? previous
        : { src: picture, status: next }), [picture]);
    // A picture the browser already holds, such as one loaded before hydration, may fire no load
    // event to the handler.
    const imageRef = useCallback((image) => {
        if (image?.complete && image.naturalWidth > 0)
            settle('loaded');
    }, [settle]);
    const reported = useRef(null);
    useEffect(() => {
        if (reported.current === status)
            return;
        reported.current = status;
        onLoadingStatusChange?.(status);
    });
    return { status, settle, imageRef };
}
/** The group glyph, the picture, or the initials without a picture or once it has failed. */
function AvatarContent({ identity, picture, }) {
    const { name, src, imageProps, initials, kind } = identity;
    if (kind === 'group')
        return _jsx(Glyph, { name: "users", className: hooks.slotClass('glyph') });
    if (picture.status === 'loading' || picture.status === 'loaded') {
        return (_jsx("img", { ...imageProps, ...hooks.slot('image'), ref: picture.imageRef, src: src?.trim(), alt: "", onLoad: () => picture.settle('loaded'), onError: () => picture.settle('error') }));
    }
    return (_jsx("span", { ...hooks.slot('initials'), "aria-hidden": "true", children: initials?.trim() || getInitials(name) }));
}
/** The name a person is shown and announced by: the trimmed `name`, or `unnamed` when it is blank. */
export function getDisplayName(name, unnamed) {
    return name.trim() || unnamed;
}
/** Splits a component's props into the avatar identity fields, to hand to an avatar, and the rest. */
export function splitAvatarIdentity(props) {
    const { name, src, imageProps, initials, colorKey, colorIndex, kind, shape, ...rest } = props;
    return [{ name, src, imageProps, initials, colorKey, colorIndex, kind, shape }, rest];
}
/**
 * The colour slot an avatar publishes: the explicit `colorIndex` wrapped into the palette, otherwise
 * the slot derived from `colorKey` (or `name` when the key is blank). Groups have no derived colour.
 */
export function resolveAvatarColor(identity, colorCount) {
    const slots = paletteSize(colorCount);
    const { colorIndex } = identity;
    if (colorIndex !== undefined && Number.isFinite(colorIndex)) {
        return ((Math.trunc(colorIndex) % slots) + slots) % slots;
    }
    if (identity.kind === 'group')
        return undefined;
    const key = identity.colorKey?.trim() ? identity.colorKey : identity.name;
    return getColorIndex(key, slots);
}
/** The full name, including optional status, is shared by the root and its name tooltip. */
function useAvatarPresentation(props) {
    const strings = useUiStrings();
    const displayName = getDisplayName(props.name, strings.unnamed);
    const accessibleName = props.label?.trim() ||
        (props.statusLabel?.trim()
            ? strings.nameWithStatus(displayName, props.statusLabel.trim())
            : displayName);
    return {
        accessibleName,
        surfaceProps: toImageProps(props.card || props.onPress ? accessibleName : undefined),
        hasTooltip: props.nameTooltip && !(props.card && props.cardTrigger === 'hover'),
    };
}
/** A person's picture, or their initials on a stable colour slot; a group glyph for a group. */
export function Avatar(props) {
    const [identity, { size = 'md', variant = 'filled', colorCount, label, decorative, onLoadingStatusChange, status, statusLabel, onPress, card, cardTrigger, nameTooltip, className, ...rest },] = splitAvatarIdentity(props);
    const picture = useAvatarPicture(pictureOf(identity), onLoadingStatusChange);
    const color = resolveAvatarColor(identity, colorCount);
    const { accessibleName, hasTooltip, surfaceProps } = useAvatarPresentation({
        name: identity.name,
        label,
        statusLabel,
        nameTooltip,
        card,
        cardTrigger,
        onPress,
    });
    const element = (_jsxs(AvatarRoot, { ...rest, ...hooks.root({
            className,
            data: {
                size,
                variant,
                kind: identity.kind ?? 'person',
                shape: identity.shape ?? 'circle',
                color,
                loading: picture.status === 'loading',
                status: status?.trim() || undefined,
            },
        }), imageLabel: decorative ? undefined : accessibleName, onPress: onPress, card: card, cardTrigger: cardTrigger, isFocusable: Boolean(hasTooltip), "aria-describedby": hasTooltip ? '' : undefined, children: [_jsx("span", { ...hooks.slot('surface'), ...surfaceProps, children: _jsx(AvatarContent, { identity: identity, picture: picture }) }), status?.trim() ? _jsx("span", { ...hooks.slot('indicator'), "aria-hidden": "true" }) : null] }));
    return hasTooltip ? _jsx(Tooltip, { content: accessibleName, children: element }) : element;
}
//# sourceMappingURL=avatar.js.map