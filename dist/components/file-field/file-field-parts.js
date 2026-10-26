import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { FieldPreviousValue } from '../field/field.js';
import { Icon } from '../icon/icon.js';
import { Link } from '../link/link.js';
export const fileFieldHooks = createHooks('file-field', ['upload', 'download', 'removed']);
const hooks = fileFieldHooks;
/** A link that downloads a held file under its name. */
function FileDownloadLink({ item, href }) {
    const strings = useUiStrings();
    return (_jsx(Link, { className: hooks.slotClass('download'), href: href, download: item.name, "aria-label": strings.downloadFile(item.name), isStandalone: true, children: _jsx(Icon, { glyph: "download" }) }));
}
/**
 * A held file's actions: its download link, then the caller's. With neither it returns nothing, so
 * the upload draws no actions part.
 */
export function renderFileFieldActions(item, renderFileActions) {
    const custom = renderFileActions?.(item);
    if (!item.downloadUrl && isEmptyNode(custom))
        return null;
    return (_jsxs(_Fragment, { children: [item.downloadUrl ? _jsx(FileDownloadLink, { item: item, href: item.downloadUrl }) : null, custom] }));
}
/** The committed files an edit removed, each with a button that puts it back. */
export function RemovedFiles({ removed, isDisabled, onRestore, }) {
    return removed.map((item) => (_jsx(FieldPreviousValue, { className: hooks.slotClass('removed'), restoreLabel: item.name, isDisabled: isDisabled, onRestore: () => onRestore(item), children: item.name }, toKeyIdentity(item.id))));
}
/** Hidden inputs that submit each held file's id under the form name; a disabled field submits none. */
export function FileFieldInputs({ name, value, isDisabled, }) {
    return value.map((item) => (_jsx("input", { type: "hidden", name: name, value: item.id, disabled: isDisabled }, toKeyIdentity(item.id))));
}
//# sourceMappingURL=file-field-parts.js.map