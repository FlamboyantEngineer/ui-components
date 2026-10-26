import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Builds the React elements of a parsed Markdown tree, leaves first and without recursion
// (specs/MARKDOWN.md).
import { createElement, Fragment } from 'react';
import { createHooks } from '../../core/hooks.js';
import { mapTree } from '../../utils/map-tree.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { Link } from '../link/link.js';
import { ProseTable } from '../prose-table/prose-table.js';
import { Separator } from '../separator/separator.js';
import { TextMatch } from '../text-match/text-match.js';
export const markdownHooks = createHooks('markdown', ['code-block', 'code', 'task', 'image']);
const hooks = markdownHooks;
const externalUrl = /^https?:/i;
const inlineTypes = new Set([
    'text',
    'inlineCode',
    'emphasis',
    'strong',
    'strikethrough',
    'link',
    'image',
    'lineBreak',
]);
/** A task item's label, its first paragraph's inlines, and its other blocks. */
function splitTask(node) {
    const [first, ...rest] = node.children;
    return first?.type === 'paragraph'
        ? { label: first.children, blocks: rest }
        : { label: [], blocks: node.children };
}
/**
 * The entries a node renders its children from. A task item renders its label's inlines in place of
 * its first paragraph, then its other blocks, so every node renders once.
 */
function listChildEntries({ node, isTight }) {
    if (!('children' in node))
        return undefined;
    if (node.type === 'list') {
        return node.children.map((item) => ({ node: item, isTight: node.tight }));
    }
    if (node.type !== 'listItem') {
        return node.children.map((child) => ({ node: child, isTight: false }));
    }
    const { label, blocks } = splitTask(node);
    const children = node.checked === null ? node.children : [...label, ...blocks];
    return children.map((child) => ({ node: child, isTight }));
}
function renderEntries(entries, context) {
    return mapTree(entries, listChildEntries, (entry, children, index) => (_jsx(Fragment, { children: renderNode(entry, children, context) }, entry.key ?? index)));
}
/** Renders nodes from the leaves up, without recursion, so deep nesting cannot overflow the stack. */
function renderAll(nodes, context) {
    return renderEntries(nodes.map((node) => ({ node, isTight: false })), context);
}
/** The element of a document's top-level block, keyed by its position. */
export function renderMarkdownBlock(block, index, context) {
    return renderEntries([{ node: block, isTight: false, key: index }], context)[0];
}
function renderNode(entry, mapped, context) {
    const { node } = entry;
    const children = 'children' in node ? mapped : null;
    const custom = context.renderNode?.(node, children);
    if (custom !== undefined)
        return custom;
    return isInline(node)
        ? renderInline(node, children, context)
        : renderBlock({ node, isTight: entry.isTight }, mapped, context);
}
function isInline(node) {
    return inlineTypes.has(node.type);
}
/** A link to a heading of the document follows the heading's prefixed id. */
function resolveHref(href, context) {
    const { headingIdPrefix } = context;
    if (headingIdPrefix === undefined || !href.startsWith('#'))
        return href;
    const id = href.slice(1);
    return context.headingIds.has(id) ? `#${headingIdPrefix}${id}` : href;
}
function renderInline(node, children, context) {
    switch (node.type) {
        case 'text':
            return _jsx(TextMatch, { children: node.text });
        case 'inlineCode':
            return (_jsx("code", { ...hooks.slot('code'), children: _jsx(TextMatch, { children: node.text }) }));
        case 'emphasis':
            return _jsx("em", { children: children });
        case 'strong':
            return _jsx("strong", { children: children });
        case 'strikethrough':
            return _jsx("del", { children: children });
        case 'link':
            return (_jsx(Link, { href: resolveHref(node.href, context), isExternal: externalUrl.test(node.href), children: children }));
        case 'image':
            return (_jsx("img", { ...hooks.slot('image'), src: node.src, alt: node.alt, title: node.title ?? undefined }));
        case 'lineBreak':
            return _jsx("br", {});
    }
}
function renderTable(node, context) {
    const header = node.header.map((cell, column) => ({
        key: String(column),
        content: renderAll(cell, context),
        align: node.align[column] ?? undefined,
    }));
    const rows = node.rows.map((row, index) => ({
        key: String(index),
        cells: row.map((cell, column) => ({ key: String(column), content: renderAll(cell, context) })),
    }));
    return _jsx(ProseTable, { header: header, rows: rows });
}
/** A task item: a read-only checkbox labelled by the item's first paragraph, then the rest. */
function renderTask(node, checked, children) {
    const labelLength = splitTask(node).label.length;
    return (_jsxs("li", { ...hooks.slot('task'), children: [_jsx(Checkbox, { size: "sm", isReadOnly: true, isSelected: checked, children: children.slice(0, labelLength) }), children.slice(labelLength)] }));
}
function renderBlock({ node, isTight }, children, context) {
    switch (node.type) {
        case 'heading': {
            const { headingIdPrefix } = context;
            const id = headingIdPrefix === undefined ? undefined : headingIdPrefix + node.id;
            return createElement(`h${node.level}`, { id }, children);
        }
        case 'paragraph':
            return isTight ? children : _jsx("p", { children: children });
        case 'codeBlock':
            return (_jsx("pre", { ...hooks.slot('code-block', { language: node.language }), children: _jsx("code", { children: _jsx(TextMatch, { children: node.text }) }) }));
        case 'blockquote':
            return _jsx("blockquote", { children: children });
        case 'list':
            if (!node.ordered)
                return _jsx("ul", { children: children });
            return _jsx("ol", { start: node.start === 1 ? undefined : node.start, children: children });
        case 'listItem':
            return node.checked === null ? _jsx("li", { children: children }) : renderTask(node, node.checked, children);
        case 'table':
            return renderTable(node, context);
        case 'thematicBreak':
            return _jsx(Separator, {});
    }
}
//# sourceMappingURL=markdown-render.js.map