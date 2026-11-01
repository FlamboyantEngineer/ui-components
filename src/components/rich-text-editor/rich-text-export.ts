// Plain text and HTML from a document, without a browser document, so a server can render them.

import type { DOMOutputSpec, Mark, Node } from 'prosemirror-model';
import type { RichTextNode } from './rich-text-document.js';
import { getEngineSchema } from './engine-schema.js';
import { getDefaultRichTextSchema, type RichTextSchema } from './rich-text-schema.js';

export interface RichTextExportOptions {
  /** The schema the document follows. Defaults to the default schema. */
  schema?: RichTextSchema | undefined;
}

const voidElements = new Set(['br', 'hr', 'img', 'input', 'col', 'wbr']);
const tagName = /^[a-z][a-z0-9-]*$/i;
const attributeName = /^[a-z_:][a-z0-9_.:-]*$/i;

function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}

function renderAttributes(attributes: Record<string, unknown>): string {
  return Object.entries(attributes)
    .filter(([name, value]) => attributeName.test(name) && value !== null && value !== undefined)
    .map(([name, value]) => ` ${name}="${escapeAttribute(String(value))}"`)
    .join('');
}

function isAttributes(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Writes a rendering spec as HTML, with `content` in its hole. */
function renderSpec(spec: DOMOutputSpec, content: string): string {
  if (typeof spec === 'string') return escapeText(spec);
  if (!Array.isArray(spec)) return content;
  const [name, ...rest] = spec as readonly [string, ...unknown[]];
  if (!tagName.test(name)) return content;
  const attributes = isAttributes(rest[0]) ? rest.shift() : {};
  const children = rest
    .map((child) => (child === 0 ? content : renderSpec(child as DOMOutputSpec, content)))
    .join('');
  const open = `<${name}${renderAttributes(attributes as Record<string, unknown>)}>`;
  return voidElements.has(name) ? open : `${open}${children}</${name}>`;
}

// The hole of a mark's element while its open and close tags are split apart. Rendered text and
// attribute values escape `<`, and every tag the export writes names its element, so `<>` never
// appears in rendered HTML otherwise, whatever characters a mark's attributes hold.
const contentHole = '<>';

function renderMarkOpen(mark: Mark): { open: string; close: string } {
  const spec = mark.type.spec.toDOM?.(mark, true) ?? ['span', 0];
  const html = renderSpec(spec, contentHole);
  const at = html.indexOf(contentHole);
  if (at < 0) return { open: html, close: '' };
  return { open: html.slice(0, at), close: html.slice(at + contentHole.length) };
}

/** The inline content of a text block, with runs of shared marks kept in one element. */
function renderInline(node: Node): string {
  let html = '';
  let active: Array<{ mark: Mark; close: string }> = [];
  node.forEach((child) => {
    let keep = 0;
    while (keep < active.length && keep < child.marks.length) {
      if (!active[keep]?.mark.eq(child.marks[keep] as Mark)) break;
      keep += 1;
    }
    for (const { close } of active.slice(keep).reverse()) html += close;
    active = active.slice(0, keep);
    for (const mark of child.marks.slice(keep)) {
      const { open, close } = renderMarkOpen(mark);
      html += open;
      active.push({ mark, close });
    }
    html += child.isText ? escapeText(child.text ?? '') : renderNode(child);
  });
  for (const { close } of active.reverse()) html += close;
  return html;
}

function renderNode(node: Node): string {
  let content = '';
  if (node.inlineContent) content = renderInline(node);
  else node.forEach((child) => (content += renderNode(child)));
  const spec = node.type.spec.toDOM?.(node);
  return spec ? renderSpec(spec, content) : content;
}

function readDocument(document: RichTextNode, options: RichTextExportOptions): Node {
  const schema = getEngineSchema(options.schema ?? getDefaultRichTextSchema());
  return schema.nodeFromJSON(document);
}

/**
 * The document as HTML, rendered as each node and mark type renders itself. Text and attribute
 * values are escaped and links keep only safe addresses.
 */
export function serializeRichTextHtml(
  document: RichTextNode,
  options: RichTextExportOptions = {},
): string {
  return renderNode(readDocument(document, options));
}

/** The document's text: one line per text block, and a line break for each hard break. */
export function serializeRichTextText(
  document: RichTextNode,
  options: RichTextExportOptions = {},
): string {
  const doc = readDocument(document, options);
  return doc.textBetween(0, doc.content.size, '\n');
}
