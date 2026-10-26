import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toImageProps } from '../icon/icon.js';
import { Avatar, getDisplayName, splitAvatarIdentity, } from '../avatar/avatar.js';
const hooks = createHooks('user-identity', [
    'avatar',
    'content',
    'title',
    'name',
    'description',
    'indicator',
]);
function isBlankNode(node) {
    return isEmptyNode(node) || (typeof node === 'string' && node.trim() === '');
}
/**
 * A decorative avatar, a display name, an optional secondary line and an optional status badge, for
 * rows that name a person.
 */
export function UserIdentity(props) {
    const [identity, { description, nameSuffix, size = 'md', colorCount, status, statusLabel, className, ...rest },] = splitAvatarIdentity(props);
    const strings = useUiStrings();
    const statusValue = status?.trim() || undefined;
    return (_jsxs("span", { ...rest, ...hooks.root({ className, data: { size, status: statusValue } }), children: [_jsx(Avatar, { ...identity, colorCount: colorCount, size: size, decorative: true, className: hooks.slotClass('avatar') }), _jsxs("span", { ...hooks.slot('content'), children: [_jsxs("span", { ...hooks.slot('title'), children: [_jsx("span", { ...hooks.slot('name'), children: getDisplayName(identity.name, strings.unnamed) }), nameSuffix] }), isBlankNode(description) ? null : (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('description'), children: description })] }))] }), statusValue ? (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('indicator'), ...toImageProps(statusLabel?.trim() || undefined) })] })) : null] }));
}
//# sourceMappingURL=user-identity.js.map