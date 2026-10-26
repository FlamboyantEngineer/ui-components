import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId, useState, } from 'react';
import { DropZone } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Icon } from '../icon/icon.js';
import { fileUploadHooks as hooks } from './file-upload-files.js';
/**
 * The command's accessible name: the owner's labelling elements or label, then the command's own
 * text, so the name keeps what the command shows.
 */
function nameCommand(naming, id, text) {
    if (naming['aria-labelledby'])
        return { 'aria-labelledby': `${naming['aria-labelledby']} ${id}` };
    return naming['aria-label'] ? { 'aria-label': `${naming['aria-label']} ${text}` } : {};
}
async function readDirectory(item, files) {
    for await (const entry of item.getEntries()) {
        if (entry.kind === 'file')
            files.push(await entry.getFile());
        else
            await readDirectory(entry, files);
    }
}
/** The dropped files, in order, with every file inside dropped folders when they are accepted. */
export async function readDroppedFiles(items, acceptDirectory) {
    const files = [];
    for (const item of items) {
        if (item.kind === 'file')
            files.push(await item.getFile());
        else if (acceptDirectory && item.kind === 'directory')
            await readDirectory(item, files);
    }
    return files;
}
/** The kind and MIME type of each item of a native drag, all a drag tells before the drop. */
export function readDraggedItems(event) {
    return Array.from(event.dataTransfer?.items ?? [], ({ kind, type }) => ({ kind, type }));
}
/**
 * The drop zone: a React Aria `DropZone` with the upload glyph, the title, the description and a
 * Browse button. While a drag is over it, it says whether the dragged files would be accepted.
 */
export function DropZoneCommand(props) {
    const { label, hint, isDisabled, withChooser, receive, isDragAcceptable, acceptDirectory } = props;
    const strings = useUiStrings();
    const labelId = useId();
    const browseId = useId();
    const [isOver, setOver] = useState(false);
    return (_jsxs(DropZone, { className: hooks.slotClass('dropzone'), isDisabled: isDisabled, "aria-labelledby": labelId, onDropEnter: () => setOver(true), onDropExit: () => setOver(false), onDrop: (event) => {
            setOver(false);
            void readDroppedFiles(event.items, acceptDirectory).then(receive);
        }, "data-drop-accept": (isOver && isDragAcceptable) || undefined, "data-drop-reject": (isOver && !isDragAcceptable) || undefined, children: [_jsx(Icon, { glyph: "upload", className: hooks.slotClass('icon') }), _jsx("span", { ...hooks.slot('label'), id: labelId, children: label }), hint, withChooser(_jsx(Button, { ...nameCommand(props.naming, browseId, strings.browse), ref: props.commandRef, id: browseId, className: hooks.slotClass('browse'), size: "sm", isDisabled: isDisabled, "aria-describedby": [labelId, props.describedBy].filter(Boolean).join(' '), children: strings.browse }))] }));
}
/** The `button` command: a Button with the upload glyph that opens the chooser, then the help. */
export function ButtonCommand(props) {
    const { label, hint, describedBy, isDisabled, withChooser, commandRef } = props;
    const id = useId();
    return (_jsxs(_Fragment, { children: [withChooser(_jsx(Button, { ...nameCommand(props.naming, id, label), ref: commandRef, id: id, startIcon: "upload", isDisabled: isDisabled, "aria-describedby": describedBy, children: label })), hint] }));
}
//# sourceMappingURL=file-upload-drop.js.map