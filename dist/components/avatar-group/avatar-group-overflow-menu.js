import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { getDisplayName, splitAvatarIdentity } from '../avatar/avatar.js';
import { Menu, MenuItem, MenuPopover, MenuTrigger } from '../menu/menu.js';
import { UserIdentity } from '../user-identity/user-identity.js';
const hooks = createHooks('avatar-group', ['overflow', 'menu']);
/** The `+N` count as a button that opens a menu of the people it hides. */
export function AvatarGroupOverflowMenu({ count, label, hidden, colorCount, onAction, }) {
    const strings = useUiStrings();
    const ids = new Map(hidden.map(({ key, value }) => [key, value.id]));
    return (_jsxs(MenuTrigger, { children: [_jsx(AriaButton, { ...hooks.slot('overflow'), "aria-label": label, children: `+${count}` }), _jsx(MenuPopover, { placement: "bottom start", children: _jsx(Menu, { className: hooks.slotClass('menu'), "aria-label": strings.morePeople(count, []), onAction: (key) => {
                        const id = ids.get(String(key));
                        if (id !== undefined)
                            onAction?.(id);
                    }, children: hidden.map(({ key, value }) => {
                        const [identity] = splitAvatarIdentity(value);
                        // Named by its content: the name, then the status badge's label.
                        return (_jsx(MenuItem, { id: key, textValue: getDisplayName(value.name, strings.unnamed), children: () => (_jsx(UserIdentity, { ...identity, colorCount: colorCount, size: "sm", status: value.status, statusLabel: value.statusLabel })) }, key));
                    }) }) })] }));
}
//# sourceMappingURL=avatar-group-overflow-menu.js.map