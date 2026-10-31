// The editor's document as plain data: ProseMirror's JSON, typed by the library.

/** A value a node or mark attribute holds. */
export type RichTextAttributeValue = string | number | boolean | null;

/** A node's or a mark's attributes, by name. */
export interface RichTextAttributes {
  readonly [name: string]: RichTextAttributeValue;
}

/** A mark on a text node, such as `{ type: 'link', attrs: { href: '/a' } }`. */
export interface RichTextMark {
  type: string;
  attrs?: RichTextAttributes | undefined;
}

/** A node of the document: a block, an inline node or a run of text with its marks. */
export interface RichTextNode {
  type: string;
  attrs?: RichTextAttributes | undefined;
  content?: readonly RichTextNode[] | undefined;
  /** The characters of a `text` node. */
  text?: string | undefined;
  marks?: readonly RichTextMark[] | undefined;
}

/** A whole document: its top node, `doc`, holding the blocks. */
export interface RichTextDocument extends RichTextNode {
  type: 'doc';
}

/** Own keys whose value is set: an `undefined` attribute or list counts as absent. */
function setKeys(value: object): string[] {
  return Object.keys(value).filter((key) => (value as Record<string, unknown>)[key] !== undefined);
}

/** Whether two JSON-like values hold the same data, an `undefined` key counting as absent. */
export function isSameData(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (typeof left !== 'object' || typeof right !== 'object' || !left || !right) return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => isSameData(item, right[index]))
    );
  }
  const keys = setKeys(left);
  return (
    keys.length === setKeys(right).length &&
    keys.every((key) =>
      isSameData((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
    )
  );
}

/**
 * Whether two documents (or nodes) are the same by structure; key order does not count. It stops at
 * the first difference and skips every part the two share, so comparing a document with an edit of
 * it, which keeps its unchanged blocks (UIC-RICH-TEXT-EDITOR-1.3), visits only the edited path.
 */
export function isRichTextEqual(left: RichTextNode, right: RichTextNode): boolean {
  return isSameData(left, right);
}
