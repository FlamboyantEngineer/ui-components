// Plain text and HTML from a document, without a browser document, so a server can render them.
import { getEngineSchema } from './engine-schema.js';
import { getDefaultRichTextSchema } from './rich-text-schema.js';
const voidElements = new Set(['br', 'hr', 'img', 'input', 'col', 'wbr']);
const tagName = /^[a-z][a-z0-9-]*$/i;
const attributeName = /^[a-z_:][a-z0-9_.:-]*$/i;
function escapeText(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttribute(value) {
    return escapeText(value).replace(/"/g, '&quot;');
}
function renderAttributes(attributes) {
    return Object.entries(attributes)
        .filter(([name, value]) => attributeName.test(name) && value !== null && value !== undefined)
        .map(([name, value]) => ` ${name}="${escapeAttribute(String(value))}"`)
        .join('');
}
function isAttributes(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** Writes a rendering spec as HTML, with `content` in its hole. */
function renderSpec(spec, content) {
    if (typeof spec === 'string')
        return escapeText(spec);
    if (!Array.isArray(spec))
        return content;
    const [name, ...rest] = spec;
    if (!tagName.test(name))
        return content;
    const attributes = isAttributes(rest[0]) ? rest.shift() : {};
    const children = rest
        .map((child) => (child === 0 ? content : renderSpec(child, content)))
        .join('');
    const open = `<${name}${renderAttributes(attributes)}>`;
    return voidElements.has(name) ? open : `${open}${children}</${name}>`;
}
function renderMarkOpen(mark) {
    const spec = mark.type.spec.toDOM?.(mark, true) ?? ['span', 0];
    const marker = '\u0000';
    const [open = '', close = ''] = renderSpec(spec, marker).split(marker);
    return { open, close };
}
/** The inline content of a text block, with runs of shared marks kept in one element. */
function renderInline(node) {
    let html = '';
    let active = [];
    node.forEach((child) => {
        let keep = 0;
        while (keep < active.length && keep < child.marks.length) {
            if (!active[keep]?.mark.eq(child.marks[keep]))
                break;
            keep += 1;
        }
        for (const { close } of active.slice(keep).reverse())
            html += close;
        active = active.slice(0, keep);
        for (const mark of child.marks.slice(keep)) {
            const { open, close } = renderMarkOpen(mark);
            html += open;
            active.push({ mark, close });
        }
        html += child.isText ? escapeText(child.text ?? '') : renderNode(child);
    });
    for (const { close } of active.reverse())
        html += close;
    return html;
}
function renderNode(node) {
    let content = '';
    if (node.inlineContent)
        content = renderInline(node);
    else
        node.forEach((child) => (content += renderNode(child)));
    const spec = node.type.spec.toDOM?.(node);
    return spec ? renderSpec(spec, content) : content;
}
function readDocument(document, options) {
    const schema = getEngineSchema(options.schema ?? getDefaultRichTextSchema());
    return schema.nodeFromJSON(document);
}
/**
 * The document as HTML, rendered as each node and mark type renders itself. Text and attribute
 * values are escaped and links keep only safe addresses.
 */
export function serializeRichTextHtml(document, options = {}) {
    return renderNode(readDocument(document, options));
}
/** The document's text: one line per text block, and a line break for each hard break. */
export function serializeRichTextText(document, options = {}) {
    const doc = readDocument(document, options);
    return doc.textBetween(0, doc.content.size, '\n');
}
//# sourceMappingURL=rich-text-export.js.map