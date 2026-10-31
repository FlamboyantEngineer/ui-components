import { describe, expect, it } from 'vitest';
import { parseSvgMarkup, type SvgElementNode, type SvgNode } from './parse-svg-markup.js';

const plusMarkup =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">\n' +
  '  <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/>\n' +
  '</svg>';

function parse(markup: string): SvgElementNode {
  const tree = parseSvgMarkup(markup);
  if (!tree) throw new Error('expected a drawing');
  return tree;
}

function element(node: SvgNode | undefined): SvgElementNode {
  if (node?.type !== 'element') throw new Error('expected an element');
  return node;
}

describe('parseSvgMarkup', () => {
  it('UIC-SVG-MARKUP-1.1 freezes a deeply nested drawing without recursive stack growth', () => {
    const tree = parse(`<svg>${'<g>'.repeat(20_000)}x${'</g>'.repeat(20_000)}</svg>`);
    let node = tree;
    let depth = 0;
    while (node.children[0]?.type === 'element') {
      expect(Object.isFrozen(node)).toBe(true);
      expect(Object.isFrozen(node.attributes)).toBe(true);
      expect(Object.isFrozen(node.children)).toBe(true);
      node = node.children[0];
      depth += 1;
    }
    expect(depth).toBe(20_000);
    expect(node.children[0]).toEqual({ type: 'text', text: 'x' });
    expect(Object.isFrozen(node.children[0])).toBe(true);
  });

  it('UIC-SVG-MARKUP-1.1 returns the root svg as a frozen element tree', () => {
    const tree = parse(plusMarkup);
    expect(tree.tag).toBe('svg');
    expect(tree.attributes).toEqual({
      xmlns: 'http://www.w3.org/2000/svg',
      fill: 'none',
      viewBox: '0 0 24 24',
      'stroke-width': '1.5',
      stroke: 'currentColor',
    });
    expect(tree.children).toHaveLength(1);
    expect(element(tree.children[0])).toEqual({
      type: 'element',
      tag: 'path',
      attributes: { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 5v14M5 12h14' },
      children: [],
    });
    expect(Object.isFrozen(tree)).toBe(true);
    expect(Object.isFrozen(tree.attributes)).toBe(true);
    expect(Object.isFrozen(tree.children[0])).toBe(true);
  });

  it('UIC-SVG-MARKUP-1.1 drops declarations and comments, keeps text, CDATA and entities', () => {
    const tree = parse(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" [ <!ENTITY ns "x"> ]>',
        '<!-- exported drawing -->',
        "<SVG viewBox='0 0 10 10'>",
        '  <title>Sun &amp; moon &#x2600; &#9790;</title>',
        '  <style><![CDATA[ .ray > path { stroke: gold } ]]></style>',
        '  <g class="ray"><!-- inner --><path d="M0 0"/></g>',
        '  <text font-family="&quot;Serif&quot;">A <tspan>B</tspan></text>',
        '</SVG>',
        'trailing text',
      ].join('\n'),
    );
    expect(tree.tag).toBe('svg');
    expect(tree.attributes).toEqual({ viewBox: '0 0 10 10' });
    const [title, group, text] = tree.children.map(element);
    expect(title?.children).toEqual([{ type: 'text', text: 'Sun & moon ☀ ☾' }]);
    expect(group?.children.map((child) => element(child).tag)).toEqual(['path']);
    expect(text?.attributes['font-family']).toBe('"Serif"');
    expect(text?.children[0]).toEqual({ type: 'text', text: 'A ' });
    expect(element(text?.children[1]).children).toEqual([{ type: 'text', text: 'B' }]);
  });

  it('UIC-SVG-MARKUP-1.1 closes unmatched elements and returns null without an svg root', () => {
    const tree = parse('<svg><g><path d="M1 1"></g><circle r="2"/></svg>');
    expect(tree.children.map((child) => element(child).tag)).toEqual(['g', 'circle']);
    expect(parseSvgMarkup('<div><span/></div>')).toBeNull();
    expect(parseSvgMarkup('')).toBeNull();
  });

  it('UIC-SVG-MARKUP-1.2 drops scripts, styles, embedded HTML, event handlers and unknown elements', () => {
    const tree = parse(
      [
        '<svg onload="steal()" viewBox="0 0 4 4">',
        '<script>steal()</script>',
        '<SCRIPT type="text/javascript"><![CDATA[ steal() ]]></SCRIPT>',
        '<style>@import url(https://example.com/x.css); path { fill: red }</style>',
        '<foreignObject><iframe src="https://example.com"></iframe></foreignObject>',
        '<html:iframe srcdoc="&lt;script&gt;steal()&lt;/script&gt;"></html:iframe>',
        '<p><circle r="9"/></p>',
        '<circle onclick="steal()" ONMOUSEOVER="steal()" tabindex="0" r="1"/>',
        '</svg>',
      ].join(''),
    );
    expect(tree.attributes).toEqual({ viewBox: '0 0 4 4' });
    expect(tree.children.map(element)).toEqual([
      { type: 'element', tag: 'circle', attributes: { r: '1' }, children: [] },
    ]);
  });

  it('UIC-SVG-MARKUP-1.2 keeps title and description as text only', () => {
    const tree = parse(
      [
        '<svg>',
        '<desc>Plan<iframe srcdoc="&lt;script&gt;steal()&lt;/script&gt;"></iframe> view</desc>',
        '<title>Map<img src="x" onerror="steal()"/><![CDATA[ & key]]></title>',
        '</svg>',
      ].join(''),
    );
    const [desc, title] = tree.children.map(element);
    expect(desc?.children).toEqual([
      { type: 'text', text: 'Plan' },
      { type: 'text', text: ' view' },
    ]);
    expect(title?.children).toEqual([
      { type: 'text', text: 'Map' },
      { type: 'text', text: ' & key' },
    ]);
  });

  it('UIC-SVG-MARKUP-1.2 unwraps links and keeps only fragment links and raster data images', () => {
    const tree = parse(
      [
        '<svg>',
        '<a href=" java\tscript:steal()" xlink:href="javascript:steal()"><path d="M0 0"/></a>',
        '<use href="#ring" xlink:href="https://example.com/sprite.svg#ring"/>',
        '<use href="data:image/svg+xml,&lt;svg onload=steal()&gt;"/>',
        '<image href="https://example.com/tile.png"/>',
        '<image href="data:image/png;base64,iVBORw0KGgo="/>',
        '<image href="data:image/svg+xml;base64,PHN2Zz4="/>',
        '<feImage href="data:image/png;base64,iVBORw0KGgo="/>',
        '</svg>',
      ].join(''),
    );
    expect(tree.children.map(element).map(({ tag, attributes }) => ({ tag, attributes }))).toEqual([
      { tag: 'path', attributes: { d: 'M0 0' } },
      { tag: 'use', attributes: { href: '#ring' } },
      { tag: 'use', attributes: {} },
      { tag: 'image', attributes: {} },
      { tag: 'image', attributes: { href: 'data:image/png;base64,iVBORw0KGgo=' } },
      { tag: 'image', attributes: {} },
    ]);
  });

  it('UIC-SVG-MARKUP-1.2 drops values and declarations that load or run anything', () => {
    const tree = parse(
      [
        '<svg xmlns="http://www.w3.org/1999/xhtml" xmlns:xlink="http://www.w3.org/1999/xlink">',
        '<rect fill="url(#fade)" stroke="url(https://example.com/x.svg#p)" class="ui-root tile"',
        ' filter="expression(steal())" mask="url( \'#m\' )" data-part="tile" aria-label="Tile"',
        ' style="fill: url(https://example.com/a); stroke: red; position: fixed; --tone: 3;',
        ' -webkit-transform: none; background: url(#x); opacity: image-set(x)"/>',
        '</svg>',
      ].join(''),
    );
    expect(tree.attributes).toEqual({ 'xmlns:xlink': 'http://www.w3.org/1999/xlink' });
    expect(element(tree.children[0]).attributes).toEqual({
      fill: 'url(#fade)',
      class: 'tile',
      mask: "url( '#m' )",
      'data-part': 'tile',
      'aria-label': 'Tile',
      style: 'stroke: red; --tone: 3; -webkit-transform: none',
    });
  });

  it('UIC-SVG-MARKUP-1.2 drops values whose url() or strings are not closed or are malformed', () => {
    const dropped = [
      'url(https://example.com/x.svg#g',
      "url('https://example.com/x.svg#g'",
      'url("https://example.com/x.svg#g',
      "url('#g",
      'url(#g',
      'url(#a url(https://example.com/x.svg)',
      'url(#a) url(https://example.com/x.svg',
      'url(#a "x)',
      'url(# a)',
      'URL ( https://example.com/x.svg )',
      'url(/**/https://example.com/x.svg)',
      'rgb(1 2 3',
      'red)',
      "'unclosed",
    ];
    const tree = parse(
      `<svg>${dropped.map((value) => `<rect fill="${value.replace(/"/g, '&quot;')}"/>`).join('')}</svg>`,
    );
    expect(tree.children.map((node) => element(node).attributes)).toEqual(dropped.map(() => ({})));
  });

  it('UIC-SVG-MARKUP-1.2 checks style declarations, custom properties and animation values alike', () => {
    const tree = parse(
      [
        '<svg>',
        '<rect style="fill: url(https://example.com/a.svg#p; stroke: red"/>',
        '<rect style="--paint: url(#fade) ; stroke: url( &quot;#edge&quot; ); fill: url(\'#x\'"/>',
        '<rect><animate attributeName="fill" values="url(#a);url(https://example.com/a.svg#p" dur="1s"/>',
        '<animate attributeName="fill" values="url(#a);url(#b)" dur="1s"/></rect>',
        '</svg>',
      ].join(''),
    );
    const [first, second, third] = tree.children.map(element);
    expect(first?.attributes).toEqual({ style: 'stroke: red' });
    expect(second?.attributes).toEqual({ style: '--paint: url(#fade); stroke: url( "#edge" )' });
    expect(third?.children.map((node) => element(node).attributes)).toEqual([
      { attributeName: 'fill', dur: '1s' },
      { attributeName: 'fill', values: 'url(#a);url(#b)', dur: '1s' },
    ]);
  });

  it('UIC-SVG-MARKUP-1.2 drops animations that target links, styles or dropped attributes', () => {
    const tree = parse(
      [
        '<svg viewBox="0 0 10 10">',
        '<a><set attributeName="href" to="javascript:steal()"/><rect width="10"/></a>',
        '<use><animate attributeName="xlink:href" values="#a;#b" dur="1s"/></use>',
        '<use><animate attribute-name="href" values="#ring; javascript:steal()"/></use>',
        '<g><animate attributeName="onclick" to="steal()"/></g>',
        '<g><animate attributeName="STYLE" to="fill: red"/></g>',
        '<g><animateMotion by="vbscript:steal()"><set attributeName="href"/></animateMotion></g>',
        '<g><set attributeName="x:href" to="#ring"><set to="#a"/></set><circle r="1"/></g>',
        '<path xlink-href="javascript:steal()" XLINK:HREF="javascript:steal()" d="M0 0"/>',
        '<rect><set attributeName="fill" to="red"/><animate attributeName="x" values="0;5"/></rect>',
        '</svg>',
      ].join(''),
    );
    const [rect, first, second, third, fourth, fifth, sixth, path, animated] =
      tree.children.map(element);
    expect(tree.children).toHaveLength(9);
    expect(rect?.tag).toBe('rect');
    expect(first?.children).toEqual([]);
    expect(second?.children.map((child) => element(child).attributes)).toEqual([{}]);
    for (const group of [third, fourth]) expect(group?.children).toEqual([]);
    expect(element(fifth?.children[0]).children).toEqual([]);
    expect(sixth?.children.map((child) => element(child).tag)).toEqual(['circle']);
    expect(path?.attributes).toEqual({ d: 'M0 0' });
    expect(animated?.children.map((child) => element(child).attributes)).toEqual([
      { attributeName: 'fill', to: 'red' },
      { attributeName: 'x', values: '0;5' },
    ]);
  });

  it('UIC-SVG-MARKUP-1.3 caches trees by markup, keeping the most recently used', () => {
    const first = parse(plusMarkup);
    expect(parse(plusMarkup)).toBe(first);
    for (let index = 0; index < 255; index += 1) parse(`<svg data-index="${index}"/>`);
    expect(parse(plusMarkup)).toBe(first);
    const early = parse('<svg data-index="0"/>');
    for (let index = 255; index < 600; index += 1) parse(`<svg data-index="${index}"/>`);
    expect(parse('<svg data-index="0"/>')).not.toBe(early);
    expect(parse('<svg data-index="0"/>')).toEqual(early);
    expect(parseSvgMarkup('<p>No drawing</p>')).toBeNull();
    expect(parseSvgMarkup('<p>No drawing</p>')).toBeNull();
  });
});
