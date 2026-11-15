import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CopyGlyph } from '../../core/glyphs.js';
import { ToolbarRow, type ToolbarRowOverflow } from './toolbar-row.js';

/** Gives each tool a width of ten pixels per character, and the strip `width`. */
function stubWidths(width: () => number, itemWidth?: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const isItem = this.classList.contains('ui-toolbar-row__item');
    const size = itemWidth ?? (this.textContent ?? '').length * 10;
    return new DOMRect(0, 0, isItem ? size : 0, 24);
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains('ui-toolbar-row__strip') ? width() : 0;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

const itemTexts = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.ui-toolbar-row__item'), (item) => item.textContent);

describe('ToolbarRow overflow menu', () => {
  it('UIC-TOOLBAR-ROW-2.1 draws tools from data as direct children of the strip', () => {
    const { container } = render(
      <ToolbarRow
        aria-label="Format"
        overflow="scroll"
        items={[
          { id: 'bold', label: 'Bold' },
          { id: 'italic', label: 'Italic' },
        ]}
        renderItem={(item) => <button type="button">{item.label}</button>}
      />,
    );
    const strip = screen.getByRole('toolbar', { name: 'Format' });
    expect(strip).toHaveClass('ui-toolbar-row__strip');
    expect(Array.from(strip.children, (child) => child.textContent)).toEqual(['Bold', 'Italic']);
    expect(itemTexts(container)).toEqual(['Bold', 'Italic']);
  });

  it('UIC-TOOLBAR-ROW-2.1 keeps each tool when numeric and text ids reorder', async () => {
    const user = userEvent.setup();
    const items = [
      { id: 1, label: 'Numeric tool' },
      { id: '1', label: 'Text tool' },
    ];
    const renderItem = (item: (typeof items)[number]) => (
      <input aria-label={item.label} defaultValue={item.label} />
    );
    const { rerender } = render(<ToolbarRow items={items} renderItem={renderItem} />);
    await user.type(screen.getByRole('textbox', { name: 'Numeric tool' }), ' changed');
    rerender(<ToolbarRow items={[...items].reverse()} renderItem={renderItem} />);
    expect(screen.getByRole('textbox', { name: 'Numeric tool' })).toHaveValue(
      'Numeric tool changed',
    );
    expect(screen.getByRole('textbox', { name: 'Text tool' })).toHaveValue('Text tool');
  });

  it('UIC-TOOLBAR-ROW-2.1 scrolls when menu has no tools as data, and a vertical row neither', () => {
    const { container, rerender } = render(
      <ToolbarRow aria-label="Format" overflow="menu">
        <button type="button">Bold</button>
      </ToolbarRow>,
    );
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('data-overflow', 'scroll');
    rerender(
      <ToolbarRow
        aria-label="Format"
        overflow="menu"
        orientation="vertical"
        items={[{ id: 'bold', label: 'Bold' }]}
        renderItem={(item) => <button type="button">{item.label}</button>}
      />,
    );
    expect(root).toHaveAttribute('data-overflow', 'none');
    expect(container.querySelector('.ui-toolbar-row__overflow')).toBeNull();
  });

  it('UIC-TOOLBAR-ROW-2.2 keeps the tools that fit by priority and lists the others in a menu', async () => {
    const user = userEvent.setup();
    stubWidths(() => 160);
    const onLink = vi.fn();
    const { container } = render(
      <ToolbarRow
        aria-label="Format"
        overflow="menu"
        items={[
          { id: 'bold', label: 'Bold' },
          { id: 'italic', label: 'Italic' },
          { id: 'underline', label: 'Underline' },
          { id: 'link', label: 'Link', icon: CopyGlyph, priority: 1, onAction: onLink },
          { id: 'clear', label: 'Clear', isDisabled: true },
        ]}
        renderItem={(item) => <button type="button">{item.label}</button>}
      />,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Format' });
    expect(toolbar.parentElement).toHaveAttribute('data-overflow', 'menu');
    expect(toolbar.parentElement).toHaveAttribute('data-wrap', 'nowrap');
    // Link (40) is kept first, then Bold (40) and Italic (60); Underline would not fit.
    expect(itemTexts(container)).toEqual(['Bold', 'Italic', 'Link']);
    expect(toolbar.lastElementChild).toHaveClass('ui-toolbar-row__overflow');
    expect(container.querySelector('.ui-toolbar-row__fade')).toBeNull();
    expect(container.querySelector('.ui-toolbar-row__scroll-button')).toBeNull();
    expectHooksMatchSpec(container, 'TOOLBAR-ROW', { slots: ['strip', 'item', 'overflow'] });

    await user.tab();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    const more = screen.getByRole('button', { name: '2 more items' });
    expect(more).toHaveFocus();
    await user.keyboard('{Enter}');
    expect((await screen.findAllByRole('menuitem')).map((item) => item.textContent)).toEqual([
      'Underline',
      'Clear',
    ]);
    expect(screen.getByRole('menuitem', { name: 'Clear' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('UIC-TOOLBAR-ROW-2.2 runs a hidden tool chosen from the menu', async () => {
    const user = userEvent.setup();
    stubWidths(() => 50);
    const onLink = vi.fn();
    render(
      <ToolbarRow
        aria-label="Format"
        overflow="menu"
        items={[
          { id: 'bold', label: 'Bold' },
          { id: 'link', label: 'Link', onAction: onLink },
        ]}
        renderItem={(item) => <button type="button">{item.label}</button>}
      />,
    );
    await user.click(screen.getByRole('button', { name: '1 more item' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Link' }));
    expect(onLink).toHaveBeenCalledOnce();
  });

  it('UIC-TOOLBAR-ROW-2.3 keeps visible tools mounted with their drafts and focus across overflow modes', async () => {
    const user = userEvent.setup();
    let width = 400;
    stubWidths(() => width, 50);
    const items = [
      { id: 'search', label: 'Search' },
      { id: 'tag', label: 'Tag' },
      { id: 2, label: 'Two' },
    ];
    const draw = (item: { label: string }) => <input aria-label={item.label} />;
    const row = (props: { overflow: ToolbarRowOverflow; showScrollButtons?: boolean }) => (
      <ToolbarRow aria-label="Tools" items={items} renderItem={draw} {...props} />
    );
    const { rerender } = render(row({ overflow: 'scroll' }));
    const search = screen.getByRole('textbox', { name: 'Search' });
    const two = screen.getByRole('textbox', { name: 'Two' });
    await user.type(search, 'draft');
    for (const props of [
      { overflow: 'menu' as const },
      { overflow: 'scroll' as const, showScrollButtons: false },
      { overflow: 'wrap' as const },
      { overflow: 'menu' as const },
    ]) {
      rerender(row(props));
      expect(screen.getByRole('textbox', { name: 'Search' })).toBe(search);
      expect(search).toHaveValue('draft');
      expect(search).toHaveFocus();
      expect(screen.getByRole('textbox', { name: 'Two' })).toBe(two);
    }

    // Narrowed so that two tools no longer fit: the focused last tool collapses into the menu,
    // and focus moves to the menu button instead of falling to the page.
    two.focus();
    width = 120;
    rerender(row({ overflow: 'scroll' }));
    rerender(row({ overflow: 'menu' }));
    expect(screen.queryByRole('textbox', { name: 'Two' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^\d+ more/ })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Search' })).toBe(search);
  });
});
