import { describe, expect, it } from 'vitest';
import { htmlScopeCases } from '../../../test/html-scope-fixtures.js';
import { defaultHtmlPolicy, sanitizeHtml, type HtmlNode } from './sanitize-html.js';

/** The tree as compact markup, to compare structure at a glance. */
function serialize(nodes: readonly HtmlNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text') return node.text;
      const attributes = Object.entries(node.attributes)
        .map(([name, value]) => ` ${name}="${value}"`)
        .join('');
      return `<${node.tag}${attributes}>${serialize(node.children)}</${node.tag}>`;
    })
    .join('');
}

const clean = (markup: string) => serialize(sanitizeHtml(markup));

describe('sanitizeHtml', () => {
  for (const sample of htmlScopeCases) {
    it(`UIC-HTML-MARKUP-1.2 UIC-HTML-MARKUP-1.3 UIC-HTML-MARKUP-1.7 preserves content and allowed structure after ${sample.name}`, () => {
      const nodes = sanitizeHtml(sample.markup, sample.policy);
      expect(serialize(nodes)).toBe(sample.html);
      const allowed = new Set((sample.policy ?? defaultHtmlPolicy).elements);
      const pending = [...nodes];
      for (let node = pending.pop(); node; node = pending.pop()) {
        if (node.type === 'text') continue;
        expect(allowed.has(node.tag)).toBe(true);
        pending.push(...node.children);
      }
    });
  }

  it('UIC-HTML-MARKUP-1.2 UIC-HTML-MARKUP-1.3 UIC-HTML-MARKUP-1.4 UIC-HTML-MARKUP-1.5 repairs a removed scope without keeping blocked content or unsafe attributes', () => {
    expect(
      sanitizeHtml(
        '<p>Before<button><div><script>hidden</script><strong onclick="unsafe()" style="color:red">Inside</strong>' +
          '<a href="javascript:unsafe()">link</a></div></button>After</p>',
      ),
    ).toEqual([
      {
        type: 'element',
        tag: 'p',
        attributes: {},
        children: [
          { type: 'text', text: 'Before' },
          {
            type: 'element',
            tag: 'strong',
            attributes: {},
            children: [{ type: 'text', text: 'Inside' }],
          },
          {
            type: 'element',
            tag: 'a',
            attributes: {},
            children: [{ type: 'text', text: 'link' }],
          },
          { type: 'text', text: 'After' },
        ],
      },
    ]);
  });

  it('UIC-HTML-MARKUP-1.1 keeps deeply nested valid elements frozen without a call stack limit', () => {
    const depth = 20_000;
    const nodes = sanitizeHtml('<span>'.repeat(depth) + 'Leaf' + '</span>'.repeat(depth));
    let children = nodes;
    let count = 0;
    while (children[0]?.type === 'element') {
      const node = children[0];
      expect(Object.isFrozen(node)).toBe(true);
      expect(Object.isFrozen(node.children)).toBe(true);
      children = node.children;
      count += 1;
    }
    expect(count).toBe(depth);
    expect(children).toEqual([{ type: 'text', text: 'Leaf' }]);
  });

  it('UIC-HTML-MARKUP-1.3 unwraps deeply nested excluded elements in their content order', () => {
    const depth = 20_000;
    const nodes = sanitizeHtml(
      'Before' + '<x-wrap>'.repeat(depth) + '<b>Leaf</b>' + '</x-wrap>'.repeat(depth) + 'After',
    );
    expect(serialize(nodes)).toBe('Before<b>Leaf</b>After');
    expect(Object.isFrozen(nodes)).toBe(true);
  });

  it('UIC-HTML-MARKUP-1.1 returns a frozen tree of lower-case elements and decoded text', () => {
    const nodes = sanitizeHtml(
      'Intro <P CLASS="lead">Fish &amp; chips&nbsp;&mdash; <B>hot</B></P>',
    );
    expect(nodes).toEqual([
      { type: 'text', text: 'Intro ' },
      {
        type: 'element',
        tag: 'p',
        attributes: { class: 'lead' },
        children: [
          { type: 'text', text: 'Fish & chips\u00a0— ' },
          { type: 'element', tag: 'b', attributes: {}, children: [{ type: 'text', text: 'hot' }] },
        ],
      },
    ]);
    expect(Object.isFrozen(nodes)).toBe(true);
    expect(Object.isFrozen(nodes[1])).toBe(true);
    expect(sanitizeHtml('')).toEqual([]);
    expect(clean('<!-- note --><!DOCTYPE html>a < b')).toBe('a < b');
  });

  it('UIC-HTML-MARKUP-1.2 closes elements the way an HTML parser implies', () => {
    expect(clean('<p>one<p>two<div>three</div>')).toBe('<p>one</p><p>two</p><div>three</div>');
    expect(clean('<ul><li>a<li>b</ul><dl><dt>t<dd>d</dl>')).toBe(
      '<ul><li>a</li><li>b</li></ul><dl><dt>t</dt><dd>d</dd></dl>',
    );
    expect(clean('<table> <tr><td>a<td>b <tr><th>c</table>')).toBe(
      '<table><tbody><tr><td>a</td><td>b </td></tr><tr><th>c</th></tr></tbody></table>',
    );
    expect(clean('<p>Line<br>break<img src="/a.png" alt="A"><hr>after')).toBe(
      '<p>Line<br></br>break<img src="/a.png" alt="A"></img></p><hr></hr>after',
    );
    expect(clean('</p>stray</b><b>open')).toBe('stray<b>open</b>');
    expect(clean('<a href="/a">one<a href="/b">two</a>')).toBe(
      '<a href="/a">one</a><a href="/b">two</a>',
    );
    expect(clean('<h2>One<h3>Two</h3>')).toBe('<h2>One</h2><h3>Two</h3>');
  });

  it('UIC-HTML-MARKUP-1.3 drops a blocked element whole when it nests one of the same name', () => {
    expect(sanitizeHtml('<object><object></object><b>fallback</b></object>')).toEqual([]);
    expect(sanitizeHtml('<svg><svg></svg><b>leak</b></svg><i>kept</i>')).toEqual([
      { type: 'element', tag: 'i', attributes: {}, children: [{ type: 'text', text: 'kept' }] },
    ]);
  });

  it('UIC-HTML-MARKUP-1.3 unwraps elements outside the policy and drops dangerous ones with their content', () => {
    expect(clean('<section><article>Kept <font>text</font></article></section>')).toBe('Kept text');
    expect(
      clean(
        '<script>alert(1)</script><style>p{}</style><iframe src="x"></iframe><svg><a>x</a></svg>' +
          '<template><p>t</p></template><textarea><p>t</p></textarea><select><option>o</option></select>' +
          '<object><p>o</p></object><meta charset="x"><link rel="x"><base href="/">ok',
      ),
    ).toBe('ok');
    expect(clean('<form><input value="x"><button>Send</button></form>')).toBe('Send');
    expect(clean('<SCRIPT>a</SCRIPT>b<script>unclosed')).toBe('b');
  });

  it('UIC-HTML-MARKUP-1.4 keeps allowed attributes only, never handlers, styles or hook classes', () => {
    expect(
      clean(
        '<p onclick="x()" ONMOUSEOVER="x()" style="color:red" class="ui-button note ui-x" id="a" data-user="7" aria-label="n" lang="fr" title="T">t</p>',
      ),
    ).toBe('<p class="note" data-user="7" lang="fr" title="T">t</p>');
    expect(clean('<span class="ui-link">t</span>')).toBe('<span>t</span>');
    expect(clean('<table><td colspan="2" rowspan="3">x</td></table>')).toBe(
      '<table><tbody><tr><td colspan="2" rowspan="3">x</td></tr></tbody></table>',
    );
  });

  it('UIC-HTML-MARKUP-1.5 keeps relative URLs and allowed schemes, read as a browser reads them', () => {
    expect(
      clean(
        [
          '<a href="https://example.com">a</a>',
          '<a href="/docs?x=1#top">b</a>',
          '<a href="mailto:a@b.c">c</a>',
          '<a href="javascript:alert(1)">d</a>',
          '<a href=" java\tscript:alert(1)">e</a>',
          '<a href="jav&#x09;ascript:alert(1)">f</a>',
          '<img src="data:image/png;base64,AA" alt="g">',
          '<blockquote cite="vbscript:x">h</blockquote>',
        ].join(''),
      ),
    ).toBe(
      '<a href="https://example.com">a</a><a href="/docs?x=1#top">b</a><a href="mailto:a@b.c">c</a>' +
        '<a>d</a><a>e</a><a>f</a><img alt="g"></img><blockquote>h</blockquote>',
    );
  });

  it('UIC-HTML-MARKUP-1.6 makes links that open a new tab safe', () => {
    expect(
      clean('<a href="/a" target="_blank" rel="nofollow">a</a><a href="/b" target="_self">b</a>'),
    ).toBe(
      '<a href="/a" target="_blank" rel="nofollow noopener noreferrer">a</a><a href="/b" target="_self">b</a>',
    );
  });

  it('UIC-HTML-MARKUP-1.7 follows a custom policy', () => {
    const policy = {
      elements: ['p', 'img', 'video'],
      attributes: ['src', 'srcset', 'id', 'aria-*'],
      schemes: ['https', 'data'],
    };
    expect(
      serialize(
        sanitizeHtml(
          '<p id="x" aria-label="y" class="z"><b>bold</b> <video src="https://e.com/v.mp4"></video>' +
            '<img src="data:image/png;base64,AA" srcset="a.png 1x, javascript:x 2x"><img srcset="a.png 1x, https://e.com/b.png 2x"></p>',
          policy,
        ),
      ),
    ).toBe(
      '<p id="x" aria-label="y">bold <video src="https://e.com/v.mp4"></video>' +
        '<img src="data:image/png;base64,AA"></img><img srcset="a.png 1x, https://e.com/b.png 2x"></img></p>',
    );
    expect(defaultHtmlPolicy.elements).toContain('table');
    expect(defaultHtmlPolicy.schemes).toEqual(['http', 'https', 'mailto', 'tel']);
    expect(Object.isFrozen(defaultHtmlPolicy)).toBe(true);
  });
});
