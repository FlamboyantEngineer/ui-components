// The default node and mark types, named as most ProseMirror-based editors name them so their JSON
// documents load as they are.

import type { MarkSpec, NodeSpec } from 'prosemirror-model';
import { clamp } from '../../utils/clamp.js';
import { isSafeUrl } from '../../utils/safe-url.js';

const headingLevels = [1, 2, 3] as const;

function readHref(element: HTMLElement) {
  const href = element.getAttribute('href');
  return href !== null && isSafeUrl(href) ? { href, title: element.getAttribute('title') } : false;
}

/** Reads an `<ol start>` attribute: any whole number, 0 and negatives included, else 1. */
function toListStart(value: string | null) {
  const start = value === null || value.trim() === '' ? 1 : Number(value);
  return Number.isSafeInteger(start) ? start : 1;
}

/** A default link's anchor attributes: its `href` when it is safe, and its `title`. */
export function toLinkAttributes(attrs: Readonly<Record<string, unknown>>): {
  href?: string;
  title?: string;
} {
  const href = String(attrs.href);
  return {
    ...(isSafeUrl(href) ? { href } : {}),
    ...(attrs.title === null || attrs.title === undefined ? {} : { title: String(attrs.title) }),
  };
}

/** The default block and inline node types, in the order the schema tries them. */
export const defaultNodes: Record<string, NodeSpec> = {
  doc: { content: 'block+' },
  paragraph: {
    group: 'block',
    content: 'inline*',
    parseDOM: [{ tag: 'p' }],
    toDOM: () => ['p', 0],
  },
  heading: {
    group: 'block',
    content: 'inline*',
    attrs: { level: { default: 1 } },
    defining: true,
    parseDOM: [
      ...headingLevels.map((level) => ({ tag: `h${level}`, attrs: { level } })),
      { tag: 'h4', attrs: { level: 3 } },
      { tag: 'h5', attrs: { level: 3 } },
      { tag: 'h6', attrs: { level: 3 } },
    ],
    toDOM: (node) => [`h${clamp(Number(node.attrs.level) || 1, 1, 3)}`, 0],
  },
  blockquote: {
    group: 'block',
    content: 'block+',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM: () => ['blockquote', 0],
  },
  codeBlock: {
    group: 'block',
    content: 'text*',
    marks: '',
    code: true,
    defining: true,
    parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
    toDOM: () => ['pre', ['code', 0]],
  },
  horizontalRule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM: () => ['hr'],
  },
  bulletList: {
    group: 'block list',
    content: 'listItem+',
    parseDOM: [{ tag: 'ul:not([data-type="taskList"])' }],
    toDOM: () => ['ul', 0],
  },
  orderedList: {
    group: 'block list',
    content: 'listItem+',
    attrs: { start: { default: 1 } },
    parseDOM: [
      {
        tag: 'ol',
        getAttrs: (element) => ({ start: toListStart(element.getAttribute('start')) }),
      },
    ],
    toDOM: (node) => ['ol', node.attrs.start === 1 ? {} : { start: String(node.attrs.start) }, 0],
  },
  listItem: {
    content: 'paragraph block*',
    defining: true,
    parseDOM: [{ tag: 'li:not([data-type="taskItem"])' }],
    toDOM: () => ['li', 0],
  },
  taskList: {
    group: 'block list',
    content: 'taskItem+',
    parseDOM: [{ tag: 'ul[data-type="taskList"]', priority: 60 }],
    toDOM: () => ['ul', { 'data-type': 'taskList' }, 0],
  },
  taskItem: {
    content: 'paragraph block*',
    defining: true,
    attrs: { checked: { default: false } },
    parseDOM: [
      {
        tag: 'li[data-type="taskItem"]',
        priority: 60,
        getAttrs: (element) => ({ checked: element.getAttribute('data-checked') === 'true' }),
      },
    ],
    toDOM: (node) => [
      'li',
      { 'data-type': 'taskItem', 'data-checked': String(node.attrs.checked === true) },
      [
        'label',
        [
          'input',
          {
            type: 'checkbox',
            disabled: '',
            ...(node.attrs.checked === true ? { checked: '' } : {}),
          },
        ],
      ],
      ['div', 0],
    ],
  },
  text: { group: 'inline' },
  hardBreak: {
    group: 'inline',
    inline: true,
    selectable: false,
    leafText: () => '\n',
    parseDOM: [{ tag: 'br' }],
    toDOM: () => ['br'],
  },
};

/** The default marks, in the order they nest: a link wraps bold text, which wraps italic text. */
export const defaultMarks: Record<string, MarkSpec> = {
  link: {
    attrs: { href: {}, title: { default: null } },
    inclusive: false,
    parseDOM: [{ tag: 'a[href]', getAttrs: readHref }],
    toDOM: (mark) => ['a', toLinkAttributes(mark.attrs), 0],
  },
  bold: {
    parseDOM: [
      { tag: 'strong' },
      { tag: 'b', getAttrs: (element) => element.style.fontWeight !== 'normal' && null },
      { style: 'font-weight=bold' },
      { style: 'font-weight', getAttrs: (value) => /^(bold(er)?|[6-9]\d{2})$/.test(value) && null },
    ],
    toDOM: () => ['strong', 0],
  },
  italic: {
    parseDOM: [{ tag: 'em' }, { tag: 'i' }, { style: 'font-style=italic' }],
    toDOM: () => ['em', 0],
  },
  underline: {
    parseDOM: [{ tag: 'u' }, { style: 'text-decoration=underline' }],
    toDOM: () => ['u', 0],
  },
  strike: {
    parseDOM: [{ tag: 's' }, { tag: 'del' }, { style: 'text-decoration=line-through' }],
    toDOM: () => ['s', 0],
  },
  code: {
    excludes: '_',
    code: true,
    parseDOM: [{ tag: 'code' }],
    toDOM: () => ['code', 0],
  },
};
