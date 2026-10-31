import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Icon } from '../icon/icon.js';
import { parseSvgMarkup } from './parse-svg-markup.js';
import { SvgMarkup, renderSvgTree } from './svg-markup.js';

const outlineMarkup =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" class="source" width="24" height="24" style="color: red" id="source" role="presentation" focusable="true" tabindex="0">' +
  '<path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/>' +
  '</svg>';

const solidMarkup =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' +
  '<path fill-rule="evenodd" clip-rule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/>' +
  '</svg>';

const gradientMarkup =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 10 10">' +
  '<title>Badge</title>' +
  '<defs><linearGradient id="fade" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fa0" stop-opacity="0.5"/></linearGradient></defs>' +
  '<use xlink:href="#dot" class="outline" style="fill: url(#fade); stroke-width: 2px; --tone: 3; -webkit-transform: none"/>' +
  '<circle id="dot" r="4" data-part="dot" aria-label="Dot"/>' +
  '</svg>';

describe('SvgMarkup', () => {
  it('UIC-SVG-MARKUP-2.1 constructs deep drawing children without recursive stack growth', () => {
    const markup = `<svg>${'<g>'.repeat(20_000)}<path/>${'</g>'.repeat(20_000)}</svg>`;
    // Construct the React tree without depending on the host renderer's nesting limit.
    expect(renderSvgTree(parseSvgMarkup(markup), 'deep', {})).not.toBeNull();
  });

  it.each([false, true])(
    'UIC-SVG-MARKUP-2.1 renders large sibling lists without function argument limits (group: %s)',
    (isGrouped) => {
      const paths = '<path d="M0 0"/>'.repeat(200_000);
      const markup = `<svg>${isGrouped ? `<g>${paths}</g>` : paths}</svg>`;
      // eslint-disable-next-line testing-library/render-result-naming-convention -- server rendering returns a string.
      const output = renderToStaticMarkup(<SvgMarkup markup={markup} />);
      expect(output.split('<path').length - 1).toBe(200_000);
      expect(output).toMatch(/^<svg/);
      expect(output).toMatch(/<\/svg>$/);
    },
  );

  it('UIC-SVG-MARKUP-2.1 renders markup as React elements with converted attributes', () => {
    // eslint-disable-next-line testing-library/render-result-naming-convention -- renderToStaticMarkup returns an HTML string, not a render result
    const outline = renderToStaticMarkup(<SvgMarkup markup={outlineMarkup} />);
    expect(outline).toMatch(/^<svg/);
    expect(outline).toMatch(/viewBox="0 0 24 24"/);
    expect(outline).toMatch(/stroke-width="1.5"/);
    expect(outline).toMatch(
      /<path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/,
    );

    // eslint-disable-next-line testing-library/render-result-naming-convention -- renderToStaticMarkup returns an HTML string, not a render result
    const solid = renderToStaticMarkup(<SvgMarkup markup={solidMarkup} />);
    expect(solid).toMatch(/fill="currentColor"/);
    expect(solid).toMatch(/fill-rule="evenodd"/);
    expect(solid).toMatch(/clip-rule="evenodd"/);
  });

  it('UIC-SVG-MARKUP-2.1 renders namespaced attributes, style text, classes and text in the DOM', () => {
    const errors = vi.spyOn(console, 'error');
    const { container } = render(<SvgMarkup markup={gradientMarkup} />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.querySelector('title')).toHaveTextContent('Badge');
    expect(document.head.querySelector('title')).toBeNull();
    expect(svg.querySelector('linearGradient')).toHaveAttribute('gradientUnits', 'userSpaceOnUse');
    expect(svg.querySelector('stop')).toHaveAttribute('stop-color', '#fa0');
    expect(svg.querySelector('stop')).toHaveAttribute('stop-opacity', '0.5');
    const use = svg.querySelector('use') as SVGUseElement;
    const dot = svg.querySelector('circle')?.id ?? '';
    const fade = svg.querySelector('linearGradient')?.id ?? '';
    expect(dot).toMatch(/._dot$/);
    expect(fade).toMatch(/._fade$/);
    expect(use.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe(`#${dot}`);
    expect(use).toHaveClass('outline');
    expect(use.style.getPropertyValue('fill')).toMatch(new RegExp(`^url\\("?#${fade}"?\\)$`));
    expect(use.style.getPropertyValue('stroke-width')).toBe('2px');
    expect(use.style.getPropertyValue('--tone')).toBe('3');
    const circle = svg.querySelector('circle');
    expect(circle).toHaveAttribute('data-part', 'dot');
    expect(circle).toHaveAttribute('aria-label', 'Dot');
    expect(errors).not.toHaveBeenCalled();
  });

  it('UIC-SVG-MARKUP-2.1 never uses innerHTML or the DOM to parse', () => {
    for (const file of ['svg-markup.tsx', 'parse-svg-markup.ts']) {
      const code = readFileSync(join(process.cwd(), 'src/components/svg-markup', file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');
      expect(code).not.toMatch(/dangerouslySetInnerHTML|innerHTML|DOMParser|document\./);
    }
  });

  it('UIC-SVG-MARKUP-1.2 renders no animation that sets a link to a script URL', () => {
    const { container } = render(
      <SvgMarkup
        markup={[
          '<svg viewBox="0 0 10 10">',
          '<a><set attributeName="href" to="javascript:alert(1)"/><rect width="10" height="10"/></a>',
          '<a><animate attributeName="href" values="#a;javascript:alert(1)"/></a>',
          '<a><animate attributeName="xlink:href" from="javascript:alert(1)" to="#a"/></a>',
          '</svg>',
        ].join('')}
      />,
    );
    expect(container.innerHTML).not.toContain('javascript:');
    expect(container.querySelector('set, animate')).toBeNull();
    expect(container.querySelector('rect')).not.toBeNull();
  });

  it('UIC-SVG-MARKUP-1.4 keeps references inside each drawing and away from the host page', () => {
    const { container } = render(
      <>
        <svg>
          <rect id="host-status" width="10" height="10" />
        </svg>
        <SvgMarkup markup='<svg><set href="#host-status" attributeName="opacity" to="0" dur="indefinite"/><use href="#host-status"/><rect id="own" width="4" height="4" fill="url(#host-paint)" style="stroke: url(#host-paint); stroke-width: 2px"><animate attributeName="x" to="2" begin="host-status.click; own.click; 1s" end="host-status.end"/></rect><set attributeName="opacity" to="1" begin="host-status.end"/><circle r="2" aria-labelledby="host-status own"/></svg>' />
      </>,
    );
    const drawing = container.querySelector('.ui-svg-markup') as SVGSVGElement;
    expect(drawing.innerHTML).not.toContain('host-');
    expect(drawing.querySelectorAll('set')).toHaveLength(1);
    expect(drawing.querySelector('set')).toHaveAttribute('begin', 'indefinite');
    expect(drawing.querySelector('use')).not.toHaveAttribute('href');
    const rect = drawing.querySelector('rect') as SVGRectElement;
    expect(rect).not.toHaveAttribute('fill');
    expect(rect.style.getPropertyValue('stroke')).toBe('');
    expect(rect.style.getPropertyValue('stroke-width')).toBe('2px');
    expect(drawing.querySelector('animate')).toHaveAttribute('begin', `${rect.id}.click;1s`);
    expect(drawing.querySelector('animate')).not.toHaveAttribute('end');
    expect(drawing.querySelector('circle')).toHaveAttribute('aria-labelledby', rect.id);
  });

  it('UIC-SVG-MARKUP-1.4 gives each instance its own IDs and keeps local references working', () => {
    const markup =
      '<svg viewBox="0 0 10 10" fill="url(#paint)"><defs><linearGradient id="paint"><stop offset="0" stop-color="#fa0"/></linearGradient><clipPath id="cut"><rect width="5" height="5"/></clipPath><path id="track" d="M0 0h10"/></defs><circle id="dot" r="4" fill="url(#paint)" clip-path="url(&quot;#cut&quot;)"><animateMotion dur="2s" begin="dot.click"><mpath href="#track"/></animateMotion></circle><use xlink:href="#dot"/><set href="#dot" attributeName="opacity" to="0.5"/></svg>';
    const tree = parseSvgMarkup(markup);
    const { container } = render(
      <>
        <SvgMarkup markup={markup} />
        <SvgMarkup markup={markup} />
      </>,
    );
    const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const svg of container.querySelectorAll('svg')) {
      const paint = svg.querySelector('linearGradient')?.id ?? '';
      const dot = svg.querySelector('circle')?.id ?? '';
      expect(svg).toHaveAttribute('fill', `url(#${paint})`);
      expect(svg.querySelector('circle')).toHaveAttribute('fill', `url(#${paint})`);
      expect(svg.querySelector('circle')).toHaveAttribute(
        'clip-path',
        `url("#${svg.querySelector('clipPath')?.id ?? ''}")`,
      );
      expect(svg.querySelector('mpath')).toHaveAttribute(
        'href',
        `#${svg.querySelector('path')?.id ?? ''}`,
      );
      expect(svg.querySelector('animateMotion')).toHaveAttribute('begin', `${dot}.click`);
      expect(svg.querySelector('use')?.getAttribute('xlink:href')).toBe(`#${dot}`);
      expect(svg.querySelector('set')).toHaveAttribute('href', `#${dot}`);
    }
    expect(parseSvgMarkup(markup)).toBe(tree);
    expect(JSON.stringify(tree)).not.toMatch(/"id":"[^"]+_paint"/);
  });

  it('UIC-SVG-MARKUP-1.4 hydrates server-rendered drawings with the same IDs', async () => {
    const markup =
      '<svg><defs><linearGradient id="paint"/></defs><rect fill="url(#paint)" width="4" height="4"/></svg>';
    const app = (
      <>
        <SvgMarkup markup={markup} />
        <SvgMarkup markup={markup} />
      </>
    );
    const host = document.createElement('div');
    host.innerHTML = renderToString(app);
    document.body.append(host);
    const served = host.innerHTML;
    const errors = vi.spyOn(console, 'error');
    const root = await act(async () => hydrateRoot(host, app));
    expect(host.innerHTML).toBe(served);
    expect(errors).not.toHaveBeenCalled();
    const fills = [...host.querySelectorAll('rect')].map((rect) => rect.getAttribute('fill'));
    expect(new Set(fills).size).toBe(2);
    act(() => root.unmount());
    host.remove();
  });

  it('UIC-SVG-MARKUP-2.2 keeps drawing attributes and drops the attributes the component owns', () => {
    const { container } = render(<SvgMarkup markup={outlineMarkup} />);
    const svg = container.firstElementChild as SVGSVGElement;
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-width', '1.5');
    expect(svg).toHaveAttribute('class', 'ui-svg-markup');
    for (const owned of ['width', 'height', 'style', 'id', 'role', 'tabindex', 'data-slot']) {
      expect(svg).not.toHaveAttribute(owned);
    }
    expectHooksMatchSpec(container, 'SVG-MARKUP');
  });

  it('UIC-SVG-MARKUP-2.3 is decorative without a label and an image with one', () => {
    const { container, rerender } = render(<SvgMarkup markup={outlineMarkup} />);
    const svg = container.firstElementChild;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).not.toHaveAttribute('role');

    rerender(<SvgMarkup markup={outlineMarkup} label="Add" />);
    const image = screen.getByRole('img', { name: 'Add' });
    expect(image).not.toHaveAttribute('aria-hidden');
    expect(image).toHaveAttribute('focusable', 'false');
  });

  it('UIC-SVG-MARKUP-2.3 fills an Icon, which owns the name and size', () => {
    const { container } = render(
      <Icon size="lg" label="Add" data-icon="plus">
        <SvgMarkup markup={outlineMarkup} />
      </Icon>,
    );
    const icon = screen.getByRole('img', { name: 'Add' });
    expect(icon).toHaveAttribute('data-size', 'lg');
    const svg = icon.firstElementChild;
    expect(svg).toHaveClass('ui-svg-markup');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(container, 'SVG-MARKUP', { callerAttributes: ['data-icon'] });
  });

  it('UIC-SVG-MARKUP-2.4 renders nothing for markup without a drawing', () => {
    const { container, rerender } = render(<SvgMarkup markup="" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<SvgMarkup markup="<span>missing</span>" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('UIC-SVG-MARKUP-2.5 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <SvgMarkup markup={solidMarkup} className="caller" id="mark" data-sample="probe" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('ui-svg-markup', 'caller');
    expect(svg).toHaveAttribute('id', 'mark');
    expect(svg).toHaveAttribute('data-sample', 'probe');
    expectHooksMatchSpec(container, 'SVG-MARKUP', { callerAttributes: ['data-sample'] });
  });
});
