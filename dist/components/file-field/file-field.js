import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl } from '../field/field.js';
import { FileUpload, } from '../file-upload/file-upload.js';
import { compareFileItems, restoreFileItem } from './file-field-changes.js';
import { FileFieldInputs, RemovedFiles, fileFieldHooks as hooks, renderFileFieldActions, } from './file-field-parts.js';
/** Whether an upload is still running, so the field waits for it. */
function isUploading({ progress, error }) {
    return !error && progress !== undefined && progress < 100;
}
/** A held file as the upload lists it, marked when an edit added it. */
function toUploadItem(item, added) {
    const { id, name, size, type, previewUrl } = item;
    return { id, name, size, type, previewUrl, change: added.has(id) ? 'added' : undefined };
}
/**
 * A field whose value is a list of stored files: the library's `FileUpload` chooses and checks new
 * files and hands them to the owner, who uploads them, reports the uploads in progress and adds the
 * stored files to the value. Each held file shows its preview or type glyph, its size, a download
 * link and a remove button; while the field is dirty, added files are marked and removed ones can
 * be put back. Running uploads make the field pending. It has the field base's label, validation,
 * dirty state, restore, undo and menu.
 */
export function FileField({ onSelect, uploads = [], onUploadRemove, allowsMultiple = false, variant, acceptedFileTypes, maxSize, maxFiles = allowsMultiple ? undefined : 1, renderFileActions, renderFilePreview, ...props }) {
    const strings = useUiStrings();
    const { state, field, rest } = useFieldControl({ ...props, isPending: Boolean(props.isPending) || uploads.some(isUploading) }, { initialValue: [], emptyValue: [] });
    const { value, committedValue } = state;
    const changes = state.isDirty ? compareFileItems(value, committedValue) : null;
    const held = new Map(value.map((item) => [item.id, item]));
    const isFull = maxFiles !== undefined && value.length + uploads.length >= maxFiles;
    const apply = (next) => {
        state.setValue(next);
        state.commit();
    };
    const remove = (id) => held.has(id) ? apply(value.filter((item) => item.id !== id)) : onUploadRemove?.(id);
    const withHeld = (render) => (file) => {
        const item = held.get(file.id);
        return item ? render(item) : null;
    };
    return (_jsx(Field, { ...field, ...hooks.root({ className: field.className }), state: state, children: (control) => (_jsxs(_Fragment, { children: [_jsx(FileUpload, { className: hooks.slotClass('upload'), label: allowsMultiple ? strings.addFiles : strings.addFile, variant: variant, allowsMultiple: allowsMultiple, acceptedFileTypes: acceptedFileTypes, maxSize: maxSize, maxFiles: maxFiles, files: [
                        ...value.map((item) => toUploadItem(item, changes?.added ?? new Set())),
                        ...uploads,
                    ], onSelect: onSelect, onRemove: remove, isDisabled: control.disabled, isReadOnly: control.readOnly, isInvalid: control['aria-invalid'], "aria-label": control['aria-label'], "aria-labelledby": control['aria-labelledby'], "aria-describedby": control['aria-describedby'], commandRef: control.ref, renderFileActions: withHeld((item) => renderFileFieldActions(item, renderFileActions)), renderFilePreview: withHeld((item) => renderFilePreview?.(item)) }), _jsx(RemovedFiles, { removed: changes?.removed ?? [], isDisabled: isFull || control.disabled || control.readOnly, onRestore: (item) => apply(restoreFileItem(value, committedValue, item)) }), rest.name ? (_jsx(FileFieldInputs, { name: rest.name, value: value, isDisabled: control.disabled })) : null] })) }));
}
//# sourceMappingURL=file-field.js.map