import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { capitalizeText } from '../../utils/relative-time.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Attribution } from '../attribution/attribution.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { ListViewItem } from '../list-row/list-row.js';
import { formatVersionTime, isNamedVersion } from './version-model.js';
export const versionHistoryHooks = createHooks('version-history', [
    'toolbar',
    'named-only',
    'person',
    'compare',
    'list',
    'version',
    'label',
    'current',
    'attribution',
    'summary',
    'actions',
    'error',
]);
const hooks = versionHistoryHooks;
/** The version as a dialog target: its key, its title and its own name. */
export function toVersionTarget(version, context) {
    const label = version.label?.trim() ?? '';
    const title = label ||
        formatVersionTime(version.time, context.locale) ||
        capitalizeText(context.strings.unknownTime, context.locale);
    return { key: version.id, title, label };
}
/** The actions a version's menu offers. */
function listActions(version, context) {
    const { strings } = context;
    const actions = [];
    if (context.canRename) {
        const label = isNamedVersion(version) ? strings.renameVersion : strings.nameVersion;
        actions.push({ id: 'rename', label });
    }
    if (context.canRestore && version.id !== context.currentKey) {
        actions.push({ id: 'restore', label: strings.restoreVersion });
    }
    return actions;
}
/** One version as a row of the history's list view. */
export function renderVersionRow(version, context) {
    const { strings } = context;
    const target = toVersionTarget(version, context);
    const isCurrent = version.id === context.currentKey;
    const actions = version.isDisabled ? [] : listActions(version, context);
    return (_jsx(ListViewItem, { id: version.id, textValue: target.title, className: hooks.slotClass('version'), "data-named": isNamedVersion(version) || undefined, "data-current": isCurrent || undefined, title: _jsxs(_Fragment, { children: [_jsx("span", { ...hooks.slot('label'), children: target.title }), isCurrent ? _jsx("span", { ...hooks.slot('current'), children: strings.currentVersion }) : null] }), meta: _jsxs(_Fragment, { children: [_jsx(Attribution, { time: version.time, person: version.person, showAvatar: context.showAvatar, fallbackAfterDays: context.fallbackAfterDays, getNow: context.getNow, className: hooks.slotClass('attribution') }), isEmptyNode(version.summary) ? null : (_jsx("span", { ...hooks.slot('summary'), children: version.summary }))] }), trailing: actions.length > 0 ? (_jsx(DropdownMenu, { iconOnly: true, label: strings.versionActions(target.title), variant: "ghost", size: "sm", className: hooks.slotClass('actions'), items: actions, onAction: (key) => context.onAction(key, target) })) : null }, toKeyIdentity(version.id)));
}
//# sourceMappingURL=version-row.js.map