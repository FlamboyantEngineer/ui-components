import { FolderGlyph, PlusGlyph } from '../../core/glyphs.js';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { requireDefined } from '../../utils/require-defined.js';
import { Combobox, type ComboboxOption } from './combobox.js';

const cities: ComboboxOption[] = ['Paris', 'Lima', 'Oslo', 'Lisbon'].map((name) => ({
  id: name.toLowerCase(),
  label: name,
}));

describe('Combobox chips', () => {
  it.each(['xs', 'sm'] as const)(
    'UIC-COMBOBOX-1.2 UIC-COMBOBOX-3.1 picks several options and shows them as chips at %s',
    async (size) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <Combobox
          label="Cities"
          selectionMode="multiple"
          defaultItems={cities}
          onChange={onChange}
          size={size}
        />,
      );
      const combobox = screen.getByRole('combobox', { name: 'Cities' });
      await user.type(combobox, 'li');
      await user.click(await screen.findByRole('option', { name: 'Lima' }));
      expect(onChange).toHaveBeenLastCalledWith(['lima']);
      // The list stays open for more choices and the typed text clears.
      expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
      expect(combobox).toHaveValue('');
      expect(screen.getByRole('option', { name: 'Lima' })).toHaveAttribute('aria-selected', 'true');
      await user.click(screen.getByRole('option', { name: 'Oslo' }));
      expect(onChange).toHaveBeenLastCalledWith(['lima', 'oslo']);
      // React Aria hides everything but the input and the list while the list is open.
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      const chips = screen.getByRole('grid', { name: 'Cities selected values' });
      const group = chips.closest('.ui-combobox__chips');
      expect(group).toHaveClass('ui-tag-group');
      expect(group).toHaveAttribute('data-size', 'sm');
      expect(group?.parentElement).toHaveClass('ui-combobox__field');
      expect(
        within(chips)
          .getAllByRole('row')
          .map((row) => row.textContent),
      ).toEqual(['Lima', 'Oslo']);
      expectHooksMatchSpec(document.body, 'COMBOBOX', { slots: ['chips'] });
    },
  );

  it('UIC-COMBOBOX-3.1 names the chips after a label drawn as markup or named elsewhere', async () => {
    render(
      <>
        <h2 id="cities-heading">Cities</h2>
        <Combobox
          aria-labelledby="cities-heading"
          selectionMode="multiple"
          defaultItems={cities}
          defaultValue={['lima']}
        />
        <Combobox
          label={<span>Towns</span>}
          selectionMode="multiple"
          defaultItems={cities}
          defaultValue={['oslo']}
        />
      </>,
    );
    expect(await screen.findByRole('grid', { name: 'Cities selected values' })).toBeInTheDocument();
    expect(await screen.findByRole('grid', { name: 'Towns selected values' })).toBeInTheDocument();
  });

  it('UIC-COMBOBOX-1.4 UIC-COMBOBOX-3.1 clears the typed text of a multiple combobox and keeps its chips', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <Combobox
        label="Cities"
        selectionMode="multiple"
        defaultItems={cities}
        defaultValue={['lima']}
        onChange={onChange}
      />,
    );
    const combobox = screen.getByRole('combobox', { name: 'Cities' });
    await user.type(combobox, 'pa');
    // The open list hides the rest of the field from assistive technology, so find the hook.
    await user.click(requireDefined(container.querySelector<HTMLElement>('.ui-combobox__clear')));
    expect(combobox).toHaveValue('');
    expect(combobox).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    const chips = screen.getByRole('grid', { name: 'Cities selected values' });
    expect(within(chips).getByRole('row')).toHaveTextContent('Lima');
  });

  it('UIC-COMBOBOX-3.1 removes a chip by its button or by Backspace', async () => {
    const user = userEvent.setup();
    function Cities() {
      const [value, setValue] = useState<Key[]>(['paris', 'lima', 'oslo']);
      return (
        <Combobox
          aria-label="Cities"
          selectionMode="multiple"
          defaultItems={cities}
          value={value}
          onChange={setValue}
        />
      );
    }
    render(<Cities />);
    const chips = screen.getByRole('grid', { name: 'Cities selected values' });
    await user.click(within(chips).getAllByRole('button', { name: /^Remove/ })[1] as HTMLElement);
    expect(
      within(chips)
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual(['Paris', 'Oslo']);
    within(chips).getByRole('row', { name: 'Paris' }).focus();
    await user.keyboard('{Backspace}');
    expect(
      within(chips)
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual(['Oslo']);
  });

  it('UIC-COMBOBOX-3.1 keeps the label of a chosen option the caller filtered out', async () => {
    const user = userEvent.setup();
    function Remote() {
      const [items, setItems] = useState(cities);
      return (
        <Combobox
          aria-label="Cities"
          selectionMode="multiple"
          items={items}
          defaultValue={['ghost']}
          onInputChange={(text) =>
            setItems(cities.filter((city) => city.label.toLowerCase().includes(text.toLowerCase())))
          }
        />
      );
    }
    render(<Remote />);
    const chips = () => screen.getByRole('grid', { name: 'Cities selected values' });
    // A key no suggestion lists shows itself.
    expect(within(chips()).getByRole('row', { name: 'ghost' })).toBeInTheDocument();
    await user.type(screen.getByRole('combobox'), 'lis');
    await user.click(await screen.findByRole('option', { name: 'Lisbon' }));
    await user.type(screen.getByRole('combobox'), 'par');
    expect(screen.queryByRole('option', { name: 'Lisbon' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(
      within(chips())
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual(['ghost', 'Lisbon']);
  });

  it('UIC-COMBOBOX-3.1 offers no removal while read-only', () => {
    render(
      <Combobox
        aria-label="Cities"
        selectionMode="multiple"
        defaultItems={cities}
        defaultValue={['lima']}
        isReadOnly
      />,
    );
    const chips = screen.getByRole('grid', { name: 'Cities selected values' });
    expect(within(chips).queryByRole('button')).not.toBeInTheDocument();
  });

  it('UIC-COMBOBOX-3.5 draws each chip with its option icon', () => {
    const { container } = render(
      <Combobox
        aria-label="Cities"
        selectionMode="multiple"
        defaultItems={[
          { id: 'paris', label: 'Paris', icon: FolderGlyph },
          { id: 'lima', label: 'Lima', icon: <svg role="img" aria-label="Flag" /> },
          { id: 'oslo', label: 'Oslo' },
        ]}
        defaultValue={['paris', 'lima', 'oslo']}
      />,
    );
    const chips = screen.getByRole('grid', { name: 'Cities selected values' });
    const paris = within(chips).getByRole('row', { name: 'Paris' });
    expect(paris.querySelector('.ui-combobox__chip-icon')).toHaveAttribute('aria-hidden', 'true');
    expect(paris.querySelector('[data-glyph="folder"]')).not.toBeNull();
    const lima = within(chips).getByRole('row', { name: 'Lima' });
    expect(
      within(lima)
        .getByRole('img', { name: 'Flag', hidden: true })
        .closest('.ui-combobox__chip-icon'),
    ).not.toBeNull();
    const oslo = within(chips).getByRole('row', { name: 'Oslo' });
    expect(oslo.querySelector('.ui-combobox__chip-icon')).toBeNull();
    expectHooksMatchSpec(container, 'COMBOBOX', { slots: ['chips', 'chip-icon'] });
  });
  it('UIC-COMBOBOX-3.1 UIC-COMBOBOX-3.5 keeps the latest icon when suggestions change', () => {
    const option: ComboboxOption = { id: 'paris', label: 'Paris', icon: FolderGlyph };
    const { rerender } = render(
      <Combobox label="Cities" selectionMode="multiple" items={[option]} value={['paris']} />,
    );
    const chips = screen.getByRole('grid', { name: 'Cities selected values' });
    expect(chips.querySelector('[data-glyph="folder"]')).not.toBeNull();
    rerender(
      <Combobox
        label="Cities"
        selectionMode="multiple"
        items={[{ ...option, icon: PlusGlyph }]}
        value={['paris']}
      />,
    );
    expect(chips.querySelector('[data-glyph="plus"]')).not.toBeNull();
    rerender(<Combobox label="Cities" selectionMode="multiple" items={[]} value={['paris']} />);
    expect(within(chips).getByRole('row', { name: 'Paris' })).toBeInTheDocument();
    expect(chips.querySelector('[data-glyph="plus"]')).not.toBeNull();
    expect(chips.querySelector('[data-glyph="folder"]')).toBeNull();
  });
  it('UIC-COMBOBOX-3.1 releases remembered options when a selection is removed', () => {
    const { rerender } = render(
      <Combobox label="Cities" selectionMode="multiple" items={cities} value={['paris']} />,
    );
    rerender(<Combobox label="Cities" selectionMode="multiple" items={[]} value={[]} />);
    rerender(<Combobox label="Cities" selectionMode="multiple" items={[]} value={['paris']} />);
    const chips = screen.getByRole('grid', { name: 'Cities selected values' });
    expect(within(chips).getByRole('row', { name: 'paris' })).toBeInTheDocument();
  });
});
