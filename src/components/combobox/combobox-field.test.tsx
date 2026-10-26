import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Combobox, type ComboboxItem } from './combobox.js';
import { findCompletion, findFirstOptionKey, flattenOptions } from './combobox-options.js';

const fruit: ComboboxItem[] = [
  { id: 'grape', label: 'Grape' },
  { id: 'apricot', label: 'Apricot', isDisabled: true },
  { id: 'apple', label: 'Apple' },
  { id: 'papaya', label: 'Papaya' },
  { id: 'citrus', title: 'Citrus', options: [{ id: 'lemon', label: 'Lemon' }] },
];

function input() {
  return screen.getByRole<HTMLInputElement>('combobox');
}

function highlighted() {
  const id = input().getAttribute('aria-activedescendant');
  return id ? document.getElementById(id)?.textContent : null;
}

describe('Combobox entry', () => {
  it('UIC-COMBOBOX-3.3 keeps the first enabled match highlighted so Enter picks it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox aria-label="Fruit" defaultItems={fruit} autoHighlight onChange={onChange} />);
    await user.type(input(), 'ap');
    await screen.findByRole('listbox');
    expect(highlighted()).toBe('Grape');
    await user.type(input(), 'r');
    // Apricot is disabled, so nothing matches "apr" but it; nothing is highlighted.
    expect(highlighted()).toBeNull();
    await user.type(input(), '{Backspace}p');
    expect(highlighted()).toBe('Apple');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('apple');
    expect(input()).toHaveValue('Apple');
  });

  it('UIC-COMBOBOX-3.3 highlights nothing on its own without autoHighlight', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" defaultItems={fruit} />);
    await user.type(input(), 'ap');
    await screen.findByRole('listbox');
    expect(highlighted()).toBeNull();
  });

  it('UIC-COMBOBOX-3.4 completes typed text inline and selects the added part', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Combobox aria-label="Fruit" defaultItems={fruit} completesInline onChange={onChange} />,
    );
    expect(input()).toHaveAttribute('aria-autocomplete', 'both');
    await user.type(input(), 'ap');
    await screen.findByRole('listbox');
    expect(input()).toHaveValue('apple');
    expect(input().selectionStart).toBe(2);
    expect(input().selectionEnd).toBe(5);
    expect(highlighted()).toBe('Apple');
    // The list stays filtered by what was typed, not by the completion.
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Grape',
      'Apricot',
      'Apple',
      'Papaya',
    ]);
    await user.keyboard('{Backspace}');
    expect(input()).toHaveValue('ap');
    await user.keyboard('p');
    expect(input()).toHaveValue('apple');
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('apple');
    expect(input()).toHaveValue('Apple');
  });

  it('UIC-COMBOBOX-3.4 finds completions and first options from the suggestions', () => {
    const options = flattenOptions(fruit);
    expect(findCompletion(options, 'Le')).toEqual({ typed: 'Le', text: 'Lemon', key: 'lemon' });
    expect(findCompletion(options, 'apr')).toBeNull();
    expect(findCompletion(options, 'apple')).toBeNull();
    expect(findCompletion(options, '')).toBeNull();
    const collection = {
      *[Symbol.iterator]() {
        yield { key: 'citrus', type: 'section' };
        yield { key: 'grape', type: 'item' };
      },
      getChildren: () => [
        { key: 'header', type: 'header' },
        { key: 'lemon', type: 'item' },
      ],
    };
    expect(findFirstOptionKey(collection, () => false)).toBe('lemon');
    expect(findFirstOptionKey(collection, (key) => key === 'lemon')).toBe('grape');
    expect(findFirstOptionKey(collection, () => true)).toBeNull();
  });
});
