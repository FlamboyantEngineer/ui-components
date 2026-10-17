import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import type { Key } from 'react-aria-components';
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

  it('UIC-COMBOBOX-3.2 adds an action row for typed text no option has as label', async () => {
    const user = userEvent.setup();
    const onCreateOption = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <Combobox
        aria-label="Fruit"
        defaultItems={fruit}
        onCreateOption={onCreateOption}
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.type(input(), 'Kiwi');
    const create = screen.getByRole('option', { name: 'Add “Kiwi”' });
    expect(create).toHaveClass('ui-combobox__create');
    expect(screen.getByRole('listbox')).not.toHaveAttribute('data-empty');
    expectHooksMatchSpec(document.body, 'COMBOBOX', { slots: ['create'] });
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onCreateOption).toHaveBeenCalledWith('Kiwi');
    expect(onSelectionChange).not.toHaveBeenCalledWith(expect.stringContaining('Kiwi'));

    await user.clear(input());
    await user.type(input(), 'lemon ');
    expect(screen.queryByRole('option', { name: /^Add/ })).toBeNull();
    await user.clear(input());
    await user.type(input(), 'Lem');
    await user.click(screen.getByRole('option', { name: 'Add “Lem”' }));
    expect(onCreateOption).toHaveBeenLastCalledWith('Lem');
  });

  it('UIC-COMBOBOX-3.2 shows the created option once the caller adds and selects it', async () => {
    const user = userEvent.setup();
    function Destinations() {
      const [options, setOptions] = useState<ComboboxOption[]>([{ id: 'paris', label: 'Paris' }]);
      const [chosen, setChosen] = useState<Key | null>(null);
      return (
        <>
          <Combobox
            aria-label="Destination"
            items={options}
            selectedKey={chosen}
            onSelectionChange={setChosen}
            onCreateOption={(text) => {
              setOptions((current) => [...current, { id: text.toLowerCase(), label: text }]);
              setChosen(text.toLowerCase());
            }}
          />
          <output>{String(chosen)}</output>
        </>
      );
    }
    render(<Destinations />);
    await user.type(input(), 'Kyoto');
    await user.keyboard('{ArrowUp}{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('kyoto');
    expect(input()).toHaveValue('Kyoto');
    expect(input()).toHaveFocus();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('UIC-COMBOBOX-4.1 renders a long list virtualized and reaches its end by keyboard', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(160);
    // jsdom lays nothing out; rows measure as 32 pixels high, as the reference sheet draws them.
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(32);
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(200);
    const user = userEvent.setup();
    const many: ComboboxOption[] = Array.from({ length: 300 }, (_, index) => ({
      id: index,
      label: `City ${index}`,
    }));
    render(<Combobox aria-label="City" defaultItems={many} virtualized />);
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    const options = screen.getAllByRole('option');
    expect(options.length).toBeLessThan(40);
    expect(options[0]).toHaveAttribute('aria-setsize', '300');
    expect(options[0]).toHaveClass('ui-combobox__option');
    expect(options[0]?.parentElement?.style.position).toBe('absolute');
    await user.keyboard('{Escape}');
    // Arrow Up opens the list on its last option.
    await user.keyboard('{ArrowUp}');
    expect(input()).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'City 299' }).id,
    );
  });

  it('UIC-COMBOBOX-4.2 ends the list with a loading row that asks for more in view', async () => {
    const observed: Element[] = [];
    let report: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          report = callback;
        }
        observe(element: Element) {
          observed.push(element);
        }
        unobserve() {}
        disconnect() {}
      },
    );
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    function Paged({ isLoading, items }: { isLoading: boolean; items: ComboboxOption[] }) {
      return (
        <Combobox aria-label="City" items={items} onLoadMore={onLoadMore} isLoading={isLoading} />
      );
    }
    const page = [{ id: 'oslo', label: 'Oslo' }];
    const { rerender } = render(<Paged isLoading={false} items={page} />);
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    act(() => report([{ isIntersecting: true, target: observed.at(-1) } as never], {} as never));
    expect(onLoadMore).toHaveBeenCalled();
    rerender(<Paged isLoading items={page} />);
    const row = document.querySelector('.ui-combobox__load-more');
    expect(row).toHaveTextContent('Loading');
    expectHooksMatchSpec(document.body, 'COMBOBOX', { slots: ['load-more'] });
    rerender(<Paged isLoading items={[]} />);
    expect(document.querySelector('.ui-combobox__empty')).toBeNull();
    expect(screen.getByRole('listbox')).toHaveTextContent(/^Loading$/);
    vi.unstubAllGlobals();
  });

  it('UIC-COMBOBOX-4.3 marks the typed text in option labels', async () => {
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" defaultItems={fruit} highlightMatches />);
    await user.type(input(), 'an');
    const marks = [...document.querySelectorAll('.ui-combobox__option-label mark.ui-text-match')];
    // Adjacent matches share one mark.
    expect(marks.map((mark) => mark.textContent)).toEqual(['anan', 'an']);
    expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
  });

  it('UIC-COMBOBOX-4.4 draws custom option content from the option and its state', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        aria-label="Fruit"
        defaultItems={fruit}
        renderOption={(option, state) => (
          <span data-testid={`row-${option.id}`}>
            {option.label}
            {state.isFocused ? ' (focused)' : ''}
          </span>
        )}
      />,
    );
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    expect(screen.getByTestId('row-apple')).toHaveTextContent('Apple (focused)');
    expect(screen.getByRole('option', { name: 'Apple (focused)' })).toHaveClass(
      'ui-combobox__option',
    );
    expect(document.querySelector('.ui-combobox__option-label')).toBeNull();
    await user.keyboard('{Enter}');
    expect(input()).toHaveValue('Apple');
  });
});
