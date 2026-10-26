import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { CopyButton } from '../copy-button/copy-button.js';
import { InlineEdit } from '../inline-edit/inline-edit.js';
import { MetaLine } from '../meta-line/meta-line.js';
import { RecordLabel } from '../record-label/record-label.js';
import { useHeadingLevel } from '../section-header/section-header.js';
const hooks = createHooks('record-header', [
    'identity',
    'label',
    'copy',
    'title',
    'status',
    'meta',
    'actions',
]);
/**
 * A record's title row: its kind icon and identifier with a copy button, its title, editable in
 * place, its state, a line of metadata and its actions.
 */
export function RecordHeader({ identifier, icon, title, onTitleChange, titlePlaceholder, headingLevel, status, meta, actions, className, id, ...rest }) {
    const strings = useUiStrings();
    const level = useHeadingLevel(headingLevel);
    const Heading = `h${level}`;
    return (_jsxs("div", { id: id, ...hooks.root({ className, props: rest, data: { editable: !!onTitleChange } }), children: [_jsxs("div", { ...hooks.slot('identity'), children: [_jsx(RecordLabel, { identifier: identifier, icon: icon, size: "sm", className: hooks.slotClass('label') }), _jsx(CopyButton, { value: identifier, label: strings.copyIdentifier(identifier), size: "sm", className: hooks.slotClass('copy') })] }), onTitleChange ? (_jsx("div", { role: "heading", "aria-level": level, "aria-label": title === '' ? undefined : title, ...hooks.slot('title'), children: _jsx(InlineEdit, { label: strings.recordTitle, value: title, onSave: onTitleChange, placeholder: titlePlaceholder }) })) : (_jsx(Heading, { ...hooks.slot('title'), children: title })), isEmptyNode(status) ? null : _jsx("div", { ...hooks.slot('status'), children: status }), meta ? _jsx(MetaLine, { items: meta, className: hooks.slotClass('meta') }) : null, isEmptyNode(actions) ? null : _jsx("div", { ...hooks.slot('actions'), children: actions })] }));
}
//# sourceMappingURL=record-header.js.map