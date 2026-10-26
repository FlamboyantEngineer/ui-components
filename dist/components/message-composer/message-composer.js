import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TextArea } from '../../primitives/index.js';
import { ControlCompletionList, } from '../completion-list/completion-list.js';
import { ComposerFrame } from './composer-frame.js';
import { composerHooks as hooks } from './composer-hooks.js';
import { useMessageComposer } from './use-message-composer.js';
/**
 * A composer for chat messages and comments: a text area that grows with its text and sends on
 * Enter (or Ctrl+Enter), with a banner, attachments above it, a "+" menu or attach button, emoji and
 * caller tools and a send button below, completions such as `@` mentions, an edit mode, recall of earlier messages,
 * a persisted draft, and a pending state that offers Stop while a reply streams.
 */
export function MessageComposer(props) {
    const composer = useMessageComposer(props);
    return (_jsxs(ComposerFrame, { props: props, rootRef: composer.rootRef, model: composer.frame, children: [_jsx(TextArea, { ...composer.inputProps, ...hooks.slot('input') }), props.completions ? (_jsx(ControlCompletionList, { model: composer.completion.model, listId: composer.completion.listId, anchorRef: composer.rootRef, renderCompletion: props.renderCompletion, className: hooks.slotClass('completions') })) : null] }));
}
//# sourceMappingURL=message-composer.js.map