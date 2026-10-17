import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Icon } from '../icon/icon.js';
import { SvgMarkup } from './svg-markup.js';

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
  it('UIC-SVG-MARKUP-2.1 renders markup as React elements with converted attributes', () => {
    const outline = renderToStaticMarkup(<SvgMarkup markup={outlineMarkup} />);
    expect(outline).toMatch(/^<svg/);
    expect(outline).toMatch(/viewBox="0 0 24 24"/);
    expect(outline).toMatch(/stroke-width="1.5"/);
    expect(outline).toMatch(
      /<path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/,
    );

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
    expect(use.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#dot');
    expect(use).toHaveClass('outline');
    expect(use.style.getPropertyValue('fill')).toMatch(/^url\("?#fade"?\)$/);
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

  it('UIC-SVG-MARKUP-2.2 keeps drawing attributes and drops the attributes the component owns', () => {
    const { container } = render(<SvgMarkup markup={outlineMarkup} />);
    const svg = container.firstElementChild as SVGSVGElement;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('stroke-width', '1.5');
    expect(svg.getAttribute('class')).toBe('ui-svg-markup');
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
      <SvgMarkup markup={solidMarkup} className="caller" id="mark" data-testid="probe" />,
    );
    const svg = screen.getByTestId('probe');
    expect(svg).toHaveClass('ui-svg-markup', 'caller');
    expect(svg).toHaveAttribute('id', 'mark');
    expectHooksMatchSpec(container, 'SVG-MARKUP');
  });
});
