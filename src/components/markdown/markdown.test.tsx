import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { TextMatchProvider } from '../text-match/text-match.js';
import { listMarkdownHeadings } from './markdown-headings.js';
import { Markdown } from './markdown.js';
import { parseMarkdown } from './parse-markdown.js';

const article = [
  '# Orchard guide',
  '',
  'Pick *ripe* fruit, **gently**, and ~~quickly~~.  ',
  'Store it cool.',
  '',
  '> Apples keep for months.',
  '',
  '- Apples',
  '- Pears',
  '',
  '3. Wash',
  '4. Slice',
  '',
  '1) Loose',
  '',
  '2) List',
  '',
  '***',
  '',
  '![A pear on a branch](/images/pear.png "Pear")',
].join('\n');

describe('Markdown', () => {
  it('UIC-MARKDOWN-2.1 renders each node as its HTML element', () => {
    const { container } = render(<Markdown source={article} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(screen.getByRole('heading', { level: 1, name: 'Orchard guide' })).not.toHaveAttribute(
      'id',
    );
    const paragraph = root.querySelector('p') as HTMLElement;
    expect(paragraph.querySelector('em')).toHaveTextContent('ripe');
    expect(paragraph.querySelector('strong')).toHaveTextContent('gently');
    expect(paragraph.querySelector('del')).toHaveTextContent('quickly');
    expect(paragraph.querySelector('br')).not.toBeNull();
    expect(root.querySelector('blockquote > p')).toHaveTextContent('Apples keep for months.');
    const [bullets, numbered, loose] = [...root.querySelectorAll('ul, ol')];
    expect(bullets?.tagName).toBe('UL');
    expect(bullets?.querySelector('li')?.innerHTML).toBe('Apples');
    expect(numbered).toHaveAttribute('start', '3');
    expect(loose).not.toHaveAttribute('start');
    expect(loose?.querySelectorAll('li > p')).toHaveLength(2);
    expect(root.querySelector('hr.ui-separator')).not.toBeNull();
    const image = screen.getByRole('img', { name: 'A pear on a branch' });
    expect(image).toHaveAttribute('src', '/images/pear.png');
    expect(image).toHaveAttribute('title', 'Pear');
    expect(image).toHaveClass('ui-markdown__image');
    expectHooksMatchSpec(container, 'MARKDOWN', { slots: ['image'] });
  });

  it('UIC-MARKDOWN-2.2 gives headings prefixed ids and points in-page links at them', () => {
    const source =
      '## Setup\n\n## Setup\n\nSee [setup](#setup), [again](#setup-2) and [top](#top).';
    const { rerender } = render(<Markdown source={source} headingIdPrefix="guide-" />);
    const [first, second] = screen.getAllByRole('heading', { level: 2 });
    expect(first).toHaveAttribute('id', 'guide-setup');
    expect(second).toHaveAttribute('id', 'guide-setup-2');
    expect(screen.getByRole('link', { name: 'setup' })).toHaveAttribute('href', '#guide-setup');
    expect(screen.getByRole('link', { name: 'again' })).toHaveAttribute('href', '#guide-setup-2');
    expect(screen.getByRole('link', { name: 'top' })).toHaveAttribute('href', '#top');
    rerender(<Markdown source={source} headingIdPrefix="" />);
    expect(screen.getAllByRole('heading')[0]).toHaveAttribute('id', 'setup');
    expect(screen.getByRole('link', { name: 'setup' })).toHaveAttribute('href', '#setup');
    rerender(<Markdown source={source} />);
    expect(screen.getAllByRole('heading')[0]).not.toHaveAttribute('id');
  });

  it('UIC-MARKDOWN-2.3 draws links through Link and the provider, opening absolute URLs in a new tab', () => {
    const { container } = render(
      <UiProvider renderLink={(props) => <a {...props} data-routed="true" />}>
        <Markdown source="[Docs](/docs) and [Example](https://example.com) and <mail@example.com>" />
      </UiProvider>,
    );
    const internal = screen.getByRole('link', { name: 'Docs' });
    expect(internal).toHaveClass('ui-link');
    expect(internal).toHaveAttribute('data-routed', 'true');
    expect(internal).not.toHaveAttribute('target');
    const external = screen.getByRole('link', { name: /Example/ });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');
    expect(external).toHaveAccessibleName('Example (opens in a new tab)');
    expect(screen.getByRole('link', { name: 'mail@example.com' })).toHaveAttribute(
      'href',
      'mailto:mail@example.com',
    );
    expectHooksMatchSpec(container, 'MARKDOWN', { callerAttributes: ['data-routed'] });
  });

  it('UIC-MARKDOWN-2.4 marks code blocks with their language and inline code, without highlighting', () => {
    const { container } = render(
      <Markdown source={'Run `npm test`.\n\n```ts\nconst a = 1;\n```\n\n    plain'} />,
    );
    const [typed, plain] = [...container.querySelectorAll('pre')];
    expect(typed).toHaveClass('ui-markdown__code-block');
    expect(typed).toHaveAttribute('data-language', 'ts');
    expect(typed?.querySelector('code')?.innerHTML).toBe('const a = 1;');
    expect(plain).not.toHaveAttribute('data-language');
    expect(container.querySelector('p code')).toHaveClass('ui-markdown__code');
    expectHooksMatchSpec(container, 'MARKDOWN', { slots: ['code-block', 'code'] });
  });

  it('UIC-MARKDOWN-2.5 renders tables through ProseTable with column alignment', () => {
    render(<Markdown source={'| Fruit | Crates |\n|:--|--:|\n| Apple | 12 |\n| Pear |'} />);
    const table = screen.getByRole('table');
    expect(table).toHaveClass('ui-prose-table');
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Fruit', 'Crates']);
    expect(within(table).getAllByRole('cell')[1]).toHaveAttribute('data-align', 'end');
    expect(within(table).getAllByRole('row')).toHaveLength(3);
  });

  it('UIC-MARKDOWN-2.6 draws task items as read-only checkboxes named by their text', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Markdown source={'- [x] Pick apples\n- [ ] Press **cider**\n\n  Later.\n- Plain'} />,
    );
    const done = screen.getByRole('checkbox', { name: 'Pick apples' });
    const open = screen.getByRole('checkbox', { name: 'Press cider' });
    expect(done).toBeChecked();
    expect(open).not.toBeChecked();
    await user.click(open);
    expect(open).not.toBeChecked();
    const tasks = container.querySelectorAll('li.ui-markdown__task');
    expect(tasks).toHaveLength(2);
    expect(tasks[1]?.querySelector('p')).toHaveTextContent('Later.');
    expectHooksMatchSpec(container, 'MARKDOWN', { slots: ['task'] });
  });

  it('UIC-MARKDOWN-2.7 renders text through TextMatch so a provider highlights the query', () => {
    const { container } = render(
      <TextMatchProvider query="pear">
        <Markdown source={'A **pear** tree.\n\n```\npear()\n```'} />
      </TextMatchProvider>,
    );
    const marks = container.querySelectorAll('mark.ui-text-match');
    expect([...marks].map((mark) => mark.textContent)).toEqual(['pear', 'pear']);
  });

  it('UIC-MARKDOWN-2.8 lets the caller replace the rendering of any node', () => {
    const renderNode = vi.fn((node, children) => {
      if (node.type === 'codeBlock' && node.language === 'chart') {
        return <figure data-testid="chart">{node.text}</figure>;
      }
      if (node.type === 'image') return null;
      if (node.type === 'strong') return <b data-testid="bold">{children}</b>;
      return undefined;
    });
    render(
      <Markdown
        source={'```chart\npie\n```\n\n![gone](/x.png) **kept**'}
        renderNode={renderNode}
      />,
    );
    expect(screen.getByTestId('chart')).toHaveTextContent('pie');
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByTestId('bold')).toHaveTextContent('kept');
    expect(renderNode).toHaveBeenCalledWith(expect.objectContaining({ type: 'image' }), null);
  });

  it('UIC-MARKDOWN-2.9 renders a parsed document shared with an outline', () => {
    const document = parseMarkdown('# Guide\n\n## Planting');
    render(<Markdown source={document} headingIdPrefix="doc-" />);
    const ids = listMarkdownHeadings(document, 'doc-').map((heading) => heading.id);
    expect(screen.getAllByRole('heading').map((heading) => heading.id)).toEqual(ids);
  });

  it('UIC-MARKDOWN-2.10 carries its hooks, the caller class, id and data attributes', () => {
    const { container } = render(
      <Markdown source="Text" className="caller" id="notes" data-testid="probe" />,
    );
    const root = screen.getByTestId('probe');
    expect(root).toHaveClass('ui-markdown', 'caller');
    expect(root).toHaveAttribute('id', 'notes');
    expectHooksMatchSpec(container, 'MARKDOWN');
  });

  it('UIC-MARKDOWN-3.1 keeps native semantics and never injects raw HTML', () => {
    const { container } = render(
      <Markdown source={'## Notes\n\n<img src=x onerror="alert(1)"><script>alert(1)</script>'} />,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Notes');
    expect(container.querySelector('script, img')).toBeNull();
    expect(container.querySelector('p')).toHaveTextContent('<img src=x onerror="alert(1)">');
    for (const file of ['markdown.tsx', 'parse-markdown.ts', 'markdown-inlines.ts']) {
      const code = readFileSync(join(process.cwd(), 'src/components/markdown', file), 'utf8');
      expect(code).not.toMatch(/dangerouslySetInnerHTML|innerHTML|DOMParser|document\./);
    }
  });
});
