import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useId } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { HoverCard, HoverCardTrigger } from '../hover-card/hover-card.js';
import { Button } from '../button/button.js';
import { RecordLabelText } from './record-label.js';
import { TruncationTooltip } from '../truncation-tooltip/truncation-tooltip.js';
const hooks = createHooks('record-label', [
    'label',
    'preview',
    'header',
    'version',
    'type',
    'state',
    'name',
    'remove',
]);
/** The label, opening the preview from the link of an available record. */
function ChipLabel({ preview, href, unavailable, label, }) {
    if (preview === undefined || preview === null || href === undefined || unavailable)
        return label;
    return (_jsxs(HoverCardTrigger, { children: [label, _jsx(HoverCard, { className: hooks.slotClass('preview'), children: preview })] }));
}
/** The parts after the label that describe an available record, each after a space. */
function ChipDetails({ version, type, state, }) {
    const details = [
        ['version', version],
        ['type', type],
        ['state', state],
    ];
    return details.map(([slot, content]) => content ? (_jsxs(Fragment, { children: [' ', _jsx("span", { ...hooks.slot(slot), children: content })] }, slot)) : null);
}
/** The remove button, named by the record it removes. */
function ChipRemove({ identifier, unavailable, onRemove, }) {
    const strings = useUiStrings();
    const name = unavailable ? strings.recordUnavailable(unavailable) : identifier;
    return (_jsx(Button, { icon: "close", size: "xs", label: strings.removeItem(name), className: hooks.slotClass('remove'), onPress: onRemove }));
}
/**
 * An inline reference to a record: its label (icon, identifier and name), then the parts the caller
 * gives (version, kind, state), an optional remove button, and a preview on hover and focus. An
 * unavailable record shows only its label and the remove button.
 */
export function RecordChipParts({ identifier, name, icon, size = 'md', truncate, href, isExternal, unavailable, type, version, state, layout = 'inline', preview, onRemove, className, ...rest }) {
    const nameId = useId();
    const isStacked = layout === 'stacked' && !unavailable;
    const text = name?.trim();
    const label = (_jsx(RecordLabelText, { isChipLabel: true, identifier: identifier, icon: icon, size: size, truncate: truncate, href: href, isExternal: isExternal, unavailable: unavailable, name: isStacked ? undefined : text, "aria-describedby": isStacked && text ? nameId : undefined, className: hooks.slotClass('label') }));
    const parts = (_jsxs(_Fragment, { children: [_jsx(ChipLabel, { preview: preview, href: href, unavailable: unavailable, label: label }), unavailable ? null : _jsx(ChipDetails, { version: version, type: type, state: state }), onRemove ? (_jsx(ChipRemove, { identifier: identifier, unavailable: unavailable, onRemove: onRemove })) : null] }));
    const data = { mode: 'chip', layout: isStacked ? 'stacked' : 'inline', size, unavailable };
    return (_jsxs("span", { ...rest, ...hooks.root({ className, data }), children: [isStacked ? _jsx("span", { ...hooks.slot('header'), children: parts }) : parts, isStacked && text ? (_jsx(TruncationTooltip, { id: nameId, className: hooks.slotClass('name'), children: text })) : null] }));
}
//# sourceMappingURL=record-chip-parts.js.map