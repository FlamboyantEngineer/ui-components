import { Schema } from 'prosemirror-model';
import { registerEngineSchema } from './engine-schema.js';
import { defaultMarks, defaultNodes } from './default-schema.js';
function toParseRules(rules) {
    return rules?.map(({ tag, getAttrs, priority }) => ({
        tag,
        priority,
        getAttrs: getAttrs ? (element) => getAttrs(element) : undefined,
    }));
}
function toEngineSpec({ parseDOM, toDOM, ...rest }) {
    return {
        ...rest,
        parseDOM: toParseRules(parseDOM),
        toDOM: toDOM
            ? (element) => toDOM({ type: element.type.name, attrs: element.attrs })
            : undefined,
    };
}
/** The default specs with the caller's changes applied, keeping each default in its place. */
function mergeSpecs(defaults, changes, convert) {
    const merged = { ...defaults };
    for (const [name, spec] of Object.entries(changes ?? {})) {
        if (spec !== null)
            merged[name] = convert(spec);
        else if (name !== 'doc' && name !== 'text')
            delete merged[name];
    }
    return merged;
}
/**
 * Creates the schema of a rich-text document: the default node types (paragraph, headings 1 to
 * 3, quote, code block, divider, bullet, numbered and task lists, hard break) and marks (link,
 * bold, italic, underline, strike, code), with the caller's changes. Create it once, outside render.
 */
export function createRichTextSchema(options = {}) {
    const engine = new Schema({
        nodes: mergeSpecs(defaultNodes, options.nodes, (spec) => toEngineSpec(spec)),
        marks: mergeSpecs(defaultMarks, options.marks, (spec) => toEngineSpec(spec)),
    });
    const schema = {
        nodes: Object.keys(engine.nodes),
        marks: Object.keys(engine.marks),
    };
    return registerEngineSchema(schema, engine);
}
let defaultSchema;
/** The default schema, created once. */
export function getDefaultRichTextSchema() {
    defaultSchema ??= createRichTextSchema();
    return defaultSchema;
}
//# sourceMappingURL=rich-text-schema.js.map