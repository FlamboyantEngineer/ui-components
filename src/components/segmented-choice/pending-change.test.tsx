import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { SegmentedChoice, type SegmentedChoiceOption } from './segmented-choice.js';

const filters: SegmentedChoiceOption[] = [
  { value: 'open', label: 'Open', count: 3 },
  { value: 'done', label: 'Done', count: 120 },
  { value: 'all', label: 'All', count: 0 },
];

beforeAll(() => {
  // React Aria's selection indicator waits for animations, which jsdom does not implement.
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

/** A promise and the functions that settle it. */
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const radio = (name: string) => screen.getByRole('radio', { name });

describe('SegmentedChoice counts', () => {
  it('UIC-SEGMENTED-CHOICE-1.9 shows positive counts, capped, and reads them in the name', () => {
    const { container, rerender } = render(
      <SegmentedChoice aria-label="Show" options={filters} defaultValue="open" />,
    );
    const open = radio('Open, 3');
    expect(open.querySelector('.ui-segmented-choice__count')).toHaveTextContent('3');
    expect(open.querySelector('.ui-segmented-choice__count')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(radio('Done, 99+')).toHaveTextContent('Done99+');
    expect(radio('All').querySelector('.ui-segmented-choice__count')).toBeNull();
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE', { slots: ['segment', 'label', 'count'] });

    rerender(
      <SegmentedChoice
        aria-label="Show"
        options={[
          { value: 'open', label: 'Open', count: 2.7, icon: 'filter' },
          { value: 'done', label: 'Done', count: Number.NaN },
          { value: 'all', label: 'All', count: 12 },
        ]}
        countMax={9}
        iconOnly
      />,
    );
    expect(radio('Open, 2')).toBeInTheDocument();
    expect(radio('Done')).toBeInTheDocument();
    expect(radio('All, 9+')).toBeInTheDocument();
  });
});

describe('SegmentedChoice asynchronous change', () => {
  it('UIC-SEGMENTED-CHOICE-2.6 holds an uncontrolled pick pending until its promise fulfils', async () => {
    const user = userEvent.setup();
    const change = deferred();
    const onChange = vi.fn(() => change.promise);
    const { container } = render(
      <SegmentedChoice
        aria-label="Show"
        options={filters}
        defaultValue="open"
        onChange={onChange}
      />,
    );
    const group = screen.getByRole('radiogroup', { name: 'Show' });
    await user.click(radio('Done, 99+'));
    expect(onChange).toHaveBeenCalledWith('done');
    expect(radio('Done, 99+')).toHaveAttribute('aria-checked', 'true');
    expect(group).toHaveAttribute('data-pending', 'true');
    expect(group).toHaveAttribute('aria-busy', 'true');
    expectHooksMatchSpec(container, 'SEGMENTED-CHOICE');

    // Picks wait while a change is pending.
    await user.click(radio('All'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(radio('All')).toHaveAttribute('aria-checked', 'false');

    await act(async () => change.resolve());
    expect(group).not.toHaveAttribute('data-pending');
    expect(group).not.toHaveAttribute('aria-busy');
    expect(radio('Done, 99+')).toHaveAttribute('aria-checked', 'true');
  });

  it('UIC-SEGMENTED-CHOICE-2.6 puts the value back when the promise rejects', async () => {
    const user = userEvent.setup();
    const change = deferred();
    render(
      <SegmentedChoice
        aria-label="Show"
        options={filters}
        defaultValue="open"
        onChange={() => change.promise}
      />,
    );
    await user.click(radio('All'));
    expect(radio('All')).toHaveAttribute('aria-checked', 'true');
    await act(async () => change.reject(new Error('Offline')));
    expect(radio('All')).toHaveAttribute('aria-checked', 'false');
    expect(radio('Open, 3')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('data-pending');
  });

  it('UIC-SEGMENTED-CHOICE-2.6 shows a controlled pick until the caller settles it', async () => {
    const user = userEvent.setup();
    const pending: Array<ReturnType<typeof deferred>> = [];
    function Saved() {
      const [value, setValue] = useState<string | null>('open');
      return (
        <SegmentedChoice
          aria-label="Show"
          options={filters}
          value={value}
          onChange={async (next) => {
            const change = deferred();
            pending.push(change);
            await change.promise;
            setValue(next);
          }}
        />
      );
    }
    render(<Saved />);
    await user.click(radio('Done, 99+'));
    expect(radio('Done, 99+')).toHaveAttribute('aria-checked', 'true');
    await act(async () => pending[0]?.resolve());
    expect(radio('Done, 99+')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('data-pending');

    await user.click(radio('All'));
    await act(async () => pending[1]?.reject(new Error('Offline')));
    expect(radio('Done, 99+')).toHaveAttribute('aria-checked', 'true');
  });

  it('UIC-SEGMENTED-CHOICE-2.6 applies a change at once when onChange returns no promise', async () => {
    const user = userEvent.setup();
    render(
      <SegmentedChoice
        aria-label="Style"
        selectionMode="multiple"
        options={filters}
        defaultValue={['open']}
        onChange={() => undefined}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('toolbar')).not.toHaveAttribute('data-pending');
  });
});
