import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { getPaginationItems, Pagination } from './pagination.js';

const pageButtons = () =>
  screen.getAllByRole('button', { name: /^Page / }).map((button) => button.textContent);

function Controlled({ onPageChange }: { onPageChange: (page: number) => void }) {
  const [page, setPage] = useState(2);
  return (
    <Pagination
      pageCount={3}
      page={page}
      onPageChange={(next) => {
        setPage(next);
        onPageChange(next);
      }}
    />
  );
}

describe('Pagination', () => {
  it('UIC-PAGINATION-1.1 renders a named navigation with previous, page and next buttons', () => {
    const { container } = render(<Pagination pageCount={3} />);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    const buttons = within(nav).getAllByRole('button');
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Previous page',
      'Page 1',
      'Page 2',
      'Page 3',
      'Next page',
    ]);
    expect(pageButtons()).toEqual(['1', '2', '3']);
    expect(buttons[0]?.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'chevron-left');
    expect(buttons[4]?.querySelector('[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'chevron-right',
    );
    expectHooksMatchSpec(container, 'PAGINATION', {
      slots: ['list', 'item', 'previous', 'next', 'page'],
    });
  });

  it('UIC-PAGINATION-1.1 names the navigation from aria-label and mirrors arrows right to left', () => {
    render(
      <UiProvider locale="ar-EG">
        <Pagination pageCount={2} aria-label="Fruit pages" />
      </UiProvider>,
    );
    expect(screen.getByRole('navigation', { name: 'Fruit pages' })).toBeInTheDocument();
    const previous = screen.getByRole('button', { name: 'Previous page' });
    expect(previous.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'chevron-right');
    expect(screen.getByRole('button', { name: 'Page ٢' })).toHaveTextContent('٢');
  });

  it('UIC-PAGINATION-1.2 marks the current page and clamps it into range', () => {
    const { rerender } = render(<Pagination pageCount={3} defaultPage={2} />);
    const current = screen.getByRole('button', { name: 'Page 2' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('data-current', 'true');
    expect(screen.getByRole('button', { name: 'Page 1' })).not.toHaveAttribute('aria-current');
    rerender(<Pagination pageCount={3} page={9} />);
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    rerender(<Pagination pageCount={0} page={1} />);
    expect(pageButtons()).toEqual(['1']);
  });

  it('UIC-PAGINATION-1.2 reads a count that is not finite as one page', () => {
    for (const pageCount of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const { unmount } = render(<Pagination pageCount={pageCount} page={4} />);
      expect(pageButtons()).toEqual(['1']);
      expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getByRole('button', { name: 'Next page' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      unmount();
    }
  });

  it.each([
    [4.8, 4],
    [Number.NaN, 1],
    [Number.POSITIVE_INFINITY, 12],
    [Number.NEGATIVE_INFINITY, 1],
  ])('UIC-PAGINATION-1.2 normalizes requested page %s to %s', async (page, expected) => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination pageCount={12} page={page} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: `Page ${String(expected)}` })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(getPaginationItems(page, 12)).toEqual(getPaginationItems(expected, 12));
    const direction = expected === 12 ? 'Previous page' : 'Next page';
    await user.click(screen.getByRole('button', { name: direction }));
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(expected === 12 ? 11 : expected + 1);
  });

  it('UIC-PAGINATION-1.3 moves by page buttons, previous and next, and ignores the current page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Controlled onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(onPageChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    const next = screen.getByRole('button', { name: 'Next page' });
    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(next).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPageChange).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Page 1' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    screen.getByRole('button', { name: 'Page 2' }).focus();
    await user.keyboard('{Enter}');
    expect(onPageChange).toHaveBeenLastCalledWith(2);
  });

  it('UIC-PAGINATION-1.4 lists seven entries with gaps for skipped pages', () => {
    expect(getPaginationItems(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(getPaginationItems(1, 10)).toEqual([1, 2, 3, 4, 5, 'end-gap', 10]);
    expect(getPaginationItems(5, 10)).toEqual([1, 'start-gap', 4, 5, 6, 'end-gap', 10]);
    expect(getPaginationItems(10, 10)).toEqual([1, 'start-gap', 6, 7, 8, 9, 10]);
    expect(getPaginationItems(4, 8)).toEqual([1, 2, 3, 4, 5, 'end-gap', 8]);
    expect(getPaginationItems(5, 8)).toEqual([1, 'start-gap', 4, 5, 6, 7, 8]);
    const { container } = render(<Pagination pageCount={20} defaultPage={10} />);
    expect(pageButtons()).toEqual(['1', '9', '10', '11', '20']);
    const gaps = container.querySelectorAll('.ui-pagination__ellipsis');
    expect(gaps).toHaveLength(2);
    expect(gaps[0]).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(container, 'PAGINATION', { slots: ['ellipsis'] });
  });

  it('UIC-PAGINATION-1.5 disables every button', () => {
    const { container } = render(<Pagination pageCount={3} defaultPage={2} isDisabled />);
    expect(container.firstElementChild).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expectHooksMatchSpec(container, 'PAGINATION');
  });

  it('UIC-PAGINATION-1.6 appends the class and forwards id and data attributes', () => {
    const { container } = render(
      <Pagination pageCount={2} className="caller" id="pages" data-testid="probe" />,
    );
    const nav = container.firstElementChild;
    expect(nav).toHaveClass('ui-pagination', 'caller');
    expect(nav).toHaveAttribute('id', 'pages');
    expect(nav).toHaveAttribute('data-testid', 'probe');
    expectHooksMatchSpec(container, 'PAGINATION');
  });
});
