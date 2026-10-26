import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { getFileGlyph } from '../../utils/file-glyph.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { layoutMedia } from './media-layout.js';
import { isImageItem, mediaViewerHooks as hooks, } from './media-viewer-parts.js';
/** The image, fitted to the viewport, zoomed and turned, in a canvas the viewport scrolls. */
function MediaImage({ item, zoom, rotation, stage, }) {
    const [natural, setNatural] = useState(null);
    const loaded = natural?.src === item.src ? natural : null;
    const layout = loaded && stage ? layoutMedia({ natural: loaded, stage, zoom, rotation }) : null;
    const image = (_jsx("img", { ...hooks.slot('image'), src: item.src, alt: item.alt ?? item.name, onLoad: (event) => {
            const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
            setNatural({ src: item.src, width, height });
        }, style: layout
            ? {
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: layout.image.width,
                height: layout.image.height,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            }
            : undefined }));
    return (_jsx("div", { ...hooks.slot('canvas'), style: layout
            ? { position: 'relative', width: layout.canvas.width, height: layout.canvas.height }
            : undefined, children: image }));
}
/** What stands in for a file the viewer cannot draw and the caller does not render. */
function MediaFallback({ item }) {
    const strings = useUiStrings();
    return (_jsxs("div", { ...hooks.slot('fallback'), children: [_jsx(Icon, { glyph: getFileGlyph(item.type), className: hooks.slotClass('fallback-icon') }), strings.previewUnavailable] }));
}
/**
 * The stage: the previous button, the viewport with the image (or the caller's rendering of another
 * file, or a fallback) and the next button.
 */
export function MediaStage(props) {
    const { item, viewportRef, hasSiblings } = props;
    const strings = useUiStrings();
    const isRtl = useLocale().direction === 'rtl';
    const stage = useElementSize(viewportRef, { box: 'client' });
    const isImage = isImageItem(item);
    const custom = isImage ? null : props.renderItem?.(item);
    return (_jsxs("div", { ...hooks.slot('stage', { kind: isImage ? 'image' : 'file' }), children: [hasSiblings ? (_jsx(Button, { className: hooks.slotClass('previous'), icon: isRtl ? 'chevron-right' : 'chevron-left', label: strings.previous, isDisabled: !props.onPrevious, focusableWhenDisabled: true, onPress: props.onPrevious })) : null, _jsx("div", { ...hooks.slot('viewport'), ref: viewportRef, role: "group", "aria-label": strings.mediaStage(item.name), tabIndex: 0, children: isImage ? (_jsx(MediaImage, { item: item, zoom: props.zoom, rotation: props.rotation, stage: stage })) : isEmptyNode(custom) ? (_jsx(MediaFallback, { item: item })) : (_jsx("div", { ...hooks.slot('content'), children: custom })) }), hasSiblings ? (_jsx(Button, { className: hooks.slotClass('next'), icon: isRtl ? 'chevron-left' : 'chevron-right', label: strings.next, isDisabled: !props.onNext, focusableWhenDisabled: true, onPress: props.onNext })) : null] }));
}
//# sourceMappingURL=media-stage.js.map