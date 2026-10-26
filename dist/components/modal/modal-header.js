import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Heading } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
const hooks = createHooks('modal', [
    'header',
    'heading',
    'title',
    'description',
    'header-actions',
    'close',
]);
/** The header row: the title and description, caller content, then an optional close button. */
export function ModalHeader({ title, description, descriptionId, headerActions, showCloseButton, isDismissDisabled, onClose, }) {
    const strings = useUiStrings();
    return (_jsxs("div", { ...hooks.slot('header'), children: [_jsxs("div", { ...hooks.slot('heading'), children: [_jsx(Heading, { slot: "title", className: hooks.slotClass('title'), children: title }), isEmptyNode(description) ? null : (_jsx("p", { ...hooks.slot('description'), id: descriptionId, children: description }))] }), isEmptyNode(headerActions) ? null : (_jsx("div", { ...hooks.slot('header-actions'), children: headerActions })), showCloseButton ? (_jsx(Button, { icon: "close", label: strings.close, className: hooks.slotClass('close'), isDisabled: isDismissDisabled, onPress: onClose })) : null] }));
}
//# sourceMappingURL=modal-header.js.map