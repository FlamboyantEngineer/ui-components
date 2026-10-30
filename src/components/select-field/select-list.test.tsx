import { PlusGlyph } from '../../core/glyphs.js';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { SelectField, type SelectFieldOption } from './select-field.js';

const fruit: SelectFieldOption[] = [
  { id: 'apple', label: 'Apple', description: 'Crisp', icon: PlusGlyph },
  { id: 'pear', label: 'Pear' },
  { id: 'plum', label: 'Plum', isDisabled: true },
  { id: 'fig', label: 'Fig' },
];

const orchard: SelectFieldOption[] = [
  'Apricot',
  'Banana',
  'Cherry',
  'Damson',
  'Elderberry',
  'Feijoa',
  'Guava',
  'Huckleberry',
  'Jujube',
  'Kiwi',
  'Lime',
  'Mango',
].map((label) => ({ id: label.toLowerCase(), label }));
orchard[3] = { ...orchard[3], description: 'A small plum' } as SelectFieldOption;

function trigger(name: RegExp | string = /Fruit$/) {
  return screen.getByRole('button', { name });
}

function optionNames() {
  return screen
    .getAllByRole('option')
    .map((option) => fromCollectionKey(option.getAttribute('data-key') ?? ''));
}

describe('SelectField list', () => {
  it('UIC-SELECT-FIELD-3.1 opens the options in a dropdown-layer popover and closes on Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <SelectField label="Fruit" options={fruit} defaultValue="pear" onOpenChange={onOpenChange} />,
    );
    await user.click(trigger('Pear Fruit'));
    const listbox = screen.getByRole('listbox');
    const popover = listbox.closest('.ui-select-field__popover') as HTMLElement;
    expect(popover).toHaveAttribute('data-layer', 'dropdown');
    expect(popover.style.zIndex).not.toBe('');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('option', { name: 'Pear' })).toHaveAttribute('data-focused', 'true');
    expectHooksMatchSpec(document.body, 'SELECT-FIELD', {
      slots: ['popover', 'listbox', 'option'],
    });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    act(() => trigger('Pear Fruit').focus());
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-3.1 follows a controlled open state', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <SelectField label="Fruit" options={fruit} isOpen={false} onOpenChange={onOpenChange} />,
    );
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    rerender(<SelectField label="Fruit" options={fruit} isOpen onOpenChange={onOpenChange} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-3.2 draws icon, label and description and refuses disabled options', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<SelectField label="Fruit" options={fruit} onCommit={onCommit} />);
    await user.click(trigger());
    const apple = screen.getByRole('option', { name: 'Apple Crisp' });
    expect(apple).not.toHaveAttribute('aria-labelledby');
    expect(apple.querySelector('.ui-select-field__option-icon')).toHaveClass('ui-icon');
    expect(apple.querySelector('.ui-select-field__option-label')).toHaveTextContent('Apple');
    expect(apple.querySelector('.ui-select-field__option-description')).toHaveTextContent('Crisp');
    const plum = screen.getByRole('option', { name: 'Plum' });
    expect(plum).toHaveAttribute('aria-disabled', 'true');
    await user.click(plum);
    expect(onCommit).not.toHaveBeenCalled();
    expectHooksMatchSpec(document.body, 'SELECT-FIELD', {
      slots: ['option-icon', 'option-label', 'option-description'],
    });
  });

  it('UIC-SELECT-FIELD-3.3 replaces a single choice, closes and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<SelectField label="Fruit" options={fruit} defaultValue="apple" />);
    await user.click(trigger('Apple Fruit'));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger('Pear Fruit')).toHaveFocus());
  });

  it('UIC-SELECT-FIELD-3.4 keeps a multiple list open and checks the chosen options', async () => {
    const user = userEvent.setup();
    render(
      <SelectField
        label="Fruit"
        selectionMode="multiple"
        options={fruit}
        defaultValue={['pear']}
      />,
    );
    await user.click(trigger());
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    const check = (name: string) =>
      within(listbox).getByRole('option', { name }).querySelector('.ui-select-field__option-check');
    expect(check('Pear')).toHaveAttribute('aria-hidden', 'true');
    expect(check('Pear')?.querySelector('[data-glyph="check"]')).not.toBeNull();
    expect(check('Fig')?.querySelector('[data-glyph="check"]')).toBeNull();
    await user.click(within(listbox).getByRole('option', { name: 'Fig' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Fig' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expectHooksMatchSpec(document.body, 'SELECT-FIELD', { slots: ['option-check'] });
  });

  it('UIC-SELECT-FIELD-3.5 filters a long list by label and description from a search field', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<SelectField label="Fruit" options={orchard} onCommit={onCommit} />);
    await user.click(trigger());
    const search = screen.getByRole('searchbox', { name: 'Search' });
    expect(search).toHaveClass('ui-select-field__search-input');
    expect(search.closest('.ui-select-field__search')).not.toBeNull();
    await waitFor(() => expect(search).toHaveFocus());
    await user.keyboard('AN');
    expect(optionNames()).toEqual(['banana', 'mango']);
    await user.clear(search);
    await user.keyboard('plum');
    expect(optionNames()).toEqual(['damson']);
    expectHooksMatchSpec(document.body, 'SELECT-FIELD', { slots: ['search', 'search-input'] });
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onCommit).toHaveBeenCalledWith('damson');
  });

  it('UIC-SELECT-FIELD-3.5 reopens with an empty filter and says when nothing matches', async () => {
    const user = userEvent.setup();
    render(<SelectField label="Fruit" options={orchard} defaultValue="damson" />);
    await user.click(trigger('Damson Fruit'));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    await user.keyboard('xyz');
    expect(screen.getByText('No results')).toHaveClass('ui-select-field__empty');
    expectHooksMatchSpec(document.body, 'SELECT-FIELD', { slots: ['empty'] });
    // Leave the filter as it opened, so its unmount does not trigger a late change event.
    await user.clear(screen.getByRole('searchbox'));
  });

  it('UIC-SELECT-FIELD-3.5 draws no filter for a short list unless asked', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SelectField label="Fruit" options={fruit} />);
    await user.click(trigger());
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    unmount();
    render(<SelectField label="Fruit" options={fruit} filterable />);
    await user.click(trigger());
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-3.5 draws no filter for a long list told not to filter', async () => {
    const user = userEvent.setup();
    render(<SelectField label="Fruit" options={orchard} filterable={false} />);
    await user.click(trigger());
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-3.6 opens the filter from a printable key without changing the value', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<SelectField label="Fruit" options={orchard} defaultValue="kiwi" onCommit={onCommit} />);
    act(() => trigger('Kiwi Fruit').focus());
    await user.keyboard('m');
    const search = screen.getByRole('searchbox');
    expect(search).toHaveValue('m');
    expect(optionNames()).toEqual(['damson', 'lime', 'mango']);
    await user.keyboard('a');
    expect(search).toHaveValue('ma');
    expect(onCommit).not.toHaveBeenCalled();
    await user.keyboard('{Escape}{Escape}');
    expect(trigger('Kiwi Fruit')).toBeInTheDocument();
  });

  it('UIC-SELECT-FIELD-3.6 opens on Space without seeding, and keeps type-to-select on short lists', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SelectField label="Fruit" options={orchard} />);
    act(() => trigger().focus());
    await user.keyboard(' ');
    expect(screen.getByRole('searchbox')).toHaveValue('');
    await user.keyboard('{Escape}');
    unmount();
    const onCommit = vi.fn();
    render(<SelectField label="Fruit" options={fruit} onCommit={onCommit} />);
    act(() => trigger().focus());
    await user.keyboard('f');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onCommit).toHaveBeenCalledWith('fig');
  });

  it('UIC-SELECT-FIELD-7.3 renders only the options in view of a virtualized list', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(160);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
    // jsdom lays nothing out; rows measure as 32 pixels high, as the reference sheet draws them.
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(32);
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(200);
    const user = userEvent.setup();
    const many: SelectFieldOption[] = Array.from({ length: 1000 }, (_, index) => ({
      id: `item-${index}`,
      label: `Item ${index}`,
    }));
    render(
      <SelectField
        label="Fruit"
        options={many}
        filterable={false}
        virtualized
        defaultValue="item-0"
      />,
    );
    await user.click(trigger('Item 0 Fruit'));
    const rendered = screen.getAllByRole('option');
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.length).toBeLessThan(50);
    expect(rendered[0]).toHaveAttribute('aria-setsize', '1000');
    expect(rendered[0]?.parentElement?.style.position).toBe('absolute');
    await user.keyboard('{End}');
    expect(screen.getByRole('option', { name: 'Item 999' })).toHaveFocus();
    expectHooksMatchSpec(document.body, 'SELECT-FIELD', { slots: ['listbox', 'option'] });
  });

  it('UIC-SELECT-FIELD-7.3 draws no unchanged option row again while the filter text changes', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(160);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(32);
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(200);
    const user = userEvent.setup();
    let reads = 0;
    // A row reads its option's disabled state each time it is drawn, mounted or not.
    const many = Array.from({ length: 500 }, (_, index) => {
      const option = { id: `item-${index}`, label: `Item ${index}` };
      return Object.defineProperty(option, 'isDisabled', {
        get: () => ((reads += 1), false),
        enumerable: true,
      }) as SelectFieldOption;
    });
    render(<SelectField label="Fruit" options={many} filterable virtualized />);
    await user.click(trigger(/Fruit$/));
    const search = await screen.findByRole('searchbox');
    expect(reads).toBeGreaterThanOrEqual(many.length);
    reads = 0;
    await user.type(search, 'Item 4');
    expect(screen.getAllByRole('option')[0]).toHaveAccessibleName('Item 4');
    expect(reads).toBeLessThan(many.length / 10);
  });
});
