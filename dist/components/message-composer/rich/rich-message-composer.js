import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useRef } from 'react';
import { ComposerFrame } from '../composer-frame.js';
import { resolveSubmitShortcut, useCoarsePointer } from '../composer-keys.js';
import { createMessageCodec, emptyMessage, } from '../composer-message.js';
import { useComposerState } from '../use-composer-state.js';
import { RichComposerEditor } from './rich-editor.js';
import { useComposerHandle } from './use-composer-handle.js';
const richFormat = {
    empty: emptyMessage,
    toText: (message) => message.text,
    fromText: (text) => ({ text, tokens: [] }),
    codec: createMessageCodec((message) => message, (message) => message),
};
/**
 * `MessageComposer`'s rich mode, on ProseMirror: mentions and commands as atomic pills chosen from
 * the completion list or inserted by a menu item, record references as atomic record chips, Markdown as typed with code blocks after three
 * backticks and Ctrl+B or Ctrl+I wrapping the selection, plain-text paste, and the plain composer's
 * frame, sending, attaching, editing, recall and draft. It sends Markdown text with the pills'
 * token ranges.
 */
export function RichMessageComposer(props) {
    const { isPending = false, isDisabled = false } = props;
    const state = useComposerState({
        ...props,
        isBlocked: isDisabled || (isPending && !props.allowsPendingSubmit),
        format: richFormat,
    });
    const shortcut = resolveSubmitShortcut(props.submitShortcut, useCoarsePointer());
    const rootRef = useRef(null);
    const handleRef = useRef(null);
    const insertText = useCallback((text) => handleRef.current?.insertText(text), []);
    const insertPill = useCallback((pill) => handleRef.current?.insertPill(pill), []);
    const focusInput = useCallback(() => handleRef.current?.focus(), []);
    useComposerHandle({ handleRef: props.handleRef, editorRef: handleRef, state, isDisabled });
    return (_jsx(ComposerFrame, { props: props, rootRef: rootRef, model: { ...state, shortcut, insertText, insertPill, focusInput }, children: _jsx(RichComposerEditor, { props: props, state: state, shortcut: shortcut, rootRef: rootRef, handleRef: handleRef }) }));
}
//# sourceMappingURL=rich-message-composer.js.map