import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { getFileGlyph } from '../../utils/file-glyph.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { Link } from '../link/link.js';
import { ZoomControl } from '../zoom-control/zoom-control.js';
export const mediaViewerHooks = createHooks('media-viewer', [
    'stage',
    'previous',
    'next',
    'viewport',
    'canvas',
    'image',
    'content',
    'fallback',
    'fallback-icon',
    'counter',
    'zoom',
    'rotate',
    'download',
    'thumbnails',
    'thumbnail',
    'thumbnail-image',
    'thumbnail-icon',
]);
const hooks = mediaViewerHooks;
/** Whether the viewer draws the item itself, as an image. */
export function isImageItem(item) {
    return !item.type || item.type.toLowerCase().startsWith('image/');
}
/** The header's position, zoom and rotate controls for an image, and the Download link. */
export function MediaHeaderActions(props) {
    const { item, position, count, zoom } = props;
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [count > 1 ? (_jsx("span", { ...hooks.slot('counter'), "aria-live": "polite", children: strings.stepOfTotal(position, count) })) : null, isImageItem(item) ? (_jsxs(_Fragment, { children: [_jsx(ZoomControl, { className: hooks.slotClass('zoom'), value: zoom, onChange: props.onZoomChange, resetValue: 100 }), _jsx(Button, { className: hooks.slotClass('rotate'), icon: "rotate", label: strings.rotateClockwise, size: "sm", onPress: props.onRotate })] })) : null, item.downloadUrl ? (_jsx(Link, { className: hooks.slotClass('download'), href: item.downloadUrl, download: item.name, "aria-label": strings.downloadFile(item.name), isStandalone: true, children: _jsx(Icon, { glyph: "download" }) })) : null] }));
}
/** The thumbnail strip: one button per item, the current one marked, each showing that item. */
export function MediaThumbnails({ items, current, onSelect, }) {
    const strings = useUiStrings();
    return (_jsx("div", { ...hooks.slot('thumbnails'), role: "group", "aria-label": strings.thumbnails, children: items.map((item) => {
            const url = item.thumbnailUrl ?? (isImageItem(item) ? item.src : undefined);
            return (_jsx(Button, { className: hooks.slotClass('thumbnail'), variant: "ghost", "aria-label": item.name, "aria-current": item.id === current || undefined, onPress: () => onSelect(item.id), children: url ? (_jsx("img", { ...hooks.slot('thumbnail-image'), src: url, alt: "" })) : (_jsx(Icon, { glyph: getFileGlyph(item.type), className: hooks.slotClass('thumbnail-icon') })) }, toKeyIdentity(item.id)));
        }) }));
}
//# sourceMappingURL=media-viewer-parts.js.map