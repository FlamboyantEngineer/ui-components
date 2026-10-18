import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { HtmlMarkup } from './html-markup.js';

const reply =
  '<p>Thanks <span data-person="ana" class="mention">@Ana</span>, see <a href="/docs">the docs</a>.</p>' +
  '<table><thead><tr><th colspan="2">Fruit</th></tr></thead><tbody><tr><td>Apple</td><td>12</td></tr></tbody></table>' +
  '<details open><summary>More</summary><ol reversed start="3"><li>Three</li></ol></details>' +
  '<p>Line<br>break <time datetime="2026-01-02">today</time></p><script>window.unsafe = true</script>';

describe('HtmlMarkup', () => {
  it('UIC-HTML-MARKUP-2.1 renders the sanitized tree as React elements with React attribute names', () => {
    const errors = vi.spyOn(console, 'error');
    const { container } = render(<HtmlMarkup markup={reply} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('th')).toHaveAttribute('colspan', '2');
    expect(root.querySelector('details')).toHaveAttribute('open');
    expect(root.querySelector('ol')).toHaveAttribute('reversed');
    expect(root.querySelector('ol')).toHaveAttribute('start', '3');
    expect(root.querySelector('time')).toHaveAttribute('datetime', '2026-01-02');
    expect(root.querySelector('.mention')).toHaveAttribute('data-person', 'ana');
    expect(root.querySelector('br')).not.toBeNull();
    expect(errors).not.toHaveBeenCalled();
    expect(renderToStaticMarkup(<HtmlMarkup markup="<p>a<br>b</p>" />)).toBe(
      '<div class="ui-html-markup"><p>a<br/>b</p></div>',
    );
    for (const file of ['html-markup.tsx', 'sanitize-html.ts', 'html-tree.ts']) {
      const code = readFileSync(join(process.cwd(), 'src/components/html-markup', file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');
      expect(code).not.toMatch(/dangerouslySetInnerHTML|innerHTML|DOMParser|document\./);
    }
  });

  it('UIC-HTML-MARKUP-2.2 draws links through the provider link renderer', () => {
    const { container } = render(
      <UiProvider renderLink={(props) => <a {...props} data-routed="true" />}>
        <HtmlMarkup markup={'<a href="/docs" title="Manual">Docs</a> <a name="anchor">Plain</a>'} />
      </UiProvider>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', '/docs');
    expect(link).toHaveAttribute('title', 'Manual');
    expect(link).toHaveAttribute('data-routed', 'true');
    const plain = container.querySelector('a:not([href])');
    expect(plain).toHaveTextContent('Plain');
    expect(plain).not.toHaveAttribute('data-routed');
  });

  it('UIC-HTML-MARKUP-2.3 lets the caller replace elements', () => {
    render(
      <HtmlMarkup
        markup={reply}
        renderElement={(element, children) => {
          if (element.attributes['data-person']) {
            return <button type="button">{children}</button>;
          }
          if (element.tag === 'table') return null;
          return undefined;
        }}
      />,
    );
    expect(screen.getByRole('button', { name: '@Ana' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('link', { name: 'the docs' })).toBeInTheDocument();
  });

  it('UIC-HTML-MARKUP-2.4 renders text through TextMatch so a provider highlights the query', () => {
    const { container } = render(
      <TextMatchProvider query="apple">
        <HtmlMarkup markup="<p>Apple <b>apples</b></p>" />
      </TextMatchProvider>,
    );
    expect([...container.querySelectorAll('mark')].map((mark) => mark.textContent)).toEqual([
      'Apple',
      'apple',
    ]);
  });

  it('UIC-HTML-MARKUP-2.5 follows its policy prop', () => {
    const policy = { elements: ['p'], attributes: [], schemes: [] };
    const { container } = render(
      <HtmlMarkup markup="<p class='a'><b>bold</b></p>" policy={policy} />,
    );
    expect(container.querySelector('.ui-html-markup')?.innerHTML).toBe('<p>bold</p>');
  });

  it('UIC-HTML-MARKUP-2.6 carries its hook, the caller class, id and data attributes', () => {
    const { container } = render(
      <HtmlMarkup markup="<p>Text</p>" className="caller" id="body" data-testid="probe" />,
    );
    const root = screen.getByTestId('probe');
    expect(root).toHaveClass('ui-html-markup', 'caller');
    expect(root).toHaveAttribute('id', 'body');
    expectHooksMatchSpec(container, 'HTML-MARKUP');
  });

  it('UIC-HTML-MARKUP-3.1 keeps the semantics of the content', () => {
    render(<HtmlMarkup markup={reply + '<h2>Notes</h2><img src="/pear.png" alt="A pear">'} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 2, name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'A pear' })).toBeInTheDocument();
    expect(screen.getByRole('group')).toHaveTextContent('More');
  });
});
