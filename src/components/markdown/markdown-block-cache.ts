'use client';
import { useRef, type ReactNode } from 'react';
import type { MarkdownBlock } from './markdown-nodes.js';
import { renderMarkdownBlock, type RenderContext } from './markdown-render.js';

interface BlockCache {
  context: RenderContext;
  isStreaming: boolean;
  /** Elements by block. */
  elements: Map<MarkdownBlock, ReactNode>;
  /** While streaming, elements of the blocks parsed afresh, by position and signature. */
  signed: Map<string, ReactNode>;
}

/** Closes the fields of an object or an array in a signature. */
const closing = Symbol('closing');

/**
 * A string that differs whenever the node or any node below it differs, built without recursive
 * calls so a deeply nested block cannot overflow the stack.
 */
export function signMarkdownNode(node: object): string {
  const parts: string[] = [];
  const pending: unknown[] = [node];
  while (pending.length > 0) {
    const value = pending.pop();
    if (value === closing) {
      parts.push(')');
    } else if (typeof value === 'object' && value !== null) {
      const fields = Array.isArray(value) ? value : Object.entries(value).flat();
      parts.push('(');
      pending.push(closing);
      for (let index = fields.length - 1; index >= 0; index -= 1) pending.push(fields[index]);
    } else {
      parts.push(`${JSON.stringify(value) ?? 'null'},`);
    }
  }
  return parts.join('');
}

/**
 * The elements of the document's top-level blocks. A block the previous render drew in the same
 * rendering context reuses its element, so React skips it and `renderNode` is not called for its
 * nodes again: the same block object, or while streaming, a block of the same content at the same
 * position. Only blocks parsed afresh are signed, so the settled start of a stream costs nothing.
 */
export function useMarkdownBlocks(
  blocks: readonly MarkdownBlock[],
  context: RenderContext,
  isStreaming: boolean,
): ReactNode[] {
  const cache = useRef<BlockCache | null>(null);
  const previous = cache.current;
  const reusable =
    previous?.context === context && previous.isStreaming === isStreaming ? previous : undefined;
  const next: BlockCache = { context, isStreaming, elements: new Map(), signed: new Map() };
  const rendered = blocks.map((block, index) => {
    let element: ReactNode;
    if (reusable?.elements.has(block)) {
      element = reusable.elements.get(block);
    } else if (isStreaming) {
      const key = `${index}:${signMarkdownNode(block)}`;
      element = reusable?.signed.has(key)
        ? reusable.signed.get(key)
        : renderMarkdownBlock(block, index, context);
      next.signed.set(key, element);
    } else {
      element = renderMarkdownBlock(block, index, context);
    }
    next.elements.set(block, element);
    return element;
  });
  cache.current = next;
  return rendered;
}
