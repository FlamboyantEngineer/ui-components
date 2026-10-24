import { describe, expect, it } from 'vitest';
import { decodeEntities, skipDroppedElements, tokenizeMarkup } from './markup.js';

describe('tokenizeMarkup', () => {
  it('UIC-MARKUP-1.1 splits markup into text, opening and closing tags', () => {
    expect(
      tokenizeMarkup(
        '<?xml version="1.0"?><!DOCTYPE x [ <!ENTITY a "b"> ]><!-- note -->' +
          '<Div class="a" CLASS="b" data-x=\'1 &amp; 2\' hidden title=bare>Fish &lt;3<br/></Div>' +
          '<![CDATA[ <raw> ]]>a < b',
      ),
    ).toEqual([
      {
        type: 'open',
        tag: 'Div',
        attributes: { class: 'a', CLASS: 'b', 'data-x': '1 & 2', hidden: '', title: 'bare' },
        isSelfClosing: false,
      },
      { type: 'text', text: 'Fish <3' },
      { type: 'open', tag: 'br', attributes: {}, isSelfClosing: true },
      { type: 'close', tag: 'Div' },
      { type: 'text', text: ' <raw> ' },
      { type: 'text', text: 'a ' },
      { type: 'text', text: '<' },
      { type: 'text', text: ' b' },
    ]);
    expect(tokenizeMarkup('')).toEqual([]);
    expect(tokenizeMarkup('<!-- unclosed')).toEqual([]);
  });

  it('UIC-MARKUP-1.2 reads the content of raw-text elements as one undecoded text token', () => {
    const rawTextElements = new Set(['script']);
    expect(
      tokenizeMarkup('<SCRIPT>if (a < b) "<p>&amp;"</script >after<script/>x<script>open', {
        rawTextElements,
      }),
    ).toEqual([
      { type: 'open', tag: 'SCRIPT', attributes: {}, isSelfClosing: false },
      { type: 'text', text: 'if (a < b) "<p>&amp;"' },
      { type: 'close', tag: 'SCRIPT' },
      { type: 'text', text: 'after' },
      { type: 'open', tag: 'script', attributes: {}, isSelfClosing: true },
      { type: 'text', text: 'x' },
      { type: 'open', tag: 'script', attributes: {}, isSelfClosing: false },
      { type: 'text', text: 'open' },
      { type: 'close', tag: 'script' },
    ]);
  });
});

describe('skipDroppedElements', () => {
  it('UIC-MARKUP-1.4 skips dropped elements with their content, counting nested ones', () => {
    const tokens = tokenizeMarkup(
      '<p>a<object><OBJECT></object><b>fallback</b></Object>b<object/>c<embed>d</p>',
    );
    const kept = [
      ...skipDroppedElements(tokens, {
        isDropped: (token) => ['object', 'embed'].includes(token.tag.toLowerCase()),
        isEmpty: (token) => token.isSelfClosing || token.tag === 'embed',
      }),
    ];
    expect(kept).toEqual([
      { type: 'open', tag: 'p', attributes: {}, isSelfClosing: false },
      { type: 'text', text: 'a' },
      { type: 'text', text: 'b' },
      { type: 'text', text: 'c' },
      { type: 'text', text: 'd' },
      { type: 'close', tag: 'p' },
    ]);
    const unclosed = tokenizeMarkup('<svg><set attributeName="href"><b>x</b>');
    expect([
      ...skipDroppedElements(unclosed, { isDropped: (token) => token.tag === 'set' }),
    ]).toEqual([{ type: 'open', tag: 'svg', attributes: {}, isSelfClosing: false }]);
  });
});

describe('decodeEntities', () => {
  it('UIC-MARKUP-1.3 decodes numeric references and common named entities', () => {
    expect(decodeEntities('&amp;&AMP;&lt;&gt;&quot;&apos;&nbsp;&mdash;&hellip;&copy;&euro;')).toBe(
      '&&<>"\'\u00a0—…©€',
    );
    expect(decodeEntities('&#65;&#x42;&#X43;&#0;&#xD800;&#x110000;')).toBe('ABC\ufffd\ufffd\ufffd');
    expect(decodeEntities('&dagger;&Dagger; &unknown; & amp; plain')).toBe(
      '†‡ &unknown; & amp; plain',
    );
  });
});
