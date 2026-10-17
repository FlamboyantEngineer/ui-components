import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { PortalContainerProvider } from '../portal/portal.js';
import { Combobox, type ComboboxItem, type ComboboxOption } from './combobox.js';

const fruit: ComboboxItem[] = [
  { id: 'apple', label: 'Apple', description: 'Crisp', icon: 'plus' },
  { id: 'banana', label: 'Banana' },
  {
    id: 'citrus',
    title: 'Citrus',
    options: [
      { id: 'lemon', label: 'Lemon' },
      { id: 'lime', label: 'Lime', isDisabled: true },
      { id: 'orange', label: 'Orange' },
    ],
  },
];

function input() {
  return screen.getByRole('combobox');
}

describe('Combobox suggestions', () => {
  it('UIC-COMBOBOX-2.1 draws options with icon, label and description, grouped in sections', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" defaultItems={fruit} />);
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    const listbox = screen.getByRole('listbox');
    const apple = within(listbox).getByRole('option', { name: 'Apple Crisp' });
    expect(apple).not.toHaveAttribute('aria-labelledby');
    expect([...apple.children].map((child) => child.getAttribute('class'))).toEqual([
      'ui-icon ui-combobox__option-icon',
      'ui-combobox__option-label',
      'ui-combobox__option-description',
    ]);
    const citrus = within(listbox).getByRole('group', { name: 'Citrus' });
    expect(citrus).toHaveClass('ui-combobox__section');
    expect(citrus.querySelector('.ui-combobox__section-header')).toHaveTextContent('Citrus');
    expect(within(citrus).getByRole('option', { name: 'Lime' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expectHooksMatchSpec(document.body, 'COMBOBOX', {
      slots: [
        'popover',
        'listbox',
        'section',
        'section-header',
        'option',
        'option-icon',
        'option-label',
        'option-description',
      ],
    });
  });

  it('UIC-COMBOBOX-2.2 filters its own suggestions, ignoring case, and leaves given items alone', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Combobox aria-label="Fruit" defaultItems={fruit} />);
    await user.click(input());
    await user.keyboard('AN');
    const names = () =>
      screen
        .getAllByRole('option')
        .map((option) => option.querySelector('.ui-combobox__option-label')?.textContent);
    expect(names()).toEqual(['Banana', 'Orange']);
    await user.clear(input());
    await user.keyboard('le');
    expect(names()).toEqual(['Apple', 'Lemon']);
    expect(screen.getByRole('group', { name: 'Citrus' })).toBeInTheDocument();
    await user.keyboard('m');
    expect(names()).toEqual(['Lemon']);
    unmount();

    let respond = () => {};
    function Remote() {
      const [query, setQuery] = useState('');
      const [items, setItems] = useState<ComboboxOption[]>([]);
      const [pending, setPending] = useState(false);
      return (
        <Combobox
          aria-label="City"
          items={items}
          inputValue={query}
          isPending={pending}
          onInputChange={(value) => {
            setQuery(value);
            setPending(true);
            respond = () => {
              setItems([
                { id: 'oslo', label: 'Oslo' },
                { id: 'lima', label: 'Lima' },
              ]);
              setPending(false);
            };
          }}
        />
      );
    }
    render(<Remote />);
    await user.click(input());
    await user.keyboard('z');
    expect(input()).toHaveAttribute('aria-busy', 'true');
    act(() => respond());
    await waitFor(() => expect(names()).toEqual(['Oslo', 'Lima']));
    expect(input()).not.toHaveAttribute('aria-busy');
  });

  it('UIC-COMBOBOX-2.4 highlights options by keyboard, skips disabled ones and picks with Enter', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Combobox aria-label="Fruit" defaultItems={fruit} onSelectionChange={onSelectionChange} />,
    );
    await user.click(input());
    await user.keyboard('l');
    // Apple, then Lemon and the disabled Lime under Citrus.
    await user.keyboard('{ArrowDown}');
    const apple = screen.getByRole('option', { name: /^Apple/ });
    expect(input()).toHaveAttribute('aria-activedescendant', apple.id);
    expect(apple).toHaveAttribute('data-focused', 'true');
    await user.keyboard('{ArrowDown}');
    const lemon = screen.getByRole('option', { name: 'Lemon' });
    expect(input()).toHaveAttribute('aria-activedescendant', lemon.id);
    await user.keyboard('{ArrowDown}');
    expect(input()).toHaveAttribute('aria-activedescendant', lemon.id);
    await user.keyboard('{ArrowUp}');
    expect(input()).toHaveAttribute('aria-activedescendant', apple.id);
    await user.keyboard('{ArrowDown}');
    expect(input()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(input()).toHaveValue('Lemon');
    expect(onSelectionChange).toHaveBeenLastCalledWith('lemon');
    expect(screen.queryByRole('listbox')).toBeNull();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Lime' }));
    expect(input()).toHaveValue('Lemon');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input()).toHaveValue('Lemon');
  });

  it('UIC-COMBOBOX-2.6 opens an empty list with the empty state', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Combobox aria-label="Fruit" defaultItems={fruit} />);
    await user.click(input());
    await user.keyboard('zz');
    expect(screen.getByRole('listbox')).toHaveAttribute('data-empty', 'true');
    expect(document.querySelector('.ui-combobox__empty')).toHaveTextContent('No results');
    expectHooksMatchSpec(document.body, 'COMBOBOX', { slots: ['empty'] });
    rerender(
      <UiProvider strings={{ noResults: 'Nothing grows here' }}>
        <Combobox aria-label="Fruit" defaultItems={fruit} />
      </UiProvider>,
    );
    await user.click(input());
    await user.keyboard('{Control>}a{/Control}zz');
    expect(document.querySelector('.ui-combobox__empty')).toHaveTextContent('Nothing grows here');
  });

  it('UIC-COMBOBOX-2.7 stacks the popover on the dropdown layer', async () => {
    const user = userEvent.setup();
    render(
      <PortalContainerProvider layerZIndex={{ dropdown: 777 }}>
        <Combobox aria-label="Fruit" defaultItems={fruit} />
      </PortalContainerProvider>,
    );
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    const popover = document.querySelector<HTMLElement>('.ui-combobox__popover');
    expect(popover).toHaveAttribute('data-layer', 'dropdown');
    expect(popover?.style.zIndex).toBe('777');
    expect(popover).toHaveAttribute('data-trigger', 'ComboBox');
    expect(popover).toContainElement(screen.getByRole('listbox'));
    expect(screen.getByRole('listbox')).toHaveClass('ui-combobox__listbox');
  });
});
