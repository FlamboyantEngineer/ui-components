import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { withStableOccurrenceKeys } from './stable-keys.js';

describe('withStableOccurrenceKeys', () => {
  it('UIC-STABLE-KEYS-1.1 keys values by identity and occurrence without changing the input', () => {
    const fruit = Object.freeze(['apple', 'pear', 'apple', 'plum', 'apple']);
    expect(withStableOccurrenceKeys(fruit, (value) => value)).toEqual([
      { key: 'apple:0', value: 'apple' },
      { key: 'pear:0', value: 'pear' },
      { key: 'apple:1', value: 'apple' },
      { key: 'plum:0', value: 'plum' },
      { key: 'apple:2', value: 'apple' },
    ]);
    expect(fruit).toEqual(['apple', 'pear', 'apple', 'plum', 'apple']);
    const people = [{ name: 'Ada' }, { name: 'Grace' }];
    const keyed = withStableOccurrenceKeys(people, (person) => person.name);
    expect(keyed.map((entry) => entry.key)).toEqual(['Ada:0', 'Grace:0']);
    expect(keyed[0]?.value).toBe(people[0]);
    expect(withStableOccurrenceKeys([], String)).toEqual([]);
  });

  it('UIC-STABLE-KEYS-1.2 keeps entry state when other entries are inserted or removed', async () => {
    const user = userEvent.setup();
    function Entry({ label }: { label: string }) {
      const [ticks, setTicks] = useState(0);
      return (
        <button type="button" onClick={() => setTicks((value) => value + 1)}>
          {label} {ticks}
        </button>
      );
    }
    function List({ values }: { values: string[] }) {
      return (
        <>
          {withStableOccurrenceKeys(values, (value) => value).map(({ key, value }) => (
            <Entry key={key} label={value} />
          ))}
        </>
      );
    }
    const { rerender } = render(<List values={['pear', 'plum']} />);
    await user.click(screen.getByRole('button', { name: 'plum 0' }));
    rerender(<List values={['apple', 'pear', 'plum']} />);
    expect(screen.getByRole('button', { name: 'plum 1' })).toBeInTheDocument();
    rerender(<List values={['plum']} />);
    expect(screen.getByRole('button', { name: 'plum 1' })).toBeInTheDocument();
  });
});
