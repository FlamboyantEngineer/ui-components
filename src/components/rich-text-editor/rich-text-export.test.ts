// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { RichTextDocument } from './rich-text-document.js';
import { serializeRichTextHtml, serializeRichTextText } from './rich-text-export.js';
import { createRichTextSchema } from './rich-text-schema.js';

const document: RichTextDocument = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Pears & <figs>' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Ripe ' },
        { type: 'text', text: 'and', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' sweet', marks: [{ type: 'bold' }, { type: 'italic' }] },
        { type: 'hardBreak' },
        {
          type: 'text',
          text: 'market',
          marks: [{ type: 'link', attrs: { href: '/m?a=1&b="2"', title: null } }],
        },
      ],
    },
    { type: 'horizontalRule' },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Plums' }] }],
        },
      ],
    },
  ],
};

describe('rich-text export', () => {
  it('UIC-RICH-TEXT-EDITOR-10.1 renders HTML without a browser, escaping text and attributes', () => {
    expect(typeof globalThis.document).toBe('undefined');
    expect(serializeRichTextHtml(document)).toBe(
      '<h2>Pears &amp; &lt;figs&gt;</h2>' +
        '<p>Ripe <strong>and<em> sweet</em></strong><br>' +
        '<a href="/m?a=1&amp;b=&quot;2&quot;">market</a></p>' +
        '<hr><ul><li><p>Plums</p></li></ul>',
    );
  });

  it('UIC-RICH-TEXT-EDITOR-10.1 keeps a mark element whole whatever characters its attributes hold', () => {
    const marked = (title: string): RichTextDocument => ({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'market',
              marks: [{ type: 'link', attrs: { href: '/m', title } }],
            },
            { type: 'text', text: ' after' },
          ],
        },
      ],
    });
    expect(serializeRichTextHtml(marked('A\u0000B'))).toBe(
      '<p><a href="/m" title="A\u0000B">market</a> after</p>',
    );
    expect(serializeRichTextHtml(marked('<> & \u0000<>'))).toBe(
      '<p><a href="/m" title="&lt;&gt; &amp; \u0000&lt;&gt;">market</a> after</p>',
    );
  });

  it('UIC-RICH-TEXT-EDITOR-10.1 renders a caller schema with its own renderers', () => {
    const schema = createRichTextSchema({
      nodes: {
        note: { group: 'block', content: 'text*', toDOM: () => ['aside', { class: 'note' }, 0] },
      },
    });
    const html = serializeRichTextHtml(
      { type: 'doc', content: [{ type: 'note', content: [{ type: 'text', text: 'Hi' }] }] },
      { schema },
    );
    expect(html).toBe('<aside class="note">Hi</aside>');
  });

  it('UIC-RICH-TEXT-EDITOR-10.2 gives one line per text block and a line per hard break', () => {
    expect(serializeRichTextText(document)).toBe('Pears & <figs>\nRipe and sweet\nmarket\nPlums');
  });
});
