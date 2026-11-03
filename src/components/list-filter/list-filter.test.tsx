import { createRef } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { CheckGlyph } from '../../core/glyphs.js';
import { ListFilter, type ListFilterOption } from './list-filter.js';

type Filter = 'unread' | 'all' | 'mentions';
const options: readonly ListFilterOption<Filter>[] = [
  { value: 'unread', label: 'Unread', count: 7 },
  { value: 'all', label: 'All', count: 128, countMax: 9 },
  { value: 'mentions', label: 'Mentions', count: 0 },
];

function deferred() {
  const controls = { resolve: () => {}, reject: (_error: Error) => {} };
  const promise = new Promise<void>((resolve, reject) => {
    controls.resolve = resolve;
    controls.reject = reject;
  });
  return { promise, ...controls };
}

describe('ListFilter', () => {
  it('UIC-LIST-FILTER-1.1 UIC-LIST-FILTER-1.2 forwards hooks and shows typed ordered options with shared quiet counts', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: Filter, signal: AbortSignal) => void>();
    const ref = createRef<HTMLDivElement>();
    const { container, rerender } = render(
      <ListFilter
        ref={ref}
        id="filters"
        className="caller"
        data-example="filters"
        aria-label="Show"
        options={options}
        value="unread"
        onChange={onChange}
      />,
    );
    expect(ref.current).toHaveAttribute('id', 'filters');
    expect(ref.current).toHaveClass('caller');
    expect(ref.current).toHaveAttribute('data-example', 'filters');
    expectHooksMatchSpec(container, 'LIST-FILTER', {
      slots: ['row', 'filters'],
      callerAttributes: ['data-example'],
    });
    expect(
      screen
        .getAllByRole('radio')
        .map((item) => item.querySelector('.ui-segmented-choice__label')?.textContent),
    ).toEqual(['Unread', 'All', 'Mentions']);
    expect(screen.getByRole('radio', { name: 'All, 128' })).toHaveTextContent('9+');
    expect(screen.getByRole('radio', { name: 'Mentions, 0' })).toBeInTheDocument();
    for (const badge of container.querySelectorAll('.ui-badge')) {
      expect(badge).toHaveAttribute('data-variant', 'subtle');
      expect(badge).toHaveAttribute('data-count', 'true');
    }
    await user.click(screen.getByRole('radio', { name: 'All, 128' }));
    expect(onChange).toHaveBeenCalledWith('all', expect.any(AbortSignal));
    rerender(
      <ListFilter aria-label="Show" options={options} value="all" showZero={false} isDisabled />,
    );
    expect(screen.getByRole('radio', { name: 'All, 128' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Mentions' })).toBeDisabled();
  });

  it('UIC-LIST-FILTER-1.3 keeps action presses and menus independent of filter keyboard selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onPress = vi.fn();
    render(
      <ListFilter
        aria-label="Show"
        options={options}
        value="unread"
        onChange={onChange}
        actions={[
          { verb: 'custom', id: 'read', label: 'Mark all read', icon: CheckGlyph, onPress },
          { verb: 'more', items: [{ id: 'export', label: 'Export' }] },
        ]}
      />,
    );
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Unread, 7' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(onChange).toHaveBeenCalledWith('all', expect.any(AbortSignal));
    await user.tab();
    expect(screen.getByRole('button', { name: 'Mark all read' })).toHaveFocus();
    onChange.mockClear();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'More' }));
    expect(await screen.findByRole('menuitem', { name: 'Export' })).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('UIC-LIST-FILTER-1.4 previews a pending pick and reports rejection without losing the latest controlled value', async () => {
    const user = userEvent.setup();
    const change = deferred();
    const onChange = vi.fn(() => change.promise);
    const onError = vi.fn();
    render(
      <ListFilter
        aria-label="Show"
        options={options}
        value="unread"
        onChange={onChange}
        onError={onError}
      />,
    );
    await user.click(screen.getByRole('radio', { name: 'All, 128' }));
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('radio', { name: 'All, 128' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Mentions, 0' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const error = new Error('Unavailable');
    await act(async () => change.reject(error));
    expect(screen.getByRole('radio', { name: 'Unread, 7' })).toBeChecked();
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('UIC-LIST-FILTER-1.4 aborts superseded and unmounted work and ignores stale rejection', async () => {
    const user = userEvent.setup();
    const change = deferred();
    const signals: AbortSignal[] = [];
    const onChange = (_value: Filter, signal: AbortSignal) => {
      signals.push(signal);
      return change.promise;
    };
    const onError = vi.fn();
    const { rerender, unmount } = render(
      <ListFilter
        aria-label="Show"
        options={options}
        value="unread"
        onChange={onChange}
        onError={onError}
      />,
    );
    await user.click(screen.getByRole('radio', { name: 'All, 128' }));
    rerender(
      <ListFilter
        aria-label="Show"
        options={options}
        value="mentions"
        onChange={onChange}
        onError={onError}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Mentions, 0' })).toBeChecked();
    expect(signals[0]?.aborted).toBe(true);
    await user.click(screen.getByRole('radio', { name: 'Unread, 7' }));
    unmount();
    expect(signals[1]?.aborted).toBe(true);
    await act(async () => change.reject(new Error('Stale')));
    expect(onError).not.toHaveBeenCalled();
  });

  it('UIC-LIST-FILTER-1.4 catches synchronous change failures and keeps action pending independent', async () => {
    const user = userEvent.setup();
    const action = deferred();
    const onError = vi.fn();
    render(
      <ListFilter
        aria-label="Show"
        options={options}
        value="unread"
        onChange={() => {
          throw new Error('Offline');
        }}
        onError={onError}
        actions={[
          {
            verb: 'custom',
            id: 'read',
            icon: CheckGlyph,
            label: 'Mark all read',
            onPress: () => action.promise,
          },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Mark all read' }));
    expect(screen.getByRole('button', { name: /Mark all read/ })).toHaveAttribute(
      'data-pending',
      'true',
    );
    await user.click(screen.getByRole('radio', { name: 'All, 128' }));
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(screen.getByRole('radio', { name: 'Unread, 7' })).toBeChecked();
    await act(async () => action.resolve());
  });
});

it('UIC-LIST-FILTER-1.4 a stale result cannot clear a newer pending change or overwrite the latest controlled value', async () => {
  const user = userEvent.setup();
  const first = deferred();
  const second = deferred();
  const onError = vi.fn();
  const onChange = (value: Filter) => (value === 'all' ? first.promise : second.promise);
  const { rerender } = render(
    <ListFilter
      aria-label="Show"
      options={options}
      value="unread"
      onChange={onChange}
      onError={onError}
    />,
  );
  await user.click(screen.getByRole('radio', { name: 'All, 128' }));
  rerender(
    <ListFilter
      aria-label="Show"
      options={options}
      value="mentions"
      onChange={onChange}
      onError={onError}
    />,
  );
  await user.click(screen.getByRole('radio', { name: 'Unread, 7' }));
  await act(async () => first.reject(new Error('Obsolete')));
  expect(screen.getByRole('radiogroup')).toHaveAttribute('data-pending', 'true');
  expect(screen.getByRole('radio', { name: 'Unread, 7' })).toBeChecked();
  expect(onError).not.toHaveBeenCalled();
  await act(async () => second.reject(new Error('Current')));
  expect(screen.getByRole('radio', { name: 'Mentions, 0' })).toBeChecked();
  expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Current' }));
});

it('UIC-LIST-FILTER-1.1 UIC-LIST-FILTER-1.2 UIC-LIST-FILTER-1.3 respects option disabling and caps while filters and actions retain independent availability', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const onPress = vi.fn();
  const choices: readonly ListFilterOption<Filter>[] = [
    { value: 'unread', label: 'Unread', count: 7, isDisabled: true },
    { value: 'all', label: 'All', count: 128 },
    { value: 'mentions', label: 'Mentions', count: -1 },
  ];
  const { rerender } = render(
    <ListFilter
      aria-label="Show"
      options={choices}
      value="all"
      countMax={100}
      onChange={onChange}
    />,
  );
  expect(screen.getByRole('radio', { name: 'All, 128' })).toHaveTextContent('100+');
  expect(screen.getByRole('radio', { name: 'Mentions' })).toHaveTextContent('Mentions');
  await user.click(screen.getByRole('radio', { name: 'Unread, 7' }));
  expect(onChange).not.toHaveBeenCalled();
  rerender(
    <ListFilter
      aria-label="Show"
      options={choices}
      value="all"
      isDisabled
      actions={[{ verb: 'refresh', onPress }]}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(onPress).toHaveBeenCalled();
});
