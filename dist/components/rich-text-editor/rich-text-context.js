import { createContext, useContext } from 'react';
import { createHooks } from '../../core/hooks.js';
export const richTextEditorHooks = createHooks('rich-text-editor', [
    'frame',
    'toolbar',
    'surface',
    'content',
    'placeholder',
    'task-item',
    'task-checkbox',
    'task-content',
]);
export const RichTextEditorContext = createContext(null);
/** The enclosing editor's shared state; chrome outside a `RichTextEditor` is an error. */
export function useRichTextEditorContext(component) {
    const context = useContext(RichTextEditorContext);
    if (!context)
        throw new Error(`${component} must be rendered inside a RichTextEditor.`);
    return context;
}
//# sourceMappingURL=rich-text-context.js.map