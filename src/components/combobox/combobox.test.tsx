import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Combobox, type ComboboxItem } from './combobox.js';

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

describe('Combobox', () => {
  it('UIC-COMBOBOX-1.1 draws the label, field, input, button, description and error', () => {
    const { container, rerender } = render(
      <Combobox
        label="Fruit"
        description="Pick one or type your own"
        errorMessage="Choose a fruit"
        isInvalid
        defaultItems={fruit}
        variant="search"
      />,
    );
    expect(input()).toHaveAccessibleName('Fruit');
    expect(input()).toHaveClass('ui-combobox__input');
    expect(input().closest('.ui-combobox__field')).toHaveAttribute('role', 'group');
    expect(screen.getByRole('button', { name: /Show suggestions/ })).toHaveClass(
      'ui-combobox__button',
    );
    expect(input()).toHaveAccessibleDescription(expect.stringContaining('Choose a fruit'));
    expect(container.querySelector('.ui-combobox__description')).toHaveTextContent(
      'Pick one or type your own',
    );
    expect(container.querySelector('.ui-combobox__search-icon')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expectHooksMatchSpec(container, 'COMBOBOX', {
      slots: ['label', 'field', 'search-icon', 'input', 'button', 'description', 'error'],
    });
    rerender(<Combobox aria-label="Fruit" defaultItems={fruit} />);
    expect(input()).toHaveAccessibleName('Fruit');
    expect(container.querySelector('.ui-combobox__label')).toBeNull();
    expect(container.querySelector('.ui-combobox__search-icon')).toBeNull();
  });

  it('UIC-COMBOBOX-1.2 publishes the variant and size', () => {
    const { container, rerender } = render(<Combobox aria-label="Fruit" defaultItems={fruit} />);
    const root = container.querySelector('.ui-combobox');
    expect(root).toHaveAttribute('data-variant', 'default');
    expect(root).toHaveAttribute('data-size', 'md');
    for (const size of ['sm', 'md', 'lg'] as const) {
      rerender(<Combobox aria-label="Fruit" defaultItems={fruit} variant="search" size={size} />);
      expect(root).toHaveAttribute('data-size', size);
      expect(root).toHaveAttribute('data-variant', 'search');
      expectHooksMatchSpec(container, 'COMBOBOX');
    }
  });

  it('UIC-COMBOBOX-1.3 reflects disabled, read-only, invalid, required and pending states', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <Combobox aria-label="Fruit" defaultItems={fruit} defaultInputValue="Ap" isDisabled />,
    );
    const root = container.querySelector('.ui-combobox');
    expect(root).toHaveAttribute('data-disabled', 'true');
    expect(input()).toBeDisabled();
    expect(container.querySelector('.ui-combobox__clear')).toBeNull();

    rerender(
      <Combobox aria-label="Fruit" defaultItems={fruit} defaultInputValue="Ap" isReadOnly />,
    );
    expect(root).toHaveAttribute('data-readonly', 'true');
    expect(input()).toHaveAttribute('readonly');
    expect(container.querySelector('.ui-combobox__clear')).toBeNull();
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    rerender(<Combobox aria-label="Fruit" defaultItems={fruit} isInvalid isRequired isPending />);
    expect(root).toHaveAttribute('data-invalid', 'true');
    expect(root).toHaveAttribute('data-required', 'true');
    expect(root).toHaveAttribute('data-pending', 'true');
    expect(input()).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.ui-combobox__spinner')).toHaveAttribute('aria-hidden', 'true');
    expectHooksMatchSpec(container, 'COMBOBOX', { slots: ['spinner'] });
  });

  it('UIC-COMBOBOX-1.4 clears the text and selection and refocuses the input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <UiProvider strings={{ clear: 'Clear fruit' }}>
        <Combobox
          aria-label="Fruit"
          defaultItems={fruit}
          defaultValue="banana"
          onChange={onChange}
        />
      </UiProvider>,
    );
    expect(input()).toHaveValue('Banana');
    const clear = screen.getByRole('button', { name: 'Clear fruit' });
    expect(clear).toHaveClass('ui-icon-button', 'ui-combobox__clear');
    expect(clear).toHaveAttribute('data-variant', 'bare');
    expectHooksMatchSpec(container, 'COMBOBOX', { slots: ['clear'] });
    await user.click(clear);
    expect(input()).toHaveValue('');
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(input()).toHaveFocus();
    expect(container.querySelector('.ui-combobox__clear')).toBeNull();
  });

  it('UIC-COMBOBOX-2.3 opens as the user types, on focus or only on request', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Combobox aria-label="Fruit" defaultItems={fruit} />);
    await user.click(input());
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('b');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(input()).toHaveAttribute('aria-expanded', 'true');
    await user.tab();
    await user.tab();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    rerender(<Combobox aria-label="Fruit" defaultItems={fruit} menuTrigger="manual" />);
    await user.clear(input());
    await user.keyboard('b');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /Show suggestions/ }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    rerender(<Combobox aria-label="Fruit" defaultItems={fruit} menuTrigger="focus" />);
    await user.click(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.click(input());
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('UIC-COMBOBOX-2.5 keeps typed text only when custom values are allowed', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Combobox aria-label="Fruit" defaultItems={fruit} allowsCustomValue />,
    );
    await user.click(input());
    await user.keyboard('Quince');
    await user.click(document.body);
    expect(input()).toHaveValue('Quince');

    rerender(
      <Combobox key="strict" aria-label="Fruit" defaultItems={fruit} defaultValue="apple" />,
    );
    await user.click(input());
    await user.keyboard('{End}s');
    expect(input()).toHaveValue('Apples');
    await user.click(document.body);
    expect(input()).toHaveValue('Apple');
  });

  it('UIC-COMBOBOX-2.8 appends caller classes and forwards data attributes and the ref', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Combobox
        aria-label="Fruit"
        defaultItems={fruit}
        className="caller"
        data-testid="probe"
        data-size="xl"
        ref={ref}
        name="fruit"
      />,
    );
    const root = screen.getByTestId('probe');
    expect(root).toHaveClass('ui-combobox', 'caller');
    expect(root).toHaveAttribute('data-size', 'md');
    expect(ref.current).toBe(root);
    expect(container.querySelector('input[name="fruit"]')).not.toBeNull();
    act(() => input().focus());
    expectHooksMatchSpec(container, 'COMBOBOX');
  });

  it('UIC-COMBOBOX-5.5 draws the list header above the listbox and gives focus back after a press', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Combobox
        label="Fruit"
        defaultItems={fruit}
        listHeader={
          <button type="button" onClick={onPress}>
            Only citrus
          </button>
        }
      />,
    );
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    const header = document.querySelector('.ui-combobox__list-header');
    expect(header?.parentElement).toHaveClass('ui-combobox__popover');
    expect(
      header?.compareDocumentPosition(screen.getByRole('listbox')) ??
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expectHooksMatchSpec(document.body, 'COMBOBOX', { slots: ['list-header', 'listbox'] });
    await user.click(screen.getByRole('button', { name: 'Only citrus' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(input()).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(input()).toHaveAttribute('aria-activedescendant');
  });

  it('UIC-COMBOBOX-5.6 opens from defaultOpen and reports the open state the reader asks for', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(
      <Combobox aria-label="Fruit" defaultItems={fruit} defaultOpen onOpenChange={onOpenChange} />,
    );
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // React Aria hides the button from assistive technology while the list is open.
    await user.click(container.querySelector('.ui-combobox__button') as HTMLElement);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('UIC-COMBOBOX-5.6 holds a controlled list open or closed as isOpen says', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Combobox
        aria-label="Fruit"
        defaultItems={fruit}
        isOpen={false}
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    rerender(
      <Combobox aria-label="Fruit" defaultItems={fruit} isOpen onOpenChange={onOpenChange} />,
    );
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    onOpenChange.mockClear();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    rerender(
      <Combobox
        aria-label="Fruit"
        defaultItems={fruit}
        isOpen={false}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('UIC-COMBOBOX-5.7 hands its input to inputRef and focuses it on mount with autoFocus', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(<Combobox aria-label="Fruit" defaultItems={fruit} inputRef={inputRef} autoFocus />);
    expect(inputRef.current).toBe(input());
    expect(input()).toHaveFocus();
  });
});
