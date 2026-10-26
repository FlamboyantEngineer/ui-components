import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId, useMemo, useRef } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { ChatAttachmentList } from '../chat-attachment/chat-attachment.js';
import { ChatModelPicker, } from '../chat-model-picker/chat-model-picker.js';
import { ChatQuote } from '../chat-transcript/chat-transcript.js';
import { Button } from '../button/button.js';
import { RichMessageComposer, } from '../message-composer/rich/rich-message-composer.js';
import { useChatComposerHandle } from './chat-composer-handle.js';
import { chatHooks as hooks } from './chat-hooks.js';
import { findLastOwnText, readMessageText, toComposerTokens, toExcerpt, toMessageText, } from './chat-model.js';
import { ChatQueue } from './chat-queue.js';
import { submitMessage } from './chat-submit.js';
const noQueue = [];
/** The text the composer edits: the reader's message or a queued one, kept while its words do. */
function useEditValue({ state, messages, options }) {
    const { editing } = state;
    let source;
    if (editing?.kind === 'message') {
        const message = messages.find((entry) => entry.id === editing.id);
        source = message && toMessageText(message);
    }
    else if (editing) {
        const entry = options.queue?.find((item) => item.id === editing.id);
        source = entry && { text: entry.text, tokens: toComposerTokens(entry.tokens ?? []) };
    }
    // A new value restarts the edit, so it changes with the words only, not with the message object.
    const key = source && JSON.stringify(source);
    return useMemo(() => (key === undefined ? undefined : JSON.parse(key)), [key]);
}
/** The banner above the input: the message being replied to, or what is being edited. */
function useBanner(props) {
    const strings = useUiStrings();
    const { state, messages, participants } = props;
    if (state.editing) {
        const isQueued = state.editing.kind === 'queued';
        return { label: isQueued ? strings.chatEditingQueued : strings.chatEditingMessage };
    }
    const replied = messages.find((message) => message.id === state.replyingId);
    if (!replied)
        return undefined;
    const author = participants.get(replied.authorId ?? '');
    return {
        label: strings.chatReplyingTo,
        quote: { authorName: author?.name ?? '', excerpt: toExcerpt(readMessageText(replied)) },
        onCancel: state.cancelReply,
    };
}
function ComposerBanner({ id, banner }) {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [_jsxs("div", { id: id, ...hooks.slot('banner'), children: [_jsx("span", { ...hooks.slot('banner-label'), children: banner.label }), banner.quote ? _jsx(ChatQuote, { ...banner.quote }) : null] }), banner.onCancel ? (_jsx(Button, { icon: "close", label: strings.chatCancelReply, size: "sm", className: hooks.slotClass('banner-cancel'), onPress: banner.onCancel })) : null] }));
}
/** The people `@` mentions: every participant but the reader. */
function useMentions({ participants, currentUserId }) {
    return useMemo(() => [...participants.values()]
        .filter((participant) => participant.id !== currentUserId)
        .map(({ id, name, src, initials, colorKey }) => ({
        id,
        label: name,
        src,
        initials,
        colorKey,
    })), [participants, currentUserId]);
}
/** Up in an empty composer edits the reader's last message, between people with `onEdit`. */
function toEditLast({ options, state, messages, currentUserId, isAssistantChat, }) {
    if (isAssistantChat || !options.onEdit)
        return undefined;
    const last = findLastOwnText(messages, currentUserId);
    return last ? () => state.startEdit({ kind: 'message', id: last.id }) : undefined;
}
/** The files of the next message, removable, with Retry for failed uploads. */
function renderAttachments({ options, state }) {
    if (!options.attachments?.length)
        return undefined;
    return (_jsx(ChatAttachmentList, { attachments: options.attachments, onRemove: options.onRemoveAttachment, onRetry: options.onRetryAttachment, finalFocus: state.composerRef }));
}
/** The host's tools, then the model and effort picker, refused while the composer is. */
function renderTools({ options }) {
    const { composerToolbar, modelPicker, isDisabled } = options;
    if (!composerToolbar && !modelPicker)
        return undefined;
    return (_jsxs(_Fragment, { children: [composerToolbar, modelPicker ? (_jsx(ChatModelPicker, { ...modelPicker, isDisabled: isDisabled || modelPicker.isDisabled })) : null] }));
}
/** Blank messages send when the host allows them or a complete attachment carries the message. */
function allowsEmptySubmit({ options }) {
    const hasFile = options.attachments?.some((entry) => entry.status === 'complete');
    return Boolean(options.allowsEmptySubmit || hasFile);
}
/**
 * The queue of follow-ups, then the rich composer: mentions of the other participants, the host's
 * commands, a per-conversation draft, Up to edit the reader's last message (between people) or to
 * recall earlier prompts (with an assistant), the reply and edit banners, attachments, the "+"
 * menu, the host's tools, the model picker, and Stop.
 */
export function ChatComposer(props) {
    const { options, state, isAssistantChat } = props;
    const bannerId = useId();
    const editValue = useEditValue(props);
    const banner = useBanner(props);
    const mentions = useMentions(props);
    const composerRef = useRef(null);
    const reportDraft = useChatComposerHandle({
        handleRef: options.composerHandleRef,
        composerRef,
        conversationId: options.conversationId,
        onDraftChange: options.onDraftChange,
        focusComposer: state.focusComposer,
    });
    if (!options.onSend)
        return null;
    const onKeyDown = (event) => {
        if (event.key === 'Escape' && state.replyingId !== null)
            state.cancelReply();
    };
    return (_jsxs(_Fragment, { children: [_jsx(ChatQueue, { queue: options.queue ?? noQueue, onQueueChange: options.onQueueChange, onEdit: (id) => state.startEdit({ kind: 'queued', id }), editingId: state.editing?.kind === 'queued' ? state.editing.id : undefined, composerRef: state.composerRef }), _jsx(RichMessageComposer, { ref: state.setComposer, handleRef: composerRef, onChange: reportDraft, className: hooks.slotClass('composer'), placeholder: options.placeholder, isDisabled: options.isDisabled, isPending: options.isPending, onStop: options.onStop, allowsPendingSubmit: options.onQueueChange !== undefined, mentions: mentions, commands: options.commands, getReference: options.getReference, history: isAssistantChat ? options.history : undefined, onEditLast: toEditLast(props), persistKey: options.conversationId ? `chat-draft:${options.conversationId}` : undefined, editValue: editValue, onCancel: state.cancelEdit, banner: banner ? _jsx(ComposerBanner, { id: bannerId, banner: banner }) : undefined, "aria-describedby": banner ? bannerId : undefined, onAttach: options.onAttach, menu: options.composerMenu, attachments: renderAttachments(props), allowsEmptySubmit: allowsEmptySubmit(props), submitShortcut: options.submitShortcut, minRows: options.minRows, maxRows: options.maxRows, showEmojiPicker: !isAssistantChat, toolbar: renderTools(props), onKeyDown: onKeyDown, onSubmit: (message) => submitMessage(props, message), onSubmitError: options.onSendError })] }));
}
//# sourceMappingURL=chat-composer.js.map