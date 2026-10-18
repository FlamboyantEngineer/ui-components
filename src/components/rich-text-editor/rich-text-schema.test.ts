import { DOMParser, DOMSerializer } from 'prosemirror-model';
import { describe, expect, it } from 'vitest';
import { getEngineSchema } from './engine-schema.js';
import { createRichTextSchema, type RichTextSchema } from './rich-text-schema.js';

/** Parses HTML as pasted content is parsed. */
function parse(html: string, schema: RichTextSchema = createRichTextSchema()) {
  const container = document.createElement('div');
  container.innerHTML = html;
  return DOMParser.fromSchema(getEngineSchema(schema)).parse(container).toJSON();
}

/** Renders a document's JSON with the schema's renderers. */
function render(json: unknown, schema: RichTextSchema = createRichTextSchema()) {
  const engine = getEngineSchema(schema);
  const container = document.createElement('div');
  const fragment = DOMSerializer.fromSchema(engine).serializeFragment(
    engine.nodeFromJSON(json).content,
  );
  container.append(fragment);
  return container.innerHTML;
}

describe('createRichTextSchema', () => {
  it('UIC-RICH-TEXT-EDITOR-2.1 holds the default nodes and marks, named for common JSON', () => {
    const schema = createRichTextSchema();
    expect(schema.nodes).toEqual([
      'doc',
      'paragraph',
      'heading',
      'blockquote',
      'codeBlock',
      'horizontalRule',
      'bulletList',
      'orderedList',
      'listItem',
      'taskList',
      'taskItem',
      'text',
      'hardBreak',
    ]);
    expect(schema.marks).toEqual(['link', 'bold', 'italic', 'underline', 'strike', 'code']);
  });

  it('UIC-RICH-TEXT-EDITOR-2.1 parses and renders standard HTML', () => {
    const html =
      '<h2>Fruit</h2><p><strong>Ripe</strong> <em>pears</em> <u>and</u> <s>figs</s> <code>x</code><br>next</p>' +
      '<ol start="3"><li><p>Plums</p></li></ol><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Pick</p></li></ul>' +
      '<blockquote><p>Quote</p></blockquote><pre>let x</pre><hr>';
    const json = parse(html);
    expect(json.content.map((node: { type: string }) => node.type)).toEqual([
      'heading',
      'paragraph',
      'orderedList',
      'taskList',
      'blockquote',
      'codeBlock',
      'horizontalRule',
    ]);
    expect(json.content[0].attrs).toEqual({ level: 2 });
    expect(json.content[2].attrs).toEqual({ start: 3 });
    expect(json.content[3].content[0].attrs).toEqual({ checked: true });
    expect(
      json.content[1].content.map(
        (node: { marks?: Array<{ type: string }> }) => node.marks?.[0]?.type,
      ),
    ).toEqual([
      'bold',
      undefined,
      'italic',
      undefined,
      'underline',
      undefined,
      'strike',
      undefined,
      'code',
      undefined,
      undefined,
    ]);
    expect(render(json)).toBe(
      '<h2>Fruit</h2><p><strong>Ripe</strong> <em>pears</em> <u>and</u> <s>figs</s> <code>x</code><br>next</p>' +
        '<ol start="3"><li><p>Plums</p></li></ol><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" disabled="" checked=""></label><div><p>Pick</p></div></li></ul>' +
        '<blockquote><p>Quote</p></blockquote><pre><code>let x</code></pre><hr>',
    );
  });

  it('UIC-RICH-TEXT-EDITOR-2.1 keeps only safe link addresses', () => {
    const json = parse(
      '<p><a href="https://example.com" title="Site">a</a><a href="javascript:alert(1)">b</a></p>',
    );
    expect(json.content[0].content[0].marks).toEqual([
      { type: 'link', attrs: { href: 'https://example.com', title: 'Site' } },
    ]);
    expect(json.content[0].content[1].marks).toBeUndefined();
    const unsafe = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'c', marks: [{ type: 'link', attrs: { href: 'javascript:x' } }] },
          ],
        },
      ],
    };
    expect(render(unsafe)).toBe('<p><a rel="noopener nofollow">c</a></p>');
  });

  it('UIC-RICH-TEXT-EDITOR-2.2 adds, replaces and removes node and mark types', () => {
    const schema = createRichTextSchema({
      nodes: {
        codeBlock: null,
        doc: null,
        heading: {
          group: 'block',
          content: 'text*',
          attrs: { level: { default: 2 } },
          parseDOM: [{ tag: 'h1' }, { tag: 'h2' }],
          toDOM: (element) => ['h2', { 'data-level': String(element.attrs.level) }, 0],
        },
        note: {
          group: 'block',
          content: 'paragraph+',
          parseDOM: [
            {
              tag: 'aside',
              getAttrs: (element) => (element.hasAttribute('hidden') ? false : null),
            },
          ],
          toDOM: (element) => ['aside', { 'data-type': element.type }, 0],
        },
      },
      marks: {
        strike: null,
        highlight: {
          excludes: 'code',
          parseDOM: [{ tag: 'mark', priority: 60 }],
          toDOM: () => ['mark', 0],
        },
      },
    });
    expect(schema.nodes).toContain('doc');
    expect(schema.nodes).not.toContain('codeBlock');
    expect(schema.nodes.indexOf('heading')).toBe(2);
    expect(schema.nodes.at(-1)).toBe('note');
    expect(schema.marks).toEqual(['link', 'bold', 'italic', 'underline', 'code', 'highlight']);
    const json = parse(
      '<h1>Title</h1><aside><p>Note <mark>this</mark></p></aside><aside hidden><p>x</p></aside>',
      schema,
    );
    expect(json.content[0]).toEqual({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Title' }],
    });
    expect(json.content[1].type).toBe('note');
    expect(json.content[1].content[0].content[1].marks).toEqual([{ type: 'highlight' }]);
    expect(render(json, schema)).toContain('<h2 data-level="2">Title</h2><aside data-type="note">');
  });

  it('UIC-RICH-TEXT-EDITOR-2.2 refuses schemas it did not create', () => {
    expect(() => getEngineSchema({ nodes: [], marks: [] })).toThrow(/createRichTextSchema/);
  });
});
