import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { composerHooks as hooks } from './composer-hooks.js';
import { ComposerMenu } from './composer-menu.js';
import { AttachButton, CancelButton, ComposerAction, EmojiButton } from './composer-tools.js';
import { useFileDrop } from './use-file-drop.js';
function toActionMode(props, model) {
    if (model.isEditing)
        return 'save';
    // A composer that sends while pending offers Stop only while there is nothing to send.
    const isSending = props.allowsPendingSubmit && model.canSubmit;
    return props.isPending && props.onStop && !isSending ? 'stop' : 'send';
}
/** The built-in tools (the menu or the attach button, then emoji) and the caller's, before the button. */
function ComposerToolbar({ props, model, rootRef, }) {
    const { menu, onAttach, showEmojiPicker, toolbar } = props;
    const isDisabled = Boolean(props.isDisabled);
    if (!menu && !onAttach && !showEmojiPicker && !toolbar)
        return null;
    return (_jsxs("div", { ...hooks.slot('toolbar'), children: [menu ? (_jsx(ComposerMenu, { menu: menu, anchorRef: rootRef, model: model, onAttach: onAttach, isDisabled: isDisabled })) : onAttach ? (_jsx(AttachButton, { onAttach: onAttach, isDisabled: isDisabled })) : null, showEmojiPicker ? (_jsx(EmojiButton, { onInsert: model.insertText, focusInput: model.focusInput, isDisabled: isDisabled })) : null, toolbar] }));
}
/**
 * The composer around its input: the banner, the attachments, the input, then the tools, Cancel
 * while editing and the action button. Files dragged onto it, pasted or chosen go to `onAttach`.
 */
export function ComposerFrame({ props, rootRef, model, children }) {
    const { className, id, banner, attachments } = props;
    const isDisabled = Boolean(props.isDisabled);
    const drop = useFileDrop(isDisabled ? undefined : props.onAttach);
    const data = {
        pending: Boolean(props.isPending),
        disabled: isDisabled,
        editing: model.isEditing,
        submitting: model.isSubmitting,
        dropTarget: drop.isDropTarget,
    };
    return (_jsxs("div", { ...hooks.root({ className, props, data }), id: id, ref: rootRef, ...drop.dropProps, children: [banner ? _jsx("div", { ...hooks.slot('banner'), children: banner }) : null, attachments ? _jsx("div", { ...hooks.slot('attachments'), children: attachments }) : null, children, _jsxs("div", { ...hooks.slot('footer'), children: [_jsx(ComposerToolbar, { props: props, model: model, rootRef: rootRef }), model.isEditing ? (_jsx(CancelButton, { onCancel: props.onCancel, isDisabled: isDisabled })) : null, _jsx(ComposerAction, { mode: toActionMode(props, model), canSubmit: model.canSubmit, isPending: Boolean(props.isPending) && !props.allowsPendingSubmit, isDisabled: isDisabled, shortcut: model.shortcut, onSubmit: model.submit, onStop: props.onStop })] })] }));
}
//# sourceMappingURL=composer-frame.js.map