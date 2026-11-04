import { describe, expect, it } from 'vitest';
import { createHeadingIdAllocator, listMarkdownHeadings } from './markdown-headings.js';
import type { MarkdownBlock, MarkdownInline } from './markdown-nodes.js';
import { parseMarkdown } from './parse-markdown.js';

function blocks(source: string): readonly MarkdownBlock[] {
  return parseMarkdown(source).children;
}

function inlines(source: string): readonly MarkdownInline[] {
  const [first] = blocks(source);
  if (first?.type !== 'paragraph') throw new Error(`expected a paragraph, got ${first?.type}`);
  return first.children;
}

const text = (value: string) => ({ type: 'text', text: value });

describe('parseMarkdown', () => {
  it('UIC-MARKDOWN-1.10 UIC-MARKDOWN-1.12 keeps a hundred thousand spans, including unsafe-link text', () => {
    const content = '`x` '.repeat(100_000).trimEnd();
    for (const source of [content, `[${content}](javascript:noop)`]) {
      const nodes = inlines(source);
      expect(nodes).toHaveLength(199_999);
      expect(nodes.filter((node) => node.type === 'inlineCode')).toHaveLength(100_000);
      expect(nodes[0]).toEqual({ type: 'inlineCode', text: 'x' });
      expect(nodes.at(-1)).toEqual({ type: 'inlineCode', text: 'x' });
      expect(nodes.some((node) => node.type === 'link')).toBe(false);
    }
  });

  it('UIC-MARKDOWN-1.1 UIC-MARKDOWN-1.2 freezes and names deeply nested inline formatting', () => {
    const document = parseMarkdown(`# ${'*'.repeat(40_000)}Text${'*'.repeat(40_000)}`);
    expect(listMarkdownHeadings(document)).toEqual([{ id: 'text', label: 'Text', level: 1 }]);
    const heading = document.children[0];
    if (heading?.type !== 'heading') throw new Error('expected a heading');
    let nodes = heading.children;
    let depth = 0;
    while (nodes[0] && 'children' in nodes[0]) {
      nodes = nodes[0].children;
      depth += 1;
    }
    expect(depth).toBe(20_000);
    expect(nodes).toEqual([text('Text')]);
    expect(Object.isFrozen(nodes[0])).toBe(true);
  });

  it('UIC-MARKDOWN-1.6 keeps list paragraphs separated by two hundred thousand blank lines', () => {
    const [list] = blocks(`- first\n${'\n'.repeat(200_000)}  final`);
    if (list?.type !== 'list') throw new Error('expected a list');
    expect(list.children[0]?.children).toEqual([
      { type: 'paragraph', children: [text('first')] },
      { type: 'paragraph', children: [text('final')] },
    ]);
    expect(list.tight).toBe(false);
  });

  it('UIC-MARKDOWN-1.2 allocates repeated heading ids without colliding with suffix-like titles', () => {
    const allocate = createHeadingIdAllocator();
    expect(['Title', 'Title-2', 'Title', 'Title-3', 'Title'].map(allocate)).toEqual([
      'title',
      'title-2',
      'title-3',
      'title-3-2',
      'title-4',
    ]);
    const repeated = Array.from({ length: 20_000 }, () => allocate('Repeated'));
    expect(new Set(repeated).size).toBe(20_000);
    expect(repeated.at(-1)).toBe('repeated-20000');
  });

  it('UIC-MARKDOWN-2.9 lists headings inside twenty thousand nested containers', () => {
    let children = blocks('## Nested');
    for (let depth = 0; depth < 20_000; depth += 1) children = [{ type: 'blockquote', children }];
    expect(listMarkdownHeadings({ type: 'document', children }, 'deep-')).toEqual([
      { id: 'deep-nested', label: 'Nested', level: 2 },
    ]);
  });

  it('UIC-MARKDOWN-1.1 UIC-MARKDOWN-1.5 parses five thousand nested block quotes', () => {
    const document = parseMarkdown(`${'> '.repeat(5_000)}# Nested`);
    let children = document.children;
    let depth = 0;
    while (children[0]?.type === 'blockquote') {
      depth += 1;
      children = children[0].children;
    }
    expect(depth).toBe(5_000);
    expect(children[0]).toMatchObject({ type: 'heading', id: 'nested' });
    expect(Object.isFrozen(children[0])).toBe(true);
  });

  it('UIC-MARKDOWN-1.2 UIC-MARKDOWN-1.11 preserves source order for nested definitions and repeated headings', () => {
    const source = [
      '- ## Repeated',
      '  [guide]: /first',
      '  [guide]',
      '- ## Repeated',
      '  > ### Repeated',
      '  > [guide]: /second',
      '  > [guide]',
      '',
      '## Repeated',
      '[guide]: /third',
      '[guide]',
    ].join('\n');
    const document = parseMarkdown(source);
    expect(listMarkdownHeadings(document).map((heading) => heading.id)).toEqual([
      'repeated',
      'repeated-2',
      'repeated-3',
      'repeated-4',
    ]);
    const [list, , paragraph] = document.children;
    if (list?.type !== 'list' || paragraph?.type !== 'paragraph')
      throw new Error('expected list and paragraph');
    const first = list.children[0]?.children[1];
    const quote = list.children[1]?.children[1];
    if (first?.type !== 'paragraph' || quote?.type !== 'blockquote')
      throw new Error('expected nested paragraphs');
    const second = quote.children[1];
    if (second?.type !== 'paragraph') throw new Error('expected quoted paragraph');
    for (const block of [first, second, paragraph]) {
      expect(block.children).toEqual([
        { type: 'link', href: '/first', title: null, children: [text('guide')] },
      ]);
    }
  });

  it('UIC-MARKDOWN-1.1 returns a frozen document tree without touching the DOM', () => {
    const document = parseMarkdown('# Title\n\nSome *text*.');
    expect(document.type).toBe('document');
    expect(document.children.map((block) => block.type)).toEqual(['heading', 'paragraph']);
    expect(Object.isFrozen(document)).toBe(true);
    expect(Object.isFrozen(document.children[1])).toBe(true);
    const paragraph = document.children[1];
    if (paragraph?.type !== 'paragraph') throw new Error('expected a paragraph');
    expect(Object.isFrozen(paragraph.children[1])).toBe(true);
    expect(parseMarkdown('').children).toEqual([]);
    expect(parseMarkdown('a\r\nb\rc').children).toEqual([
      { type: 'paragraph', children: [text('a\nb\nc')] },
    ]);
  });

  it('UIC-MARKDOWN-1.2 reads ATX and setext headings with unique slug ids', () => {
    expect(
      blocks(
        '# Getting started\n## Install ##\n###### Six\n#No space\nCafé au lait\n===\nNotes\n---\n## Install\n# \u00a0',
      ),
    ).toEqual([
      { type: 'heading', level: 1, id: 'getting-started', children: [text('Getting started')] },
      { type: 'heading', level: 2, id: 'install', children: [text('Install')] },
      { type: 'heading', level: 6, id: 'six', children: [text('Six')] },
      {
        type: 'heading',
        level: 1,
        id: 'no-space-cafe-au-lait',
        children: [text('#No space\nCafé au lait')],
      },
      { type: 'heading', level: 2, id: 'notes', children: [text('Notes')] },
      { type: 'heading', level: 2, id: 'install-2', children: [text('Install')] },
      { type: 'heading', level: 1, id: 'section', children: [] },
    ]);
    const [styled] = blocks('## The `parse` *step*');
    expect(styled).toMatchObject({ id: 'the-parse-step' });
  });

  it('UIC-MARKDOWN-1.3 joins paragraph lines with soft breaks and reads hard breaks', () => {
    expect(blocks('one\n  two\n\nthree')).toEqual([
      { type: 'paragraph', children: [text('one\ntwo')] },
      { type: 'paragraph', children: [text('three')] },
    ]);
    expect(inlines('one  \ntwo\\\nthree   ')).toEqual([
      text('one'),
      { type: 'lineBreak' },
      text('two'),
      { type: 'lineBreak' },
      text('three'),
    ]);
  });

  it('UIC-MARKDOWN-1.4 reads fenced and indented code blocks verbatim', () => {
    expect(
      blocks(
        '```ts title="a"\nconst a = 1 < 2;\n\n  *not emphasis*\n```\n~~~\nplain\n~~~~\n    indented\n      more\n\n    end\n\n```js\nunclosed',
      ),
    ).toEqual([
      { type: 'codeBlock', language: 'ts', text: 'const a = 1 < 2;\n\n  *not emphasis*' },
      { type: 'codeBlock', language: null, text: 'plain' },
      { type: 'codeBlock', language: null, text: 'indented\n  more\n\nend' },
      { type: 'codeBlock', language: 'js', text: 'unclosed' },
    ]);
    expect(blocks('  ```\n  two\n   three\n ```')).toEqual([
      { type: 'codeBlock', language: null, text: 'two\n three' },
    ]);
    expect(blocks('Text\n    still text')).toEqual([
      { type: 'paragraph', children: [text('Text\nstill text')] },
    ]);
  });

  it('UIC-MARKDOWN-1.5 reads nested block quotes with lazy continuation lines', () => {
    expect(blocks('> # Quote\n> first\nlazy\n>> inner\n\n> second')).toEqual([
      {
        type: 'blockquote',
        children: [
          { type: 'heading', level: 1, id: 'quote', children: [text('Quote')] },
          { type: 'paragraph', children: [text('first\nlazy')] },
          { type: 'blockquote', children: [{ type: 'paragraph', children: [text('inner')] }] },
        ],
      },
      { type: 'blockquote', children: [{ type: 'paragraph', children: [text('second')] }] },
    ]);
  });

  it('UIC-MARKDOWN-1.6 reads bullet and ordered lists, nesting, start numbers and looseness', () => {
    const [bullets, , ordered] = blocks(
      '- one\n- two\n  - nested\n    more\n* other\n\n3. three\n4. four',
    );
    expect(bullets).toEqual({
      type: 'list',
      ordered: false,
      start: 1,
      tight: true,
      children: [
        {
          type: 'listItem',
          checked: null,
          children: [{ type: 'paragraph', children: [text('one')] }],
        },
        {
          type: 'listItem',
          checked: null,
          children: [
            { type: 'paragraph', children: [text('two')] },
            {
              type: 'list',
              ordered: false,
              start: 1,
              tight: true,
              children: [
                {
                  type: 'listItem',
                  checked: null,
                  children: [{ type: 'paragraph', children: [text('nested\nmore')] }],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(blocks('- one\n- two\n* other')[1]).toMatchObject({ type: 'list', ordered: false });
    expect(ordered).toMatchObject({ type: 'list', ordered: true, start: 3, tight: true });
    expect(blocks('- one\n\n- two')[0]).toMatchObject({ tight: false });
    expect(blocks('- one\n\n  more\n- two')[0]).toMatchObject({ tight: false });
    expect(blocks('- one\n  - a\n\n  - b\n- two')[0]).toMatchObject({ tight: true });
    expect(blocks('- one\n  ```\n  a\n\n  b\n  ```')[0]).toMatchObject({ tight: true });
    expect(blocks('Text\n2. not a list')).toHaveLength(1);
    expect(blocks('Text\n1. a list')[1]).toMatchObject({ type: 'list', ordered: true });
    expect(blocks('- a\n---\n- b').map((block) => block.type)).toEqual([
      'list',
      'thematicBreak',
      'list',
    ]);
  });

  it('UIC-MARKDOWN-1.7 reads task list items', () => {
    const [list] = blocks('- [ ] open\n- [x] done\n- [X] also done\n- [ ]\n- [y] plain');
    if (list?.type !== 'list') throw new Error('expected a list');
    expect(list.children.map((item) => item.checked)).toEqual([false, true, true, null, null]);
    expect(list.children[0]?.children).toEqual([{ type: 'paragraph', children: [text('open')] }]);
    expect(list.children[3]?.children).toEqual([{ type: 'paragraph', children: [text('[ ]')] }]);
  });

  it('UIC-MARKDOWN-1.8 reads pipe tables with alignment, escaped pipes and padded rows', () => {
    const [intro, table, after] = blocks(
      'Harvest\n| Fruit | Crates | Note |\n|:--|--:|:-:|\n| Apple | 12 | `a\\|b` |\n| Pear |\n\nAfter',
    );
    expect(intro).toEqual({ type: 'paragraph', children: [text('Harvest')] });
    expect(table).toEqual({
      type: 'table',
      align: ['start', 'end', 'center'],
      header: [[text('Fruit')], [text('Crates')], [text('Note')]],
      rows: [
        [[text('Apple')], [text('12')], [{ type: 'inlineCode', text: 'a|b' }]],
        [[text('Pear')], [], []],
      ],
    });
    expect(after).toEqual({ type: 'paragraph', children: [text('After')] });
    expect(blocks('a | b\n--- | ---\n1 | 2')[0]).toMatchObject({
      type: 'table',
      align: [null, null],
    });
    expect(blocks('| a | b |\n| --- |')[0]).toMatchObject({ type: 'paragraph' });
  });

  it('UIC-MARKDOWN-1.8 preserves mixed escaped pipes and code while discarding surplus cells', () => {
    expect(
      blocks('| Label | Note |\n| --- | ---: |\n| A\\|B | text `c\\|d` end | extra |'),
    ).toEqual([
      {
        type: 'table',
        align: [null, 'end'],
        header: [[text('Label')], [text('Note')]],
        rows: [[[text('A|B')], [text('text '), { type: 'inlineCode', text: 'c|d' }, text(' end')]]],
      },
    ]);
  });

  it('UIC-MARKDOWN-1.9 reads thematic breaks', () => {
    expect(blocks('***\n- - -\n___\n**').map((block) => block.type)).toEqual([
      'thematicBreak',
      'thematicBreak',
      'thematicBreak',
      'paragraph',
    ]);
  });

  it('UIC-MARKDOWN-1.10 reads emphasis, strong, strikethrough, code spans, escapes and entities', () => {
    expect(
      inlines(
        '*em* __strong__ ***both*** ~~gone~~ `a ``b`` c` \\*lit\\* &amp; &copy; &#x41; &bogus;',
      ),
    ).toEqual([
      { type: 'emphasis', children: [text('em')] },
      text(' '),
      { type: 'strong', children: [text('strong')] },
      text(' '),
      { type: 'emphasis', children: [{ type: 'strong', children: [text('both')] }] },
      text(' '),
      { type: 'strikethrough', children: [text('gone')] },
      text(' '),
      { type: 'inlineCode', text: 'a ``b`` c' },
      text(' *lit* & © A &bogus;'),
    ]);
    expect(inlines('snake_case_name and 2*3*4 and * spaced *')).toEqual([
      text('snake_case_name and 2'),
      { type: 'emphasis', children: [text('3')] },
      text('4 and * spaced *'),
    ]);
    expect(inlines('**unclosed and `unclosed')).toEqual([text('**unclosed and `unclosed')]);
    expect(inlines('*a **b** c*')).toEqual([
      {
        type: 'emphasis',
        children: [text('a '), { type: 'strong', children: [text('b')] }, text(' c')],
      },
    ]);
    expect(inlines('a ~~~three~~~ ~one~')).toEqual([
      text('a ~~~three~~~ '),
      { type: 'strikethrough', children: [text('one')] },
    ]);
  });

  it('UIC-MARKDOWN-1.11 reads inline, reference and automatic links and images', () => {
    const source = [
      'See [the *guide*](/docs/guide "Guide") and [ref][Docs], [docs][], [Docs].',
      "![A pear](https://example.com/pear.png 'Pear') <https://example.com> <mail@example.com>",
      '[nested [brackets]](</a b>) [missing][none] [link [inner](/in)](/out)',
      '',
      '[docs]: https://example.com/docs "Manual"',
    ].join('\n');
    const nodes = inlines(source);
    expect(nodes.slice(0, 8)).toEqual([
      text('See '),
      {
        type: 'link',
        href: '/docs/guide',
        title: 'Guide',
        children: [text('the '), { type: 'emphasis', children: [text('guide')] }],
      },
      text(' and '),
      { type: 'link', href: 'https://example.com/docs', title: 'Manual', children: [text('ref')] },
      text(', '),
      { type: 'link', href: 'https://example.com/docs', title: 'Manual', children: [text('docs')] },
      text(', '),
      { type: 'link', href: 'https://example.com/docs', title: 'Manual', children: [text('Docs')] },
    ]);
    expect(nodes.slice(8, 14)).toEqual([
      text('.\n'),
      { type: 'image', src: 'https://example.com/pear.png', alt: 'A pear', title: 'Pear' },
      text(' '),
      {
        type: 'link',
        href: 'https://example.com',
        title: null,
        children: [text('https://example.com')],
      },
      text(' '),
      {
        type: 'link',
        href: 'mailto:mail@example.com',
        title: null,
        children: [text('mail@example.com')],
      },
    ]);
    expect(nodes.slice(14)).toEqual([
      text('\n'),
      { type: 'link', href: '/a b', title: null, children: [text('nested [brackets]')] },
      text(' [missing][none] [link '),
      { type: 'link', href: '/in', title: null, children: [text('inner')] },
      text('](/out)'),
    ]);
    expect(blocks('[only]: /x')).toEqual([]);
  });

  it('UIC-MARKDOWN-1.12 keeps raw HTML as text and drops unsafe link and image URLs', () => {
    expect(blocks('<script>alert(1)</script>\n\n<b>bold</b>')).toEqual([
      { type: 'paragraph', children: [text('<script>alert(1)</script>')] },
      { type: 'paragraph', children: [text('<b>bold</b>')] },
    ]);
    expect(
      inlines(
        '[click](javascript:alert(1)) [tab](java\tscript:x) ![x](data:image/png;base64,AA) <javascript:alert(1)> [ok](mailto:a@b.c)',
      ),
    ).toEqual([
      text('click [tab](java\tscript:x) x javascript:alert(1) '),
      { type: 'link', href: 'mailto:a@b.c', title: null, children: [text('ok')] },
    ]);
  });

  it('UIC-MARKDOWN-2.9 lists the headings for an outline, with the heading id prefix', () => {
    const document = parseMarkdown('# Guide\n\n> ## Quoted `code`\n\n- ### In a list\n\n## Guide');
    expect(listMarkdownHeadings(document)).toEqual([
      { id: 'guide', label: 'Guide', level: 1 },
      { id: 'quoted-code', label: 'Quoted code', level: 2 },
      { id: 'in-a-list', label: 'In a list', level: 3 },
      { id: 'guide-2', label: 'Guide', level: 2 },
    ]);
    expect(listMarkdownHeadings(document, 'doc-')[0]?.id).toBe('doc-guide');
  });
});
