import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { UiProvider } from '../../core/provider.js';
import { Outline, type OutlineProps } from './outline.js';
import { nestOutlineHeadings, type OutlineHeading } from './outline-tree.js';

const headings: readonly OutlineHeading[] = [
  { id: 'intro', label: 'Introduction', level: 1 },
  { id: 'scope', label: 'Scope', level: 2 },
  { id: 'terms', label: 'Terms', level: 2 },
  { id: 'abbreviations', label: 'Abbreviations', level: 3 },
  { id: 'design', label: 'Design', level: 1 },
  { id: 'layout', label: 'Layout', level: 2 },
];

const item = (name: string) =>
  screen.getByRole('link', { name: new RegExp(`${name}$`) }).closest('li') as HTMLElement;
const toggle = (name: string) => screen.getByRole('button', { name: `Sections in ${name}` });

let scrollIntoView: ReturnType<typeof vi.fn>;

beforeEach(() => {
  scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView as unknown as Element['scrollIntoView'];
});

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
});

describe('Outline', () => {
  it('UIC-OUTLINE-1.1 renders a named navigation landmark of nested heading links', () => {
    const { container } = render(<Outline headings={headings} />);
    const nav = screen.getByRole('navigation', { name: 'Outline' });
    expect(nav).toHaveClass('ui-outline');
    expect(nav.tagName).toBe('NAV');
    const top = nav.querySelector(':scope > ol.ui-outline__list') as HTMLElement;
    expect([...top.children].map((child) => child.tagName)).toEqual(['LI', 'LI']);
    const link = screen.getByRole('link', { name: 'Scope' });
    expect(link).toHaveAttribute('href', '#scope');
    expect(link).toHaveClass('ui-outline__link');
    expect(link.querySelector('.ui-outline__label')).toHaveTextContent('Scope');
    expect(item('Scope')).toHaveAttribute('data-level', '2');
    expect(item('Scope').querySelector('.ui-outline__row')).toContainElement(link);
    expectHooksMatchSpec(container, 'OUTLINE', { slots: ['list', 'item', 'row', 'link', 'label'] });
  });

  it('UIC-OUTLINE-1.1 takes its name from the caller or the provider', () => {
    const { rerender } = render(<Outline headings={headings} aria-label="On this page" />);
    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
    rerender(
      <>
        <h2 id="contents-title">Contents</h2>
        <Outline headings={headings} aria-labelledby="contents-title" />
      </>,
    );
    expect(screen.getByRole('navigation', { name: 'Contents' })).not.toHaveAttribute('aria-label');
    rerender(
      <UiProvider strings={{ outline: 'Sommaire' }}>
        <Outline headings={headings} />
      </UiProvider>,
    );
    expect(screen.getByRole('navigation', { name: 'Sommaire' })).toBeInTheDocument();
  });

  it('UIC-OUTLINE-1.2 nests each heading under the nearest shallower heading before it', () => {
    const tree = nestOutlineHeadings([
      { id: 'a', label: 'A', level: 2 },
      { id: 'b', label: 'B', level: 1 },
      { id: 'c', label: 'C', level: 3 },
      { id: 'd', label: 'D', level: 2 },
      { id: 'e', label: 'E', level: 3 },
    ]);
    const describe = (entries: typeof tree): unknown =>
      entries.map((entry) => [entry.heading.id, entry.path.join('.'), describe(entry.children)]);
    expect(describe(tree)).toEqual([
      ['a', '0', []],
      [
        'b',
        '1',
        [
          ['c', '1.0', []],
          ['d', '1.1', [['e', '1.1.0', []]]],
        ],
      ],
    ]);
    expect(tree[1]?.children[1]?.children[0]?.ancestors).toEqual(['b', 'd']);
    render(<Outline headings={headings} />);
    const terms = item('Terms');
    expect(within(terms).getByRole('link', { name: 'Abbreviations' })).toBeInTheDocument();
    expect(item('Introduction')).toContainElement(terms);
  });

  it('UIC-OUTLINE-1.3 numbers entries by their place in the outline', () => {
    const { container, rerender } = render(<Outline headings={headings} isNumbered />);
    expect(screen.getByRole('navigation')).toHaveAttribute('data-numbered', 'true');
    expect(screen.getByRole('link', { name: '1.2.1 Abbreviations' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2.1 Layout' })).toBeInTheDocument();
    expect(item('Layout').querySelector('.ui-outline__number')).toHaveTextContent('2.1');
    expectHooksMatchSpec(container, 'OUTLINE', { slots: ['number'] });
    rerender(
      <Outline
        headings={headings}
        isNumbered
        numberOptions={{ styles: ['upper-roman', 'lower-alpha'], separator: '-' }}
      />,
    );
    expect(screen.getByRole('link', { name: 'I-b-a Abbreviations' })).toBeInTheDocument();
    rerender(<Outline headings={headings} />);
    expect(container.querySelector('.ui-outline__number')).toBeNull();
    expect(screen.getByRole('navigation')).not.toHaveAttribute('data-numbered');
  });

  it('UIC-OUTLINE-1.4 shows loading and empty notices', () => {
    const { container, rerender } = render(<Outline headings={[]} isPending />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-busy', 'true');
    expect(nav).toHaveAttribute('data-pending', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(container.querySelector('.ui-outline__empty')).toHaveClass('ui-empty-state');
    expectHooksMatchSpec(container, 'OUTLINE', { slots: ['empty'] });
    rerender(<Outline headings={[]} emptyMessage="No headings yet." />);
    expect(nav).not.toHaveAttribute('aria-busy');
    expect(container.querySelector('.ui-outline__empty')).toHaveTextContent('No headings yet.');
    rerender(<Outline headings={[]} />);
    expect(container.querySelector('.ui-outline__empty')).toBeNull();
    rerender(<Outline headings={headings} isPending emptyMessage="No headings yet." />);
    expect(container.querySelector('.ui-outline__empty')).toBeNull();
    expect(nav).toHaveAttribute('aria-busy', 'true');
  });

  it('UIC-OUTLINE-2.1 marks the current heading and the entries around it', () => {
    const { container, rerender } = render(
      <Outline headings={headings} currentId="abbreviations" />,
    );
    const current = screen.getByRole('link', { name: 'Abbreviations' });
    expect(current).toHaveAttribute('aria-current', 'location');
    expect(item('Abbreviations')).toHaveAttribute('data-current', 'true');
    expect(item('Terms')).toHaveAttribute('data-current-within', 'true');
    expect(item('Introduction')).toHaveAttribute('data-current-within', 'true');
    expect(item('Design')).not.toHaveAttribute('data-current-within');
    expect(container.querySelectorAll('[aria-current]')).toHaveLength(1);
    expectHooksMatchSpec(container, 'OUTLINE');
    rerender(<Outline headings={headings} currentId={null} />);
    expect(container.querySelectorAll('[aria-current], [data-current]')).toHaveLength(0);
  });

  it('UIC-OUTLINE-2.2 follows the heading the viewport is scrolled to', () => {
    const tops: Record<string, number> = { intro: 0, scope: 300, terms: 600, design: 900 };
    let scrollTop = 0;
    function Reader({ currentId, offset }: { currentId?: string; offset?: number }) {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <>
          <Outline
            headings={headings.filter((heading) => heading.id in tops)}
            viewportRef={ref}
            currentId={currentId}
            trackingOffset={offset}
          />
          <div ref={ref} role="region" aria-label="Viewport">
            {Object.keys(tops).map((id) => (
              <h2 key={id} id={id}>
                {id}
              </h2>
            ))}
          </div>
        </>
      );
    }
    const { rerender } = render(<Reader />);
    const viewport = screen.getByRole('region', { name: 'Viewport' });
    Object.defineProperties(viewport, {
      scrollTop: { configurable: true, get: () => scrollTop },
      scrollHeight: { configurable: true, get: () => 2000 },
      clientHeight: { configurable: true, get: () => 200 },
    });
    viewport.getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
    for (const heading of viewport.querySelectorAll('h2')) {
      heading.getBoundingClientRect = () =>
        ({ top: (tops[heading.id] ?? 0) - scrollTop }) as DOMRect;
    }
    const currentName = () =>
      document.querySelector('.ui-outline [aria-current="location"]')?.textContent;
    fireEvent.scroll(viewport);
    expect(currentName()).toBe('Introduction');
    scrollTop = 620;
    fireEvent.scroll(viewport);
    expect(currentName()).toBe('Terms');
    scrollTop = 560;
    fireEvent.scroll(viewport);
    expect(currentName()).toBe('Scope');
    rerender(<Reader offset={60} />);
    expect(currentName()).toBe('Terms');
    rerender(<Reader currentId="design" />);
    expect(currentName()).toBe('Design');
  });

  it('UIC-OUTLINE-3.1 scrolls to a followed heading and focuses it when it takes focus', async () => {
    const onNavigate = vi.fn();
    render(
      <>
        <Outline headings={headings} onNavigate={onNavigate} />
        <h2 id="scope" tabIndex={-1}>
          Scope
        </h2>
        <h2 id="layout">Layout</h2>
      </>,
    );
    const scope = screen.getByRole('link', { name: 'Scope' });
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    scope.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(onNavigate).toHaveBeenCalledWith('scope');
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('scope'));
    expect(document.getElementById('scope')).toHaveFocus();

    screen.getByRole('link', { name: 'Layout' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onNavigate).toHaveBeenLastCalledWith('layout');
    expect(scrollIntoView.mock.contexts[1]).toBe(document.getElementById('layout'));
    expect(screen.getByRole('link', { name: 'Layout' })).toHaveFocus();

    await userEvent.click(screen.getByRole('link', { name: 'Terms' }));
    expect(onNavigate).toHaveBeenLastCalledWith('terms');
    expect(scrollIntoView).toHaveBeenCalledTimes(2);

    const modified = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    const preventLeave = (event: Event) => event.preventDefault();
    document.addEventListener('click', preventLeave);
    scope.dispatchEvent(modified);
    document.removeEventListener('click', preventLeave);
    expect(onNavigate).toHaveBeenCalledTimes(3);
  });

  it('UIC-OUTLINE-4.1 UIC-OUTLINE-5.1 collapses and expands the entries under a heading', async () => {
    const { container } = render(<Outline headings={headings} />);
    const introToggle = toggle('Introduction');
    expect(introToggle).toHaveClass('ui-expand-toggle');
    expect(introToggle).toHaveAttribute('aria-expanded', 'true');
    const list = document.getElementById(introToggle.getAttribute('aria-controls') ?? '');
    expect(list).toHaveClass('ui-outline__list');
    expect(item('Introduction')).toHaveAttribute('data-expanded', 'true');
    expect(item('Scope').querySelector('.ui-expand-toggle')).toHaveAttribute('data-leaf', 'true');
    expect(screen.queryByRole('button', { name: 'Sections in Scope' })).not.toBeInTheDocument();
    expectHooksMatchSpec(container, 'OUTLINE');

    await userEvent.click(introToggle);
    expect(introToggle).toHaveAttribute('aria-expanded', 'false');
    expect(list).not.toBeVisible();
    expect(list).toHaveAttribute('hidden');
    expect(item('Introduction')).not.toHaveAttribute('data-expanded');
    expect(screen.queryByRole('link', { name: 'Scope' })).not.toBeInTheDocument();

    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Introduction' })).toHaveFocus();
    await userEvent.tab();
    expect(toggle('Design')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(toggle('Design')).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard(' ');
    expect(toggle('Design')).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-OUTLINE-4.1 draws no toggles for a flat outline', () => {
    const { container } = render(
      <Outline headings={headings.filter((heading) => heading.level === 1)} />,
    );
    expect(container.querySelector('.ui-expand-toggle')).toBeNull();
  });

  it('UIC-OUTLINE-4.2 starts collapsed below a level and reports the expanded entries', async () => {
    const onExpandedChange = vi.fn();
    const { unmount } = render(
      <Outline headings={headings} collapseBelowLevel={2} onExpandedChange={onExpandedChange} />,
    );
    expect(toggle('Introduction')).toHaveAttribute('aria-expanded', 'true');
    expect(toggle('Terms')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Abbreviations' })).not.toBeInTheDocument();
    await userEvent.click(toggle('Terms'));
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(['intro', 'terms', 'design']));
    expect(screen.getByRole('link', { name: 'Abbreviations' })).toBeVisible();
    unmount();

    render(<Outline headings={headings} defaultExpandedKeys={['design']} />);
    expect(toggle('Introduction')).toHaveAttribute('aria-expanded', 'false');
    expect(toggle('Design')).toHaveAttribute('aria-expanded', 'true');
  });

  it('UIC-OUTLINE-4.2 lets the caller control the expanded entries', async () => {
    function Controlled(props: Partial<OutlineProps>) {
      const [keys, setKeys] = useState<Set<Key>>(new Set(['intro']));
      return (
        <>
          <output aria-label="Expanded">{[...keys].join(',')}</output>
          <Outline
            {...props}
            headings={headings}
            expandedKeys={keys}
            onExpandedChange={(next) =>
              setKeys(new Set([...next].filter((key) => key !== 'terms')))
            }
          />
        </>
      );
    }
    render(<Controlled />);
    expect(toggle('Design')).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle('Design'));
    expect(screen.getByRole('status', { name: 'Expanded' })).toHaveTextContent('intro,design');
    await userEvent.click(toggle('Terms'));
    expect(toggle('Terms')).toHaveAttribute('aria-expanded', 'false');
  });

  it('UIC-OUTLINE-5.2 forwards its class, id, caller attributes and description', () => {
    const { container } = render(
      <>
        <p id="outline-hint">Follow an entry to jump to it.</p>
        <Outline
          headings={headings}
          className="side-outline"
          id="page-outline"
          data-panel="left"
          aria-describedby="outline-hint"
        />
      </>,
    );
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('ui-outline', 'side-outline');
    expect(nav).toHaveAttribute('id', 'page-outline');
    expect(nav).toHaveAttribute('data-panel', 'left');
    expect(nav).toHaveAccessibleDescription('Follow an entry to jump to it.');
    expectHooksMatchSpec(container, 'OUTLINE', { callerAttributes: ['data-panel'] });
  });
});
