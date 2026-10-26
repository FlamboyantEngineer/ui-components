import { useEditorEventCallback, useEditorState } from '@handlewithcare/react-prosemirror';
import { useMemo } from 'react';
import { getLinkAt, isCommandActive, isCommandSupported, toEngineCommand, } from './engine-commands.js';
import { useRichTextEditorContext } from './rich-text-context.js';
/**
 * The controller of the enclosing `RichTextEditor`, for chrome rendered inside it (its toolbar or
 * children). The component renders again whenever the editor's state changes.
 */
export function useRichTextController() {
    const { isEditable } = useRichTextEditorContext('useRichTextController');
    const state = useEditorState();
    const run = useEditorEventCallback((view, command) => isEditable ? toEngineCommand(command)(view.state, view.dispatch, view) : false);
    const focus = useEditorEventCallback((view) => view.focus());
    return useMemo(() => ({
        isEditable,
        isSelectionEmpty: state.selection.empty,
        link: getLinkAt(state),
        supports: (command) => isCommandSupported(command, state),
        can: (command) => isEditable && toEngineCommand(command)(state),
        isActive: (command) => isCommandActive(command, state),
        run,
        focus,
    }), [isEditable, state, run, focus]);
}
//# sourceMappingURL=rich-text-controller.js.map