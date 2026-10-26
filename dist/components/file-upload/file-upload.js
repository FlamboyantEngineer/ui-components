import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { FileTrigger, useLocale } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { formatBytes } from '../../utils/format-bytes.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { useRemovalFocus } from '../../utils/use-removal-focus.js';
import { InlineError } from '../inline-error/inline-error.js';
import { formatMetaLine } from '../meta-line/meta-line.js';
import { canAcceptDrag, partitionFiles, } from './file-rules.js';
import { ButtonCommand, DropZoneCommand, readDraggedItems, } from './file-upload-drop.js';
import { FileUploadFiles, fileUploadHooks as hooks, } from './file-upload-files.js';
import { useFileForm } from './file-upload-form.js';
function defaultDescription(rules, strings, locale) {
    const size = rules.maxSize ? strings.fileSizeLimit(formatBytes(rules.maxSize, locale)) : '';
    const count = rules.maxFiles ? strings.fileCountLimit(rules.maxFiles) : '';
    return formatMetaLine([rules.acceptedFileTypes?.join(', '), size, count]);
}
function rejectionMessage(rejections, strings) {
    const counted = (reason) => rejections.filter((rejection) => rejection.reason === reason).length;
    const counts = [
        counted('type') && strings.rejectedFileType(counted('type')),
        counted('size') && strings.rejectedFileSize(counted('size')),
        counted('min-size') && strings.rejectedFileSmall(counted('min-size')),
        counted('count') && strings.rejectedFileCount(counted('count')),
    ];
    const reasons = rejections.flatMap(({ file, reason, message }) => reason === 'invalid' ? [strings.rejectedFileReason(file.name, message ?? '')] : []);
    return [...counts, ...reasons].filter(Boolean).join(' ');
}
/**
 * Checks offered files, reports the refusals and hands on the accepted ones, and judges a drag
 * before the drop. `held` files are listed already. An offer made while an earlier one still waits
 * for `validate` is checked once the earlier one is handed on, counting the files it accepted until
 * the upload renders again, so overlapping offers never pass `maxFiles` together and the latest
 * offer's refusals are the ones shown.
 */
function useFileIntake(props, held) {
    const { allowsMultiple, acceptDirectory, onSelect, onReject } = props;
    const { acceptedFileTypes, maxSize, minSize, maxFiles, validate } = props;
    const rules = { acceptedFileTypes, maxSize, minSize, maxFiles, validate };
    const [rejections, setRejections] = useState([]);
    const [isDragAcceptable, setDragAcceptable] = useState(true);
    const count = useRef({ held, accepted: 0 });
    const queue = useRef(null);
    useLayoutEffect(() => {
        count.current = { held, accepted: 0 };
    });
    const isMultiple = Boolean(allowsMultiple || acceptDirectory);
    const report = (result) => {
        count.current.accepted += result.accepted.length;
        setRejections(result.rejections);
        if (result.rejections.length > 0)
            onReject?.(result.rejections);
        if (result.accepted.length > 0)
            onSelect(result.accepted);
    };
    const judge = (offered) => {
        const outcome = partitionFiles(offered, rules, count.current.held + count.current.accepted);
        if (outcome instanceof Promise)
            return outcome.then(report);
        report(outcome);
        return undefined;
    };
    return {
        rejections,
        isDragAcceptable,
        receive(offered) {
            const files = isMultiple ? offered : offered.slice(0, 1);
            const run = () => judge(files);
            const outcome = queue.current ? queue.current.then(run, run) : run();
            if (!outcome)
                return;
            const settled = outcome.finally(() => {
                if (queue.current === settled)
                    queue.current = null;
            });
            queue.current = settled;
        },
        onDragEnter(event) {
            const items = readDraggedItems(event);
            setDragAcceptable(canAcceptDrag(isMultiple ? items : items.slice(0, 1), rules, held));
        },
    };
}
/**
 * The command's props: its label and naming, its description (by default the accepted types and
 * limits) and error, the chooser and the intake, and its button ref, shared with the owner's.
 */
function useFileCommand(props, intake, form) {
    const { label, description, allowsMultiple, acceptDirectory = false } = props;
    const strings = useUiStrings();
    const { locale } = useLocale();
    const hintId = useId();
    const ownerRef = props.commandRef;
    const { commandRef } = form;
    const mergedRef = useMemo(() => mergeRefs(commandRef, ownerRef), [commandRef, ownerRef]);
    const hint = description ?? defaultDescription(props, strings, locale);
    return {
        label,
        naming: { 'aria-label': props['aria-label'], 'aria-labelledby': props['aria-labelledby'] },
        hint: hint ? (_jsx("span", { ...hooks.slot('description'), id: hintId, children: hint })) : null,
        describedBy: [hint && hintId, form.error && form.errorId, props['aria-describedby']]
            .filter(Boolean)
            .join(' ') || undefined,
        isDisabled: props.isDisabled ?? false,
        withChooser: (button) => (_jsx(FileTrigger, { acceptedFileTypes: props.acceptedFileTypes, allowsMultiple: allowsMultiple || acceptDirectory, acceptDirectory: acceptDirectory, onSelect: (list) => intake.receive(list ? Array.from(list) : []), children: button })),
        receive: intake.receive,
        isDragAcceptable: intake.isDragAcceptable,
        acceptDirectory,
        commandRef: mergedRef,
    };
}
/**
 * Chooses files or folders from the system file chooser or by drag and drop, checks them against
 * the accepted types, the size and count limits and the caller's own check, and hands the accepted
 * ones to `onSelect`. Refusals are reported below the command and to `onReject`; a drag says
 * whether it would be accepted. Listed files show image thumbnails or type glyphs, the upload
 * progress and errors the host reports and the owner's actions, and can take part in a form under
 * `name`.
 */
export function FileUpload(props) {
    const { variant = 'button', files = [], className, id, isReadOnly } = props;
    const strings = useUiStrings();
    const { locale } = useLocale();
    const commandRef = useRef(null);
    const intake = useFileIntake(props, files.length);
    const form = useFileForm({ ...props, files, commandRef });
    const command = useFileCommand(props, intake, { ...form, commandRef });
    const removalFocus = useRemovalFocus(files, commandRef);
    const data = {
        variant,
        disabled: props.isDisabled,
        readonly: isReadOnly,
        required: props.isRequired,
        invalid: form.isInvalid,
    };
    const Command = variant === 'button' ? ButtonCommand : DropZoneCommand;
    return (_jsxs("div", { ...hooks.root({ className, props, data }), id: id, onDragEnterCapture: intake.onDragEnter, children: [isReadOnly ? null : _jsx(Command, { ...command }), form.message, intake.rejections.length > 0 && !isReadOnly ? (_jsx(InlineError, { className: hooks.slotClass('rejections'), children: rejectionMessage(intake.rejections, strings) })) : null, files.length > 0 ? (_jsx(FileUploadFiles, { label: props.label, files: files, locale: locale, onRemove: isReadOnly ? undefined : props.onRemove, isDisabled: props.isDisabled ?? false, removalFocus: removalFocus, renderFileActions: props.renderFileActions, renderFilePreview: props.renderFilePreview })) : null, form.input] }));
}
//# sourceMappingURL=file-upload.js.map