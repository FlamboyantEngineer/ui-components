import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl } from '../field/field.js';
import { createEmptyDocument, isDocumentEmpty } from './editor-state.js';
import { EditorSurface } from './editor-surface.js';
import { richTextEditorHooks as hooks } from './rich-text-context.js';
import { getEngineSchema } from './engine-schema.js';
import { getDefaultRichTextSchema } from './rich-text-schema.js';
/**
 * A field for formatted text: headings, lists, tasks, quotes, code, links and inline marks, with
 * undo history, Markdown-style shortcuts as you type and keyboard shortcuts. The value is the
 * document as JSON. Its toolbar and floating chrome drive it through `useRichTextController`.
 */
export function RichTextEditor(props) {
    const strings = useUiStrings();
    const schema = props.schema ?? getDefaultRichTextSchema();
    const engine = getEngineSchema(schema);
    const empty = useMemo(() => createEmptyDocument(engine), [engine]);
    const { state, field, rest } = useFieldControl(props, {
        initialValue: empty,
        emptyValue: empty,
        check: (value) => props.isRequired && isDocumentEmpty(value, engine)
            ? { severity: 'error', message: strings.valueRequired, validity: 'valueMissing' }
            : null,
    });
    return (_jsx(Field, { state: state, ...field, className: mergeClassNames(hooks.className, field.className), commitOnBlur: true, children: (control) => (_jsx(EditorSurface, { control: control, schema: engine, value: state.value, onChange: state.setValue, placeholder: rest.placeholder, toolbar: rest.toolbar, children: rest.children })) }));
}
export { createRichTextSchema } from './rich-text-schema.js';
export { useRichTextController } from './rich-text-controller.js';
export { serializeRichTextHtml, serializeRichTextText } from './rich-text-export.js';
//# sourceMappingURL=rich-text-editor.js.map