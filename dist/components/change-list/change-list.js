import { jsx as _jsx } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Attribution } from '../attribution/attribution.js';
import { DescriptionList, DescriptionRow, } from '../description-list/description-list.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { ChangeValues, changeListHooks as hooks, } from './change-values.js';
import { resolveChangeKind } from './list-changes.js';
const showText = (value) => value;
/**
 * What changed in a record, one row per property: its label and its old → new value, drawn per
 * value type (a word diff of text, the items added to and removed from a list, or the two values),
 * with who changed it and when.
 */
export function ChangeList({ changes, variant = 'compact', renderValue = showText, renderEmptyState, showAvatar, fallbackAfterDays, getNow, className, ...rest }) {
    const strings = useUiStrings();
    if (changes.length === 0) {
        return renderEmptyState ? (renderEmptyState()) : (_jsx(EmptyState, { size: "sm", description: strings.noChanges }));
    }
    return (_jsx(DescriptionList, { ...rest, ...hooks.root({ className, props: rest, data: { variant } }), layout: variant === 'compact' ? 'inline' : 'stacked', children: changes.map((change) => {
            const type = change.type ?? 'value';
            const hasAttribution = Boolean(change.time) || change.person !== undefined;
            return (_jsx(DescriptionRow, { label: change.label, className: hooks.slotClass('change'), "data-change": resolveChangeKind(change.before, change.after), "data-type": type, secondary: hasAttribution ? (_jsx(Attribution, { time: change.time, person: change.person, showAvatar: showAvatar, fallbackAfterDays: fallbackAfterDays, getNow: getNow, className: hooks.slotClass('attribution') })) : null, children: _jsx(ChangeValues, { type: type, before: change.before, after: change.after, variant: variant, renderValue: renderValue }) }, toKeyIdentity(change.id)));
        }) }));
}
//# sourceMappingURL=change-list.js.map