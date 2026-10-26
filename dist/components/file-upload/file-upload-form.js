import { jsx as _jsx } from "react/jsx-runtime";
import { useId, useLayoutEffect, useRef, useState, } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { InlineError } from '../inline-error/inline-error.js';
import { fileUploadHooks as hooks } from './file-upload-files.js';
function isSameFiles(held, files) {
    return held.length === files.length && held.every((file, index) => file === files[index]);
}
/**
 * The hidden file input that takes part in a form: it holds the listed files, so a native submit
 * or `FormData` carries them under `name`, and it is required when the upload is. A browser that
 * cannot set an input's files (no `DataTransfer`) submits none. The files are set again only when
 * they change, or when a form reset emptied the input, not on every render.
 */
export function FileFormInput({ name, isRequired, isDisabled, files, onInvalid, }) {
    const ref = useRef(null);
    const held = useRef([]);
    useLayoutEffect(() => {
        const input = ref.current;
        if (!input || typeof DataTransfer !== 'function')
            return;
        if (input.files?.length === files.length && isSameFiles(held.current, files))
            return;
        const transfer = new DataTransfer();
        for (const file of files)
            transfer.items.add(file);
        input.files = transfer.files;
        held.current = files;
    }, [files]);
    return (_jsx("input", { ref: ref, type: "file", name: name, multiple: true, hidden: true, disabled: isDisabled, required: isRequired, tabIndex: -1, onInvalid: (event) => {
            // The upload reports the problem itself and moves focus to its command.
            event.preventDefault();
            onInvalid();
        } }));
}
/**
 * Lets an upload take part in a form: a hidden input submits the listed files under `name` and
 * refuses a submit while a required upload lists none, which shows the provider's `valueRequired`
 * message and focuses the command. A disabled upload submits nothing and, like a read-only one,
 * refuses no submit. The caller's `errorMessage` shows while `isInvalid`.
 */
export function useFileForm(options) {
    const { name, isRequired = false, isInvalid = false, errorMessage, files, commandRef } = options;
    const { isDisabled = false, isReadOnly = false } = options;
    const strings = useUiStrings();
    const errorId = useId();
    const [isMissing, setMissing] = useState(false);
    const missing = isMissing && files.length === 0;
    const error = missing ? strings.valueRequired : isInvalid ? errorMessage : null;
    const hasError = !isEmptyNode(error);
    return {
        input: name !== undefined || isRequired ? (_jsx(FileFormInput, { name: name, isRequired: isRequired && !isReadOnly && !isDisabled && files.length === 0, isDisabled: isDisabled, files: files.flatMap(({ file }) => (file ? [file] : [])), onInvalid: () => {
                setMissing(true);
                commandRef.current?.focus();
            } })) : null,
        message: hasError ? (_jsx(InlineError, { id: errorId, className: hooks.slotClass('error'), children: error })) : null,
        error: hasError,
        errorId,
        isInvalid: isInvalid || missing,
    };
}
//# sourceMappingURL=file-upload-form.js.map