import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useRef, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { getDisplayName } from '../avatar/avatar.js';
import { CommentComposer } from '../comment-composer/comment-composer.js';
import { Modal } from '../modal/modal.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { RelativeTime } from '../relative-time/relative-time.js';
import { UserIdentity } from '../user-identity/user-identity.js';
import { CommentThreadContext } from './comment-thread-context.js';
const hooks = createHooks('comment-thread-reply', [
    'header',
    'author',
    'time',
    'edited',
    'actions',
    'body',
    'editor',
    'reactions',
]);
const editKey = 'edit';
const deleteKey = 'delete';
/** The default editor: a `CommentComposer` holding the comment's text. */
function DefaultEditor(options) {
    const strings = useUiStrings();
    return (_jsx(CommentComposer, { ...options, label: strings.editComment, submitLabel: strings.save, autoFocus: true }));
}
/** The comment's menu entries: the caller's actions, then Edit and Delete when offered. */
function useMenuEntries({ actions = [], onEdit, onDelete, }) {
    const strings = useUiStrings();
    return [
        ...actions,
        ...(onEdit ? [{ id: editKey, label: strings.edit, icon: 'edit' }] : []),
        ...(onDelete
            ? [{ id: deleteKey, label: strings.delete, icon: 'delete', tone: 'danger' }]
            : []),
    ];
}
/** The author, the live time and the edited marker. */
function CommentAuthor({ author, time, isEdited, }) {
    const strings = useUiStrings();
    return (_jsx(UserIdentity, { ...author, size: "sm", className: hooks.slotClass('author'), description: _jsxs(_Fragment, { children: [_jsx(RelativeTime, { value: time, placeholder: strings.unknownTime, className: hooks.slotClass('time') }), isEdited ? (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('edited'), children: strings.edited })] })) : null] }) }));
}
/** The comment's menu, and the confirmation its Delete opens. */
function CommentMenu({ actions, onAction, onEdit, onDelete, onEditStart, menuRef, }) {
    const strings = useUiStrings();
    const [isConfirming, setIsConfirming] = useState(false);
    const entries = useMenuEntries({ actions, onEdit, onDelete });
    if (entries.length === 0)
        return null;
    const runAction = (key) => {
        if (key === editKey && onEdit)
            onEditStart();
        else if (key === deleteKey && onDelete)
            setIsConfirming(true);
        else
            onAction?.(key);
    };
    return (_jsxs(_Fragment, { children: [_jsx(DropdownMenu, { ref: menuRef, label: strings.commentActions, iconOnly: true, size: "sm", placement: "bottom end", className: hooks.slotClass('actions'), items: entries, onAction: runAction }), onDelete ? (_jsx(Modal, { role: "alertdialog", isOpen: isConfirming, onOpenChange: setIsConfirming, tone: "danger", title: strings.deleteComment, description: strings.deleteCommentMessage, cancelAction: { autoFocus: true }, primaryAction: {
                    label: strings.delete,
                    onPress: (close) => {
                        onDelete();
                        close();
                    },
                } })) : null] }));
}
/**
 * One comment: its author, a live time, an edited marker, the body as caller content, reactions
 * and a menu of actions with Edit (in place) and Delete (after confirmation).
 */
export function CommentThreadReply({ author, time, isEdited = false, text = '', children, reactions, actions, onAction, onEdit, onDelete, renderEditor = DefaultEditor, className, ...rest }) {
    const { isReadOnly } = useContext(CommentThreadContext);
    const [isEditing, setIsEditing] = useState(false);
    const strings = useUiStrings();
    const menuRef = useRef(null);
    const editing = isEditing && !isReadOnly;
    const closeEditor = () => {
        setIsEditing(false);
        menuRef.current?.focus();
    };
    return (_jsxs("article", { ...rest, ...hooks.root({ className, data: { edited: isEdited, editing } }), "aria-label": getDisplayName(author.name, strings.unnamed), children: [_jsxs("div", { ...hooks.slot('header'), children: [_jsx(CommentAuthor, { author: author, time: time, isEdited: isEdited }), isReadOnly ? null : (_jsx(CommentMenu, { actions: actions, onAction: onAction, onEdit: onEdit, onDelete: onDelete, onEditStart: () => setIsEditing(true), menuRef: menuRef }))] }), editing ? (_jsx("div", { ...hooks.slot('editor'), children: renderEditor({
                    defaultValue: text,
                    onSubmit: (edited) => {
                        closeEditor();
                        onEdit?.(edited);
                    },
                    onCancel: closeEditor,
                }) })) : (_jsx("div", { ...hooks.slot('body'), children: children ?? text })), reactions && !editing ? _jsx("div", { ...hooks.slot('reactions'), children: reactions }) : null] }));
}
//# sourceMappingURL=comment-thread-reply.js.map