import { describe, expect, it } from 'vitest';
import { decodeEntities, tokenizeMarkup } from './markup.js';

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
