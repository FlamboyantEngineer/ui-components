// A DOM-free parser for SVG markup strings. It reads the subset of XML that icon and illustration
// files use and returns a plain, frozen tree that React can render without innerHTML.

export interface SvgElementNode {
  readonly type: 'element';
  /** The tag name as written (`path`, `linearGradient`). The root is always `svg`. */
  readonly tag: string;
  /** Attributes as written in the markup, with entities decoded. */
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: readonly SvgNode[];
}

export interface SvgTextNode {
  readonly type: 'text';
  readonly text: string;
}

export type SvgNode = SvgElementNode | SvgTextNode;

interface MutableElement {
  type: 'element';
  tag: string;
  attributes: Record<string, string>;
  children: Array<MutableElement | SvgTextNode>;
}

const TAG = /<(\/)?([A-Za-z_][\w:.-]*)((?:[^<>"']|"[^"]*"|'[^']*')*?)(\/)?>/y;
const ATTRIBUTE = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const ENTITY = /&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi;
const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/** Elements whose whole subtree is dropped: scripts and embedded HTML. */
const DROPPED_ELEMENTS = new Set(['script', 'foreignobject']);
const URL_ATTRIBUTES = new Set(['href', 'xlink:href', 'src']);

function decodeEntities(text: string): string {
  return text.replace(ENTITY, (match, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith('#x')) return codePoint(Number.parseInt(lower.slice(2), 16), match);
    if (lower.startsWith('#')) return codePoint(Number.parseInt(lower.slice(1), 10), match);
    return NAMED_ENTITIES[lower] ?? match;
  });
}

function codePoint(value: number, fallback: string): string {
  try {
    return String.fromCodePoint(value);
  } catch {
    return fallback;
  }
}

function isUnsafeUrl(value: string): boolean {
  // Browsers ignore control characters and whitespace inside a scheme.
  let compact = '';
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code > 0x20 && code !== 0x7f) compact += char.toLowerCase();
    if (compact.length >= 11) break;
  }
  return compact.startsWith('javascript:') || compact.startsWith('vbscript:');
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of source.matchAll(ATTRIBUTE)) {
    const name = match[1];
    if (!name || name in attributes) continue;
    if (/^on/i.test(name)) continue;
    const value = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
    if (URL_ATTRIBUTES.has(name.toLowerCase()) && isUnsafeUrl(value)) continue;
    attributes[name] = value;
  }
  return attributes;
}

/** Index just past the `>` that closes a declaration such as a doctype with an internal subset. */
function endOfDeclaration(markup: string, start: number): number {
  let depth = 0;
  for (let index = start; index < markup.length; index += 1) {
    const char = markup[index];
    if (char === '[') depth += 1;
    else if (char === ']') depth = Math.max(0, depth - 1);
    else if (char === '>' && depth === 0) return index + 1;
  }
  return markup.length;
}

function freeze(node: MutableElement | SvgTextNode): SvgNode {
  if (node.type === 'text') return Object.freeze(node);
  return Object.freeze({
    type: 'element',
    tag: node.tag,
    attributes: Object.freeze(node.attributes),
    children: Object.freeze(node.children.map(freeze)),
  });
}

function parseTree(markup: string): SvgElementNode {
  const root: MutableElement = { type: 'element', tag: '#document', attributes: {}, children: [] };
  const stack: MutableElement[] = [root];
  const current = () => stack[stack.length - 1] ?? root;
  const addText = (text: string) => {
    if (text.trim() === '' || stack.length === 1) return;
    current().children.push({ type: 'text', text });
  };

  let index = 0;
  while (index < markup.length) {
    const open = markup.indexOf('<', index);
    if (open === -1) {
      addText(decodeEntities(markup.slice(index)));
      break;
    }
    if (open > index) addText(decodeEntities(markup.slice(index, open)));

    if (markup.startsWith('<!--', open)) {
      const end = markup.indexOf('-->', open + 4);
      index = end === -1 ? markup.length : end + 3;
      continue;
    }
    if (markup.startsWith('<![CDATA[', open)) {
      const end = markup.indexOf(']]>', open + 9);
      addText(markup.slice(open + 9, end === -1 ? markup.length : end));
      index = end === -1 ? markup.length : end + 3;
      continue;
    }
    if (markup.startsWith('<?', open)) {
      const end = markup.indexOf('?>', open + 2);
      index = end === -1 ? markup.length : end + 2;
      continue;
    }
    if (markup.startsWith('<!', open)) {
      index = endOfDeclaration(markup, open + 2);
      continue;
    }

    TAG.lastIndex = open;
    const match = TAG.exec(markup);
    if (!match) {
      addText('<');
      index = open + 1;
      continue;
    }
    index = TAG.lastIndex;
    const [, closing, tag = '', attributeSource = '', selfClosing] = match;

    if (closing) {
      // Close the nearest open element with this name, and any left open inside it.
      const at = stack.findLastIndex((element, position) => position > 0 && element.tag === tag);
      if (at > 0) stack.length = at;
      continue;
    }

    if (DROPPED_ELEMENTS.has(tag.toLowerCase())) {
      if (!selfClosing) {
        const closer = new RegExp(`</${tag}\\s*>`, 'ig');
        closer.lastIndex = index;
        const end = closer.exec(markup);
        index = end ? closer.lastIndex : markup.length;
      }
      continue;
    }

    const element: MutableElement = {
      type: 'element',
      tag,
      attributes: parseAttributes(attributeSource),
      children: [],
    };
    current().children.push(element);
    if (!selfClosing) stack.push(element);
  }

  const svg = root.children.find(
    (child): child is MutableElement =>
      child.type === 'element' && child.tag.toLowerCase() === 'svg',
  );
  if (!svg) throw new Error('SVG markup must contain a root <svg> element.');
  return freeze({ ...svg, tag: 'svg' }) as SvgElementNode;
}

const CACHE_LIMIT = 256;
const cache = new Map<string, SvgElementNode>();

/**
 * Parses SVG markup into a frozen element tree rooted at its `<svg>` element. Comments, processing
 * instructions and doctypes are dropped; CDATA becomes text; entities are decoded. Scripts, embedded
 * HTML (`foreignObject`), event-handler attributes and script URLs are dropped. Results are cached by
 * markup string, keeping the most recently used entries. Throws when the markup has no `<svg>` root.
 */
export function parseSvgMarkup(markup: string): SvgElementNode {
  const cached = cache.get(markup);
  if (cached) {
    cache.delete(markup);
    cache.set(markup, cached);
    return cached;
  }
  const tree = parseTree(markup);
  cache.set(markup, tree);
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
  return tree;
}
