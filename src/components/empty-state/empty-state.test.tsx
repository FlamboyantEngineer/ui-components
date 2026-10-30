import { FolderGlyph } from '../../core/glyphs.js';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { EmptyState } from './empty-state.js';

describe('EmptyState', () => {
  it('UIC-EMPTY-STATE-1.1 renders a level-three heading before the description', () => {
    const { container } = render(<EmptyState title="No rows" description="Add a row to start." />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('SECTION');
    const [heading, description] = Array.from(root.children);
    expect(heading).toBe(screen.getByRole('heading', { level: 3, name: 'No rows' }));
    expect(heading).toHaveClass('ui-empty-state__title');
    expect(description?.tagName).toBe('P');
    expect(description).toHaveClass('ui-empty-state__description');
    expect(description).toHaveTextContent('Add a row to start.');
    expectHooksMatchSpec(container, 'EMPTY-STATE', { slots: ['title', 'description'] });
  });

  it('UIC-EMPTY-STATE-1.1 omits the heading without a title and honours the heading level', () => {
    const { container, rerender } = render(<EmptyState description="Nothing yet." />);
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    rerender(<EmptyState title="" description="Nothing yet." />);
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    rerender(<EmptyState title="No files" headingLevel={4} description="Nothing yet." />);
    expect(screen.getByRole('heading', { level: 4, name: 'No files' })).toBeInTheDocument();
  });

  it('UIC-EMPTY-STATE-1.2 UIC-EMPTY-STATE-1.3 publishes variant and size with defaults', () => {
    const { container, rerender } = render(<EmptyState description="Nothing yet." />);
    expect(container.firstElementChild).toHaveAttribute('data-variant', 'empty');
    expect(container.firstElementChild).toHaveAttribute('data-size', 'md');
    for (const variant of ['empty', 'loading', 'error'] as const) {
      for (const size of ['sm', 'md'] as const) {
        rerender(
          <EmptyState variant={variant} size={size} title="Title" description="Description" />,
        );
        expect(container.firstElementChild).toHaveAttribute('data-variant', variant);
        expect(container.firstElementChild).toHaveAttribute('data-size', size);
        expectHooksMatchSpec(container, 'EMPTY-STATE', { slots: ['title', 'description'] });
      }
    }
  });

  it('UIC-EMPTY-STATE-1.2 draws empty and error with the same structure', () => {
    const { container, rerender } = render(
      <EmptyState title="No rows" description="Nothing matches." />,
    );
    const empty = Array.from(container.querySelectorAll('*'), (node) => node.className);
    rerender(<EmptyState variant="error" title="Unable to load" description="Try again later." />);
    const error = Array.from(container.querySelectorAll('*'), (node) => node.className);
    expect(error).toEqual(empty);
  });

  it('UIC-EMPTY-STATE-1.4 announces loading politely with a decorative spinner and typographic ellipsis', () => {
    const { container } = render(<EmptyState variant="loading" description="Loading records..." />);
    const root = screen.getByRole('status');
    expect(root).toBe(container.firstElementChild);
    expect(root).toHaveAttribute('aria-live', 'polite');
    expect(root).toHaveAttribute('aria-atomic', 'true');
    expect(root).not.toHaveAttribute('aria-busy');
    expect(root).toHaveTextContent('Loading records…');
    const spinner = root.querySelector('.ui-empty-state__spinner');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
    expect(spinner).toBe(root.firstElementChild);
    expectHooksMatchSpec(container, 'EMPTY-STATE', { slots: ['spinner', 'description'] });
  });

  it('UIC-EMPTY-STATE-1.5 settles without a spinner or live region of its own', () => {
    const { container, rerender } = render(
      <EmptyState variant="loading" description="Loading records..." />,
    );
    rerender(<EmptyState title="No rows" description="No records..." />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-live], [aria-hidden], [tabindex]')).toBeNull();
    expect(container.querySelector('.ui-empty-state__spinner')).toBeNull();
    expect(container.querySelector('p')).toHaveTextContent('No records...');
    rerender(<EmptyState variant="error" title="Unable to load" description="Try again." />);
    expect(container.querySelector('[role], [aria-live]')).toBeNull();
  });

  it('UIC-EMPTY-STATE-1.6 appends the caller class and forwards id, visibility and data attributes', () => {
    const { container } = render(
      <EmptyState
        description="Nothing yet."
        className="caller"
        id="empty"
        hidden
        data-testid="probe"
        data-variant="caller"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('ui-empty-state', 'caller');
    expect(root).toHaveAttribute('id', 'empty');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).toHaveAttribute('data-variant', 'empty');
    expect(root.hidden).toBe(true);
    expectHooksMatchSpec(container, 'EMPTY-STATE');
  });

  it('UIC-EMPTY-STATE-2.1 draws a decorative illustration before the heading, or the spinner while loading', () => {
    const { container, rerender } = render(
      <EmptyState icon={FolderGlyph} title="No files" description="Upload a file to start." />,
    );
    const root = container.firstElementChild as HTMLElement;
    const [icon, heading] = Array.from(root.children);
    expect(icon).toHaveClass('ui-icon', 'ui-empty-state__icon');
    expect(icon).toHaveAttribute('data-glyph', 'folder');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(heading).toHaveClass('ui-empty-state__title');
    expectHooksMatchSpec(container, 'EMPTY-STATE', { slots: ['icon', 'title', 'description'] });

    rerender(<EmptyState icon={<img alt="" src="empty.svg" />} description="Nothing yet." />);
    expect(container.querySelector('.ui-empty-state__icon img')).not.toBeNull();
    rerender(<EmptyState variant="loading" icon={FolderGlyph} description="Loading..." />);
    expect(container.querySelector('.ui-empty-state__icon')).toBeNull();
    expect(container.querySelector('.ui-empty-state__spinner')).not.toBeNull();
    rerender(<EmptyState icon={null} description="Nothing yet." />);
    expect(container.querySelector('.ui-empty-state__icon')).toBeNull();
  });

  it('UIC-EMPTY-STATE-2.2 renders calls to action after the description', async () => {
    const onAdd = vi.fn();
    const { container, rerender } = render(
      <EmptyState
        title="No cities"
        description="Add a city to see it here."
        actions={
          <button type="button" onClick={onAdd}>
            Add city
          </button>
        }
      />,
    );
    const actions = container.querySelector('.ui-empty-state__actions');
    expect(actions?.previousElementSibling).toHaveClass('ui-empty-state__description');
    expect(actions?.parentElement).toBe(container.firstElementChild);
    await userEvent.click(screen.getByRole('button', { name: 'Add city' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'EMPTY-STATE', { slots: ['title', 'description', 'actions'] });

    rerender(<EmptyState description="Nothing yet." actions={false} />);
    expect(container.querySelector('.ui-empty-state__actions')).toBeNull();
  });
});
