import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { useRemovalFocus } from '../../utils/use-removal-focus.js';
import { MediaViewer } from '../media-viewer/media-viewer.js';
import { AttachmentRemovalContext } from './attachment-context.js';
import { getAttachmentImage, resolveAttachmentStatus, toAttachmentUrl, } from './attachment-model.js';
import { ChatAttachment } from './chat-attachment.js';
const hooks = createHooks('chat-attachment-list', ['item']);
/** The gallery's media viewer item for an attachment that shows an image, else none. */
function toGalleryItems(attachment) {
    const image = getAttachmentImage(attachment);
    if (!image)
        return [];
    const isComplete = resolveAttachmentStatus(attachment) === 'complete';
    return [
        {
            id: attachment.id,
            src: toAttachmentUrl(attachment.url) ?? image,
            name: attachment.name,
            thumbnailUrl: image,
            downloadUrl: isComplete ? toAttachmentUrl(attachment.url) : undefined,
        },
    ];
}
/**
 * A labelled list of attachments, in their order: images show as thumbnails that open the library's
 * `MediaViewer` on that image, with the list's other images to page through, and other files as
 * chips. Removing an attachment keeps the focus in the list, else sends it to `finalFocus`. An
 * empty list renders nothing.
 */
export function ChatAttachmentList({ attachments, onRemove, onRetry, finalFocus, className, id, ...rest }) {
    const strings = useUiStrings();
    const removal = useRemovalFocus(attachments, finalFocus);
    const [viewer, setViewer] = useState(null);
    const gallery = attachments.flatMap(toGalleryItems);
    const inGallery = new Set(gallery.map((item) => item.id));
    if (attachments.length === 0)
        return null;
    const labelledBy = rest['aria-labelledby'];
    return (_jsxs(AttachmentRemovalContext.Provider, { value: removal, children: [_jsx("ul", { ...hooks.root({ className, props: rest }), id: id, "aria-label": labelledBy ? rest['aria-label'] : (rest['aria-label'] ?? strings.attachmentList), "aria-labelledby": labelledBy, children: attachments.map((attachment) => (_jsx("li", { ...hooks.slot('item'), children: _jsx(ChatAttachment, { ...attachment, onRemove: onRemove && (() => onRemove(attachment.id)), onRetry: onRetry && (() => onRetry(attachment.id)), onPreview: inGallery.has(attachment.id)
                            ? () => setViewer({ key: attachment.id, isOpen: true })
                            : undefined }) }, attachment.id))) }), viewer && gallery.length > 0 ? (_jsx(MediaViewer, { items: gallery, selectedKey: viewer.key, isOpen: viewer.isOpen, onOpenChange: (isOpen) => setViewer({ ...viewer, isOpen }), onSelectionChange: (key) => setViewer({ key, isOpen: true }) })) : null] }));
}
//# sourceMappingURL=chat-attachment-list.js.map