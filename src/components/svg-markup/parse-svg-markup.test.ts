import { describe, expect, it } from 'vitest';
import { parseSvgMarkup, type SvgElementNode, type SvgNode } from './parse-svg-markup.js';

const plusMarkup =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">\n' +
  '  <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/>\n' +
  '</svg>';

function element(node: SvgNode | undefined): SvgElementNode {
  if (node?.type !== 'element') throw new Error('expected an element');
  return node;
}

describe('parseSvgMarkup', () => {
  it('UIC-SVG-MARKUP-1.1 freezes a deeply nested drawing without recursive stack growth', () => {
    const tree = parseSvgMarkup(`<svg>${'<g>'.repeat(20_000)}x${'</g>'.repeat(20_000)}</svg>`);
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
    const tree = parseSvgMarkup(plusMarkup);
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
    const tree = parseSvgMarkup(
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
    const [title, style, group, text] = tree.children.map(element);
    expect(title?.children).toEqual([{ type: 'text', text: 'Sun & moon ☀ ☾' }]);
    expect(style?.children).toEqual([{ type: 'text', text: ' .ray > path { stroke: gold } ' }]);
    expect(group?.children.map((child) => element(child).tag)).toEqual(['path']);
    expect(text?.attributes['font-family']).toBe('"Serif"');
    expect(text?.children[0]).toEqual({ type: 'text', text: 'A ' });
    expect(element(text?.children[1]).children).toEqual([{ type: 'text', text: 'B' }]);
  });

  it('UIC-SVG-MARKUP-1.1 closes unmatched elements and throws without an svg root', () => {
    const tree = parseSvgMarkup('<svg><g><path d="M1 1"></g><circle r="2"/></svg>');
    expect(tree.children.map((child) => element(child).tag)).toEqual(['g', 'circle']);
    expect(() => parseSvgMarkup('<div><span/></div>')).toThrow(/root <svg>/);
    expect(() => parseSvgMarkup('')).toThrow(/root <svg>/);
  });

  it('UIC-SVG-MARKUP-1.2 drops scripts, embedded HTML, event handlers and script URLs', () => {
    const tree = parseSvgMarkup(
      [
        '<svg onload="steal()" viewBox="0 0 4 4">',
        '<script>steal()</script>',
        '<SCRIPT type="text/javascript"><![CDATA[ steal() ]]></SCRIPT>',
        '<foreignObject><iframe src="https://example.com"></iframe></foreignObject>',
        '<a href=" java\tscript:steal()" xlink:href="javascript:steal()"><path d="M0 0"/></a>',
        '<a href="#ring"><circle onclick="steal()" ONMOUSEOVER="steal()" r="1"/></a>',
        '<image src="vbscript:steal()" href="tile.png"/>',
        '</svg>',
      ].join(''),
    );
    expect(tree.attributes).toEqual({ viewBox: '0 0 4 4' });
    const [unsafeLink, safeLink, image] = tree.children.map(element);
    expect(tree.children).toHaveLength(3);
    expect(unsafeLink?.attributes).toEqual({});
    expect(safeLink?.attributes).toEqual({ href: '#ring' });
    expect(element(safeLink?.children[0]).attributes).toEqual({ r: '1' });
    expect(image?.attributes).toEqual({ href: 'tile.png' });
  });

  it('UIC-SVG-MARKUP-1.2 drops animations that could set a link to a script URL', () => {
    const tree = parseSvgMarkup(
      [
        '<svg viewBox="0 0 10 10">',
        '<a><set attributeName="href" to="javascript:steal()"/><rect width="10"/></a>',
        '<a><animate attributeName="xlink:href" values="#a;#b" dur="1s"/></a>',
        '<a><animate attribute-name="href" values="#ring; javascript:steal()"/></a>',
        '<a><animate attributeName="title" from=" JavaScript:steal()" to="#b"/></a>',
        '<a><animateMotion by="vbscript:steal()"><set attributeName="href"/></animateMotion></a>',
        '<a><set attributeName="x:href" to="#ring"><set to="#a"/></set><circle r="1"/></a>',
        '<path xlink-href="javascript:steal()" XLINK:HREF="javascript:steal()" d="M0 0"/>',
        '<rect><set attributeName="fill" to="red"/><animate attributeName="x" values="0;5"/></rect>',
        '</svg>',
      ].join(''),
    );
    const [first, second, third, fourth, fifth, sixth, path, rect] = tree.children.map(element);
    expect(tree.children).toHaveLength(8);
    expect(first?.children.map((child) => element(child).tag)).toEqual(['rect']);
    for (const link of [second, third, fourth, fifth]) expect(link?.children).toEqual([]);
    expect(sixth?.children.map((child) => element(child).tag)).toEqual(['circle']);
    expect(path?.attributes).toEqual({ d: 'M0 0' });
    expect(rect?.children.map((child) => element(child).attributes)).toEqual([
      { attributeName: 'fill', to: 'red' },
      { attributeName: 'x', values: '0;5' },
    ]);
  });

  it('UIC-SVG-MARKUP-1.3 caches trees by markup, keeping the most recently used', () => {
    const first = parseSvgMarkup(plusMarkup);
    expect(parseSvgMarkup(plusMarkup)).toBe(first);
    for (let index = 0; index < 255; index += 1) parseSvgMarkup(`<svg data-index="${index}"/>`);
    expect(parseSvgMarkup(plusMarkup)).toBe(first);
    const early = parseSvgMarkup('<svg data-index="0"/>');
    for (let index = 255; index < 600; index += 1) parseSvgMarkup(`<svg data-index="${index}"/>`);
    expect(parseSvgMarkup('<svg data-index="0"/>')).not.toBe(early);
    expect(parseSvgMarkup('<svg data-index="0"/>')).toEqual(early);
  });
});
