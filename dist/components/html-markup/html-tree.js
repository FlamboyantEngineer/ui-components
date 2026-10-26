// Builds the element tree of an HTML fragment from markup tokens, closing elements the way an HTML
// parser implies (specs/HTML-MARKUP.md). Policy filtering happens afterwards in sanitize-html.ts.
import { skipDroppedElements, tokenizeMarkup } from '../../utils/markup.js';
/** Elements dropped with all their content, whatever the policy allows. */
const blockedElements = new Set([
    'applet',
    'base',
    'embed',
    'frame',
    'frameset',
    'iframe',
    'link',
    'math',
    'meta',
    'noembed',
    'noframes',
    'noscript',
    'object',
    'plaintext',
    'script',
    'select',
    'style',
    'svg',
    'template',
    'textarea',
    'title',
    'xmp',
]);
const voidElements = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);
/**
 * Blocked elements whose content an HTML parser reads as text, so their markup is never parsed.
 * The content of the other blocked elements is read only to find their matching closing tag.
 */
const rawTextElements = new Set([
    'iframe',
    'noembed',
    'noframes',
    'noscript',
    'plaintext',
    'script',
    'style',
    'textarea',
    'title',
    'xmp',
]);
/** Elements whose text children are dropped, as React cannot render text there. */
const tableStructure = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup']);
const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
/** Elements that close an open paragraph. */
const paragraphClosers = new Set([
    ...headings,
    ...'address article aside blockquote details div dl fieldset figcaption figure footer form header hr li main nav ol p pre section summary table ul'.split(' '),
]);
function impliedEnd(closes, stopAt) {
    return { closes: new Set(closes.split(' ')), stopAt: new Set(stopAt.split(' ')) };
}
const paragraphEnd = impliedEnd('p', 'table td th caption button');
const impliedEnds = {
    li: impliedEnd('li', 'ul ol table td th'),
    dt: impliedEnd('dt dd', 'dl table td th'),
    dd: impliedEnd('dt dd', 'dl table td th'),
    tr: impliedEnd('tr', 'table thead tbody tfoot'),
    td: impliedEnd('td th', 'tr table'),
    th: impliedEnd('td th', 'tr table'),
    thead: impliedEnd('thead tbody tfoot', 'table'),
    tbody: impliedEnd('thead tbody tfoot', 'table'),
    tfoot: impliedEnd('thead tbody tfoot', 'table'),
    a: impliedEnd('a', 'table td th'),
    ...Object.fromEntries(headings.map((tag) => [tag, impliedEnd(headings.join(' '), 'p')])),
};
function current(stack) {
    return stack[stack.length - 1];
}
/** Closes the nearest open element the rule names, unless a boundary comes first. */
function applyImpliedEnd(stack, rule) {
    for (let index = stack.length - 1; index > 0; index -= 1) {
        const tag = stack[index].tag;
        if (rule.closes.has(tag)) {
            stack.length = index;
            return;
        }
        if (rule.stopAt.has(tag))
            return;
    }
}
function openElement(stack, token) {
    const tag = token.tag.toLowerCase();
    if (paragraphClosers.has(tag))
        applyImpliedEnd(stack, paragraphEnd);
    const rule = impliedEnds[tag];
    if (rule)
        applyImpliedEnd(stack, rule);
    if (tag === 'tr' && current(stack).tag === 'table') {
        const body = { tag: 'tbody', attributes: {}, children: [] };
        current(stack).children.push(body);
        stack.push(body);
    }
    const element = { tag, attributes: token.attributes, children: [] };
    current(stack).children.push(element);
    if (!token.isSelfClosing && !voidElements.has(tag))
        stack.push(element);
}
function closeElement(stack, tag) {
    const at = stack.findLastIndex((element, index) => index > 0 && element.tag === tag);
    if (at > 0)
        stack.length = at;
}
function addText(stack, text) {
    const parent = current(stack);
    if (tableStructure.has(parent.tag))
        return;
    const last = parent.children[parent.children.length - 1];
    if (typeof last === 'string')
        parent.children[parent.children.length - 1] = last + text;
    else
        parent.children.push(text);
}
/**
 * Reads an HTML fragment into a tree of lower-case elements and text. Blocked elements are skipped
 * with their content (nested ones of the same name included), void elements take no children, and
 * an element closes the open elements an HTML parser would close (a paragraph before a block, a
 * list item before the next one, table parts before their siblings); a stray closing tag is ignored.
 */
export function buildHtmlTree(markup) {
    const root = { tag: '#fragment', attributes: {}, children: [] };
    const stack = [root];
    const tokens = skipDroppedElements(tokenizeMarkup(markup, { rawTextElements }), {
        isDropped: (token) => blockedElements.has(token.tag.toLowerCase()),
        isEmpty: (token) => token.isSelfClosing || voidElements.has(token.tag.toLowerCase()),
    });
    for (const token of tokens) {
        if (token.type === 'text')
            addText(stack, token.text);
        else if (token.type === 'close')
            closeElement(stack, token.tag.toLowerCase());
        else
            openElement(stack, token);
    }
    return root.children;
}
//# sourceMappingURL=html-tree.js.map