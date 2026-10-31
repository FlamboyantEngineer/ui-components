import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { assignOccurrenceKeys, toOccurrenceKey } from './stable-keys.js';

describe('assignOccurrenceKeys', () => {
  it('UIC-STABLE-KEYS-1.1 keys values by identity and occurrence without changing the input', () => {
    const fruit = Object.freeze(['apple', 'pear', 'apple', 'plum', 'apple']);
    expect(assignOccurrenceKeys(fruit, (value) => value)).toEqual([
      { key: 'apple:0', value: 'apple' },
      { key: 'pear:0', value: 'pear' },
      { key: 'apple:1', value: 'apple' },
      { key: 'plum:0', value: 'plum' },
      { key: 'apple:2', value: 'apple' },
    ]);
    expect(fruit).toEqual(['apple', 'pear', 'apple', 'plum', 'apple']);
    const people = [{ name: 'Ada' }, { name: 'Grace' }];
    const keyed = assignOccurrenceKeys(people, (person) => person.name);
    expect(keyed.map((entry) => entry.key)).toEqual(['Ada:0', 'Grace:0']);
    expect(keyed[0]?.value).toBe(people[0]);
    expect(assignOccurrenceKeys([], String)).toEqual([]);
  });

  it('UIC-STABLE-KEYS-1.1 names the key of a given occurrence as assignOccurrenceKeys does', () => {
    const keyed = assignOccurrenceKeys(['apple', 'apple'], (value) => value);
    expect(keyed.map((entry) => entry.key)).toEqual([
      toOccurrenceKey('apple', 0),
      toOccurrenceKey('apple', 1),
    ]);
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
          {assignOccurrenceKeys(values, (value) => value).map(({ key, value }) => (
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
