import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { formatBytes } from '../../utils/format-bytes.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { Link } from '../link/link.js';
import { ProgressBar } from '../progress-bar/progress-bar.js';
export const chatAttachmentHooks = createHooks('chat-attachment', [
    'preview',
    'thumbnail',
    'icon',
    'name',
    'size',
    'progress',
    'error',
    'download',
    'remove',
]);
const hooks = chatAttachmentHooks;
/** The image to show, until it fails to load: a broken image falls back to the file chip. */
export function useThumbnail(src) {
    const [brokenSrc, setBrokenSrc] = useState(undefined);
    return {
        src: src === brokenSrc ? undefined : src,
        onError: () => setBrokenSrc(src),
    };
}
/**
 * An image attachment's thumbnail: a button that opens its preview, named for viewing the file,
 * else the image itself, named by the file name, since no name shows beside it.
 */
export function AttachmentThumbnail({ src, name, onPreview, onError }) {
    const strings = useUiStrings();
    if (!onPreview) {
        return _jsx("img", { ...hooks.slot('thumbnail'), src: src, alt: name, onError: onError });
    }
    return (_jsx(Button, { className: hooks.slotClass('preview'), variant: "ghost", "aria-label": strings.viewAttachment(name), onPress: onPreview, children: _jsx("img", { ...hooks.slot('thumbnail'), src: src, alt: "", onError: onError }) }));
}
/** A file attachment's chip: its type glyph (decorative), its name and its size. */
export function AttachmentChip({ glyph, name, size, locale }) {
    return (_jsxs(_Fragment, { children: [_jsx(Icon, { glyph: glyph, className: hooks.slotClass('icon') }), _jsx("span", { ...hooks.slot('name'), children: name }), size === undefined ? null : _jsx("span", { ...hooks.slot('size'), children: formatBytes(size, locale) })] }));
}
/** The upload's progress, named for the file: measured from `progress` (0 to 1), else indeterminate. */
export function AttachmentProgress({ name, progress }) {
    const strings = useUiStrings();
    return (_jsx(ProgressBar, { className: hooks.slotClass('progress'), "aria-label": strings.attachmentUploading(name), size: "sm", value: progress === undefined ? undefined : progress * 100, isIndeterminate: progress === undefined }));
}
/** A link that downloads the file under its name. */
export function AttachmentDownload({ href, name }) {
    const strings = useUiStrings();
    return (_jsx(Link, { className: hooks.slotClass('download'), href: href, download: name, "aria-label": strings.downloadFile(name), isStandalone: true, children: _jsx(Icon, { glyph: "download" }) }));
}
//# sourceMappingURL=attachment-parts.js.map