import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { createHooks } from '../../core/hooks.js';
import { ListBox } from '../../primitives/index.js';
import { loadRemotePage } from '../../utils/use-remote-search.js';
import {
  PickerOptionRow,
  flattenPickerItems,
  isPickerSection,
  usePickerEmptyContent,
  type PickerItem,
} from './field-picker.js';

const hooks = createHooks('combobox', [
  'option',
  'option-icon',
  'option-label',
  'option-description',
]);

const search = { isLoading: false, hasFailed: false, isTooShort: false, minSearchLength: 2 };

function Empty(props: Parameters<typeof usePickerEmptyContent>[0] & { fallback?: ReactNode }) {
  const { fallback, ...status } = props;
  const render = usePickerEmptyContent(status, fallback ? () => fallback : undefined);
  return <p>{render()}</p>;
}

describe('picker vocabulary', () => {
  it('UIC-FIELD-11.1 reads options and sections in display order', () => {
    const items: PickerItem[] = [
      { id: 'apple', label: 'Apple' },
      { id: 'citrus', label: 'Citrus', options: [{ id: 'lime', label: 'Lime' }] },
      { id: 'plain', options: [{ id: 'pear', label: 'Pear' }] },
    ];
    expect(items.map(isPickerSection)).toEqual([false, true, true]);
    expect(flattenPickerItems(items).map((option) => option.id)).toEqual(['apple', 'lime', 'pear']);
  });

  it('UIC-FIELD-11.1 draws an option row in the picker slots, or the caller content', () => {
    render(
      <ListBox aria-label="Fruit">
        <PickerOptionRow
          id="lime"
          option={{ id: 'lime', label: 'Lime', description: 'Sour' }}
          hooks={hooks}
        />
        <PickerOptionRow
          id="pear"
          option={{ id: 'pear', label: 'Pear', description: '' }}
          hooks={hooks}
          isDisabled
          renderLead={(state) => <span>{state.isDisabled ? 'blocked' : 'open'}</span>}
        />
        <PickerOptionRow
          id="fig"
          option={{ id: 'fig', label: 'Fig' }}
          hooks={hooks}
          renderOption={() => <strong>Custom fig</strong>}
        />
      </ListBox>,
    );
    const lime = screen.getByRole('option', { name: 'Lime Sour' });
    expect(lime).toHaveClass('ui-combobox__option');
    expect(lime.querySelector('.ui-combobox__option-description')).toHaveTextContent('Sour');
    const pear = screen.getByRole('option', { name: 'blockedPear' });
    expect(pear).toHaveAttribute('aria-disabled', 'true');
    expect(pear.querySelector('.ui-combobox__option-description')).toBeNull();
    expect(screen.getByRole('option', { name: 'Custom fig' })).toBeInTheDocument();
  });

  it('UIC-FIELD-11.1 tells the empty list the search status, else the caller or no results', () => {
    const { rerender } = render(<Empty {...search} isLoading />);
    expect(screen.getByText('Loading')).toBeInTheDocument();
    rerender(<Empty {...search} hasFailed />);
    expect(screen.getByText('Search is unavailable.')).toBeInTheDocument();
    rerender(<Empty {...search} isTooShort />);
    expect(screen.getByText('Type at least 2 characters to search.')).toBeInTheDocument();
    rerender(<Empty {...search} fallback="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    rerender(<Empty {...search} />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('UIC-FIELD-11.1 reads a remote loader as pages, asking a first page with the query alone', async () => {
    const calls: unknown[][] = [];
    const signal = new AbortController().signal;
    const list = async (...args: unknown[]) => {
      calls.push(args);
      return ['one'];
    };
    expect(await loadRemotePage(list, { query: 'o', signal })).toEqual({ items: ['one'] });
    expect(calls[0]).toHaveLength(2);
    const paged = async () => ({ items: ['two'], cursor: 'next' });
    expect(await loadRemotePage(paged, { query: 'o', signal, cursor: 'c' })).toEqual({
      items: ['two'],
      cursor: 'next',
    });
  });
});
