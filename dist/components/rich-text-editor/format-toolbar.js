import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks, mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { ToolbarRow, ToolbarRowSeparator } from '../layout/layout.js';
import { BlockTypeSelect, FormatButtons, LinkButton } from './format-controls.js';
import { getHistoryItems, getMarkItems, getWrapItems } from './format-items.js';
import { useRichTextController } from './rich-text-controller.js';
import { useFocusReturn } from './use-focus-return.js';
const hooks = createHooks('format-toolbar', ['block-type', 'link-editor']);
/**
 * The formatting toolbar of the enclosing `RichTextEditor`, for its `toolbar` slot: undo and redo,
 * the block type, the marks, the link and the lists and quote, each reflecting the selection.
 * Commands the schema lacks are left out.
 */
export function FormatToolbar({ className, children, ...rest }) {
    const strings = useUiStrings();
    const controller = useRichTextController();
    const focusReturn = useFocusReturn(controller);
    const label = rest['aria-labelledby']
        ? undefined
        : (rest['aria-label'] ?? strings.textFormatting);
    return (_jsxs(ToolbarRow, { ...rest, "aria-label": label, className: mergeClassNames(hooks.className, className), justify: "start", space: "xs", ref: focusReturn.ref, children: [_jsx(FormatButtons, { controller: controller, items: getHistoryItems(strings) }), _jsx(ToolbarRowSeparator, {}), _jsx(BlockTypeSelect, { controller: controller, className: hooks.slotClass('block-type'), onCommand: focusReturn.request }), _jsx(ToolbarRowSeparator, {}), _jsx(FormatButtons, { controller: controller, items: getMarkItems(strings) }), controller.supports({ type: 'set-link', href: null }) ? (_jsx(LinkButton, { controller: controller, className: hooks.slotClass('link-editor'), onCommand: focusReturn.request })) : null, _jsx(ToolbarRowSeparator, {}), _jsx(FormatButtons, { controller: controller, items: getWrapItems(strings) }), children] }));
}
//# sourceMappingURL=format-toolbar.js.map