// The rich composer's document: lines of text and pills (mentions, commands and record
// references), and code blocks. It has no marks: the text is Markdown as typed.
import { Schema } from 'prosemirror-model';
import { composerHooks as hooks } from '../composer-hooks.js';
import { tokenTriggers } from '../composer-message.js';
/** A pill's text: its trigger character and its label, such as `@Maria Santos`; a reference's label. */
export function getPillText(node) {
    const { kind, label } = node.attrs;
    return `${tokenTriggers[kind]}${label}`;
}
const pill = {
    inline: true,
    group: 'inline',
    atom: true,
    selectable: false,
    draggable: false,
    attrs: {
        kind: { default: 'mention' },
        id: { default: '' },
        label: { default: '' },
        recordType: { default: undefined },
    },
    leafText: getPillText,
    toDOM: (node) => [
        'span',
        {
            class: hooks.slotClass('pill'),
            'data-kind': node.attrs.kind,
            contenteditable: 'false',
        },
        getPillText(node),
    ],
};
/** The composer's schema: paragraphs (one per line), code blocks and pills. */
export const composerSchema = new Schema({
    nodes: {
        doc: { content: 'block+' },
        paragraph: {
            group: 'block',
            content: 'inline*',
            toDOM: () => ['p', 0],
            parseDOM: [{ tag: 'p' }],
        },
        codeBlock: {
            group: 'block',
            content: 'text*',
            marks: '',
            code: true,
            defining: true,
            attrs: { language: { default: '' } },
            toDOM: () => ['pre', { class: hooks.slotClass('code-block') }, ['code', 0]],
        },
        text: { group: 'inline' },
        pill,
    },
    marks: {},
});
//# sourceMappingURL=composer-schema.js.map