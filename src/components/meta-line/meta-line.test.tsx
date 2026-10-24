import { createElement, Fragment, useState } from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { MetaLine, formatMetaLine, type MetaLineTextItem } from './meta-line.js';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      Count {count}
    </button>
  );
}

describe('MetaLine', () => {
  it('UIC-META-LINE-1.1 skips empty entries, keeps zero and renders nothing when empty', () => {
    const empty = [
      null,
      undefined,
      false,
      true,
      '',
      ' \t ',
      [],
      createElement(Fragment, null, false, ''),
    ];
    const { container, rerender } = render(<MetaLine items={empty} />);
    expect(container).toBeEmptyDOMElement();

    const lists: MetaLineTextItem[][] = [
      ['Apple'],
      [null, 'Apple', '', false, 'Pear', undefined],
      ['', 0, ' ', 'Plum'],
    ];
    for (const items of lists) {
      rerender(<MetaLine items={items} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveTextContent(formatMetaLine(items));
      const kept = items.filter(
        (item) => typeof item === 'number' || (typeof item === 'string' && item.trim() !== ''),
      );
      expect(root.querySelectorAll('.ui-meta-line__separator')).toHaveLength(kept.length - 1);
    }
    expect(container).toHaveTextContent('0 · Plum');
  });

  it('UIC-META-LINE-1.1 keeps an array or fragment entry as one entry', () => {
    const { container } = render(
      <MetaLine
        items={[
          ['Red', ' ', 'apple'],
          <Fragment key="f">
            <b>3</b> kg
          </Fragment>,
        ]}
      />,
    );
    expect(container).toHaveTextContent('Red apple · 3 kg');
    expect(container.querySelectorAll('.ui-meta-line__separator')).toHaveLength(1);
  });

  it('UIC-META-LINE-1.2 draws a spaced middot hidden from assistive technology', () => {
    const { container } = render(<MetaLine items={['Lisbon', 'Porto', 'Faro']} />);
    const separators = [...container.querySelectorAll('.ui-meta-line__separator')];
    expect(separators).toHaveLength(2);
    for (const separator of separators) {
      expect(separator).toHaveAttribute('aria-hidden', 'true');
      expect(separator).toHaveTextContent('·');
      expect(separator.previousSibling?.textContent?.endsWith(' ')).toBe(true);
      expect(separator.nextSibling?.textContent?.startsWith(' ')).toBe(true);
    }
    expectHooksMatchSpec(container, 'META-LINE', { slots: 'all' });
  });

  it('UIC-META-LINE-1.3 keeps node markup and state when surrounding entries change', async () => {
    const user = userEvent.setup();
    const control = <Counter key="control" />;
    const time = (
      <time key="time" dateTime="2026-10-08" title="October 8, 2026">
        Today
      </time>
    );
    const { container, rerender } = render(<MetaLine items={[null, control, '', time]} />);
    const button = screen.getByRole('button');
    await user.click(button);
    rerender(<MetaLine items={['Leading', control, false, time, null]} />);
    expect(screen.getByRole('button')).toBe(button);
    expect(button).toHaveTextContent('Count 1');
    expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-10-08');
    expect(container.querySelector('time')).toHaveAttribute('title', 'October 8, 2026');
    expect(container).toHaveTextContent('Leading · Count 1 · Today');
    expect(container.querySelector('[role], [aria-live]')).toBeNull();
  });

  it('UIC-META-LINE-1.3 keeps the state of an unkeyed entry when an earlier entry empties', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MetaLine items={['Open', <Counter />]} />);
    await user.click(screen.getByRole('button'));
    rerender(<MetaLine items={[null, <Counter />]} />);
    expect(screen.getByRole('button')).toHaveTextContent('Count 1');
  });

  it('UIC-META-LINE-1.3 keeps explicit numeric keys apart from positions', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const control = (
      <button key="1" type="button">
        Action
      </button>
    );
    const { container, rerender } = render(<MetaLine items={[control, 'Pear']} />);
    const button = screen.getByRole('button');
    rerender(<MetaLine items={['Leading', control, 'Pear']} />);
    expect(screen.getByRole('button')).toBe(button);
    expect(container).toHaveTextContent('Leading · Action · Pear');
    expect(errors).not.toHaveBeenCalled();
  });

  it('UIC-META-LINE-1.4 joins text with the same filtering and leaves its input unchanged', () => {
    const frozen = Object.freeze(['Apple', null, 'Pear']);
    expect(formatMetaLine(frozen)).toBe('Apple · Pear');
    expect(frozen).toEqual(['Apple', null, 'Pear']);
    expect(formatMetaLine([0, '', ' ', true, false, undefined, 'kg'])).toBe('0 · kg');
    expect(formatMetaLine([])).toBe('');
  });

  it('UIC-META-LINE-1.5 forwards caller hooks and renders text as text', () => {
    const { container } = render(
      <MetaLine items={['Safe <text>', 'Pear']} id="meta" className="caller" data-testid="probe" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('SPAN');
    expect(root).toHaveClass('ui-meta-line', 'caller');
    expect(root).toHaveAttribute('id', 'meta');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root.querySelector('text')).toBeNull();
    expect(root).toHaveTextContent('Safe <text> · Pear');
    expectHooksMatchSpec(container, 'META-LINE');
  });
});
