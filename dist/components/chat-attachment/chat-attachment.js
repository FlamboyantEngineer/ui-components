import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useLayoutEffect, useRef } from 'react';
import { useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { InlineError } from '../inline-error/inline-error.js';
import { AttachmentRemovalContext } from './attachment-context.js';
import { getAttachmentGlyph, getAttachmentImage, getAttachmentKind, resolveAttachmentStatus, toAttachmentUrl, } from './attachment-model.js';
import { AttachmentChip, AttachmentDownload, AttachmentProgress, AttachmentThumbnail, chatAttachmentHooks as hooks, useThumbnail, } from './attachment-parts.js';
/**
 * After a Retry press, once the error (and its Retry button) has left and the focus left with it,
 * focuses the attachment's remove button, else the attachment itself. Returns the press recorder.
 */
function useRetryFocus(status, rootRef) {
    const retried = useRef(false);
    useLayoutEffect(() => {
        if (!retried.current || status === 'error')
            return;
        retried.current = false;
        const active = document.activeElement;
        if (active && active !== document.body)
            return;
        const root = rootRef.current;
        (root?.querySelector(`.${hooks.slotClass('remove')}`) ?? root)?.focus();
    }, [status, rootRef]);
    return () => {
        retried.current = true;
    };
}
/**
 * One attachment: an image's thumbnail (a preview button with `onPreview`), or a chip with the
 * file's type glyph, name and size; the upload's progress, or its error with Retry; a download
 * link once complete; and a remove button for the composer. Its kind, status and display are hooks.
 */
export function ChatAttachment({ id, name, mediaType, size, url, thumbnailUrl, status: givenStatus, progress, error, onRemove, onRetry, onPreview, className, ...rest }) {
    const strings = useUiStrings();
    const { locale } = useLocale();
    const removal = useContext(AttachmentRemovalContext);
    const rootRef = useRef(null);
    const kind = getAttachmentKind(mediaType, name);
    const status = resolveAttachmentStatus({ status: givenStatus, error });
    const thumbnail = useThumbnail(getAttachmentImage({ mediaType, name, url, thumbnailUrl }));
    const recordRetry = useRetryFocus(status, rootRef);
    const download = status === 'complete' ? toAttachmentUrl(url) : undefined;
    const display = thumbnail.src ? 'thumbnail' : 'chip';
    return (_jsxs("div", { ...hooks.root({ className, props: rest, data: { kind, status, display } }), ref: rootRef, 
        // Focusable by script only, for the focus to land on after Retry when no control is left.
        tabIndex: -1, children: [thumbnail.src ? (_jsx(AttachmentThumbnail, { src: thumbnail.src, name: name, onPreview: onPreview, onError: thumbnail.onError })) : (_jsx(AttachmentChip, { glyph: getAttachmentGlyph(kind, mediaType), name: name, size: size, locale: locale })), status === 'uploading' ? _jsx(AttachmentProgress, { name: name, progress: progress }) : null, status === 'error' ? (_jsx(InlineError, { className: hooks.slotClass('error'), onRetry: onRetry &&
                    (() => {
                        recordRetry();
                        onRetry();
                    }), children: error ?? strings.attachmentFailed(name) })) : null, download ? _jsx(AttachmentDownload, { href: download, name: name }) : null, onRemove ? (_jsx(Button, { className: hooks.slotClass('remove'), icon: "close", label: strings.removeItem(name), size: "sm", ref: (button) => removal?.register(id, button), onPress: () => {
                    removal?.willRemove(id);
                    onRemove();
                } })) : null] }));
}
export { ChatAttachmentList } from './chat-attachment-list.js';
//# sourceMappingURL=chat-attachment.js.map