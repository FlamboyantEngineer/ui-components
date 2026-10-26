import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { getFileGlyph } from '../../utils/file-glyph.js';
import { formatBytes } from '../../utils/format-bytes.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { InlineError } from '../inline-error/inline-error.js';
import { ProgressBar } from '../progress-bar/progress-bar.js';
export const fileUploadHooks = createHooks('file-upload', [
    'dropzone',
    'icon',
    'label',
    'description',
    'browse',
    'rejections',
    'error',
    'files',
    'file',
    'file-preview',
    'file-media',
    'file-icon',
    'file-name',
    'file-size',
    'file-progress',
    'file-error',
    'file-actions',
    'file-remove',
]);
const hooks = fileUploadHooks;
/** A listed file's status: failed, uploading, uploaded or only chosen. */
function getFileUploadStatus({ progress, error }) {
    if (error)
        return 'error';
    if (progress === undefined)
        return 'selected';
    return progress >= 100 ? 'complete' : 'uploading';
}
/** A temporary URL for an image file, revoked when the file changes or the row goes. */
function useImageUrl(file) {
    const [url, setUrl] = useState(undefined);
    useEffect(() => {
        if (!file?.type.startsWith('image/') || typeof URL.createObjectURL !== 'function') {
            setUrl(undefined);
            return undefined;
        }
        const created = URL.createObjectURL(file);
        setUrl(created);
        return () => URL.revokeObjectURL(created);
    }, [file]);
    return url;
}
/**
 * The caller's preview, else the thumbnail of an image file, else the glyph of the file's type. All
 * of them sit beside the file's name, so the built-in ones are decorative.
 */
function FilePreview({ item, renderFilePreview, }) {
    const url = useImageUrl(item.file) ?? item.previewUrl;
    const custom = renderFilePreview?.(item);
    if (!isEmptyNode(custom))
        return _jsx("div", { ...hooks.slot('file-media'), children: custom });
    if (url)
        return _jsx("img", { ...hooks.slot('file-preview'), src: url, alt: "" });
    return (_jsx(Icon, { glyph: getFileGlyph(item.type ?? item.file?.type), className: hooks.slotClass('file-icon') }));
}
function FileRow({ item, options }) {
    const strings = useUiStrings();
    const { locale, onRemove, renderFileActions } = options;
    const status = getFileUploadStatus(item);
    const actions = renderFileActions?.(item);
    return (_jsxs("li", { ...hooks.slot('file', { status, change: item.change }), children: [_jsx(FilePreview, { item: item, renderFilePreview: options.renderFilePreview }), _jsx("span", { ...hooks.slot('file-name'), children: item.name }), item.size === undefined ? null : (_jsx("span", { ...hooks.slot('file-size'), children: formatBytes(item.size, locale) })), status === 'uploading' ? (_jsx(ProgressBar, { className: hooks.slotClass('file-progress'), "aria-label": item.name, value: item.progress, size: "sm" })) : null, item.error ? (_jsx(InlineError, { className: hooks.slotClass('file-error'), children: item.error })) : null, isEmptyNode(actions) ? null : _jsx("span", { ...hooks.slot('file-actions'), children: actions }), onRemove ? (_jsx(Button, { className: hooks.slotClass('file-remove'), icon: "close", label: strings.removeItem(item.name), size: "sm", isDisabled: options.isDisabled, ref: (button) => options.removalFocus.register(item.id, button), onPress: () => {
                    options.removalFocus.willRemove(item.id);
                    onRemove(item.id);
                } })) : null] }));
}
/** The listed files, each with its preview, size, upload progress or error, actions and remove button. */
export function FileUploadFiles({ label, files, ...options }) {
    return (_jsx("ul", { ...hooks.slot('files'), "aria-label": label, children: files.map((item) => (_jsx(FileRow, { item: item, options: options }, toKeyIdentity(item.id)))) }));
}
//# sourceMappingURL=file-upload-files.js.map