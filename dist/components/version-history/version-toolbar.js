import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Switch } from '../switch/switch.js';
import { versionHistoryHooks as hooks } from './version-row.js';
/** The person filter's key for everyone's versions; a person's name is never empty. */
const anyoneKey = '';
/** Chooses whose versions to show. */
function PersonFilter({ filter, people, onFilterChange, }) {
    const strings = useUiStrings();
    const items = [
        { id: anyoneKey, label: strings.anyone },
        ...people.map((name) => ({ id: name, label: name })),
    ];
    return (_jsx(DropdownMenu, { label: strings.versionsBy(filter.person), variant: "ghost", size: "sm", icon: "users", className: hooks.slotClass('person'), items: items, selectionMode: "single", selectedKeys: [filter.person ?? anyoneKey], disallowEmptySelection: true, onSelectionChange: (keys) => {
            const key = keys === 'all' ? undefined : [...keys][0];
            if (key !== undefined)
                onFilterChange({ ...filter, person: key === anyoneKey ? null : String(key) });
        } }));
}
/** The filters (named versions only, and by person) and the compare action, when shown. */
export function VersionToolbar({ filter, onFilterChange, people, onCompare, canCompare, }) {
    const strings = useUiStrings();
    return (_jsxs("div", { ...hooks.slot('toolbar'), children: [filter ? (_jsxs(_Fragment, { children: [_jsx(Switch, { size: "sm", className: hooks.slotClass('named-only'), isSelected: filter.namedOnly, onChange: (namedOnly) => onFilterChange({ ...filter, namedOnly }), children: strings.namedVersionsOnly }), _jsx(PersonFilter, { filter: filter, people: people, onFilterChange: onFilterChange })] })) : null, onCompare ? (_jsx(Button, { size: "sm", className: hooks.slotClass('compare'), isDisabled: !canCompare, onPress: onCompare, children: strings.compareVersions })) : null] }));
}
//# sourceMappingURL=version-toolbar.js.map