// Keeps the elements of a streaming document's finished blocks, so each chunk renders only the
// blocks it changed (specs/MARKDOWN.md, UIC-MARKDOWN-2.12).
import { useRef } from 'react';
import { renderMarkdownBlock } from './markdown-render.js';
/** Closes the fields of an object or an array in a signature. */
const closing = Symbol('closing');
/**
 * A string that differs whenever the node or any node below it differs, built without recursive
 * calls so a deeply nested block cannot overflow the stack.
 */
export function signMarkdownNode(node) {
    const parts = [];
    const pending = [node];
    while (pending.length > 0) {
        const value = pending.pop();
        if (value === closing) {
            parts.push(')');
        }
        else if (typeof value === 'object' && value !== null) {
            const fields = Array.isArray(value) ? value : Object.entries(value).flat();
            parts.push('(');
            pending.push(closing);
            for (let index = fields.length - 1; index >= 0; index -= 1)
                pending.push(fields[index]);
        }
        else {
            parts.push(`${JSON.stringify(value) ?? 'null'},`);
        }
    }
    return parts.join('');
}
/**
 * The elements of the document's top-level blocks. A block the previous render drew in the same
 * rendering context reuses its element, so React skips it and `renderNode` is not called for its
 * nodes again: the same block object, or while streaming, a block of the same content at the same
 * position.
 */
export function useMarkdownBlocks(blocks, context, isStreaming) {
    const cache = useRef(null);
    const previous = cache.current;
    const reusable = previous?.context === context && previous.isStreaming === isStreaming
        ? previous.elements
        : undefined;
    const elements = new Map();
    const rendered = blocks.map((block, index) => {
        const key = isStreaming ? `${index}:${signMarkdownNode(block)}` : block;
        const element = reusable?.has(key)
            ? reusable.get(key)
            : renderMarkdownBlock(block, index, context);
        elements.set(key, element);
        return element;
    });
    cache.current = { context, isStreaming, elements };
    return rendered;
}
//# sourceMappingURL=markdown-block-cache.js.map