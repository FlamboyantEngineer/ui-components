import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { splitAvatarIdentity } from '../avatar/avatar.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { UserIdentity } from '../user-identity/user-identity.js';
const hooks = createHooks('avatar-group', ['trigger', 'popover', 'list', 'item']);
function AvatarGroupList({ people, colorCount, }) {
    return (_jsx("ul", { ...hooks.slot('list'), children: people.map(({ key, value }) => {
            const [identity, { description }] = splitAvatarIdentity(value);
            return (_jsx("li", { ...hooks.slot('item'), children: _jsx(UserIdentity, { ...identity, colorCount: colorCount, size: "sm", description: description }) }, key));
        }) }));
}
/** Opens the full list from the non-interactive stack's content. */
export function AvatarGroupListTrigger({ people, colorCount, children, }) {
    const strings = useUiStrings();
    return (_jsxs(PopoverTrigger, { children: [_jsx(AriaButton, { ...hooks.slot('trigger'), children: children }), _jsx(Popover, { title: strings.peopleCount(people.length), placement: "bottom start", className: hooks.slotClass('popover'), children: _jsx(AvatarGroupList, { people: people, colorCount: colorCount }) })] }));
}
//# sourceMappingURL=avatar-group-list.js.map