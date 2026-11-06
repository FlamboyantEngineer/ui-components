import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Combobox, type ComboboxItem, type ComboboxProps } from './combobox.js';

const fruit: ComboboxItem[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'apricot', label: 'Apricot' },
  { id: 'banana', label: 'Banana' },
];

function input() {
  return screen.getByRole('combobox');
}

/** Every callback in the order the combobox made them, with its reason. */
function recordCallbacks() {
  const calls: string[] = [];
  return {
    calls,
    props: {
      onChange: (value: unknown, { reason }: { reason: string }) =>
        calls.push(`change ${JSON.stringify(value)} ${reason}`),
      onInputChange: (text: string, { reason }: { reason: string }) =>
        calls.push(`input "${text}" ${reason}`),
      onOpenChange: (isOpen: boolean, { reason }: { reason: string }) =>
        calls.push(`${isOpen ? 'open' : 'close'} ${reason}`),
    },
  };
}

describe('Combobox change reasons', () => {
  it('UIC-COMBOBOX-6.1 UIC-COMBOBOX-6.2 tells typing from the label a pick writes, and orders the callbacks', async () => {
    const user = userEvent.setup();
    const { calls, props } = recordCallbacks();
    render(<Combobox aria-label="Fruit" defaultItems={fruit} {...props} />);
    await user.type(input(), 'ap');
    await user.click(screen.getByRole('option', { name: 'Apricot' }));
    expect(calls).toEqual([
      'input "a" input',
      'open input',
      'input "ap" input',
      'change "apricot" select',
      'close select',
      'input "Apricot" sync',
    ]);
  });

  it('UIC-COMBOBOX-6.1 UIC-COMBOBOX-6.2 reports a pick by keyboard, the clear button and an emptied text as their own reasons', async () => {
    const user = userEvent.setup();
    const { calls, props } = recordCallbacks();
    render(<Combobox aria-label="Fruit" defaultItems={fruit} {...props} />);
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    // Arrow Down opens the list on its first option.
    await screen.findByRole('option', { name: 'Apple' });
    await user.keyboard('{Enter}');
    expect(calls).toEqual([
      'open manual',
      'change "apple" select',
      'close select',
      'input "Apple" sync',
    ]);
    calls.length = 0;
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    // The emptied text of the focused input opens the list, as typing does.
    expect(calls).toEqual(['change null clear', 'input "" clear', 'open input']);
    await user.type(input(), 'ban{ArrowDown}{Enter}');
    expect(input()).toHaveValue('Banana');
    calls.length = 0;
    await user.clear(input());
    expect(calls).toEqual(['input "" input', 'open input', 'change null clear']);
  });

  it('UIC-COMBOBOX-6.1 UIC-COMBOBOX-6.2 reports Escape and leaving the field as dismissals that revert the text', async () => {
    const user = userEvent.setup();
    const { calls, props } = recordCallbacks();
    render(
      <>
        <Combobox aria-label="Fruit" defaultItems={fruit} defaultValue="banana" {...props} />
        <button type="button">After</button>
      </>,
    );
    // Mounting writes the chosen option's label.
    expect(calls).toEqual(['input "Banana" sync']);
    calls.length = 0;
    await user.type(input(), 'x');
    await user.keyboard('{Escape}');
    expect(calls).toEqual([
      'input "Bananax" input',
      'open input',
      'input "Banana" sync',
      'close dismiss',
    ]);
    calls.length = 0;
    await user.click(input());
    await user.keyboard('{ArrowDown}');
    await user.tab();
    expect(calls).toEqual(['open manual', 'close dismiss']);
  });

  it('UIC-COMBOBOX-6.1 opens on focus with the focus reason', async () => {
    const user = userEvent.setup();
    const { calls, props } = recordCallbacks();
    render(<Combobox aria-label="Fruit" defaultItems={fruit} menuTrigger="focus" {...props} />);
    await user.click(input());
    expect(calls).toEqual(['open focus']);
  });

  it('UIC-COMBOBOX-6.1 UIC-COMBOBOX-6.2 reports chip removal apart from picks', async () => {
    const user = userEvent.setup();
    const { calls, props } = recordCallbacks();
    render(
      <Combobox
        label="Fruit"
        selectionMode="multiple"
        defaultItems={fruit}
        defaultValue={['apple', 'banana']}
        {...props}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Remove.*Apple/ }));
    expect(calls).toEqual(['change ["banana"] remove']);
  });

  it('UIC-COMBOBOX-6.3 reports a controlled replacement only as synchronized text', () => {
    const { calls, props } = recordCallbacks();
    const { rerender } = render(
      <Combobox aria-label="Fruit" defaultItems={fruit} value="apple" {...props} />,
    );
    expect(input()).toHaveValue('Apple');
    rerender(<Combobox aria-label="Fruit" defaultItems={fruit} value="banana" {...props} />);
    expect(input()).toHaveValue('Banana');
    expect(calls).toEqual(['input "Apple" sync', 'input "Banana" sync']);
  });

  it('UIC-COMBOBOX-6.3 runs a remote search for typing and clearing but not for a synchronized label', async () => {
    const user = userEvent.setup();
    const search = vi.fn();
    function Remote() {
      const [items, setItems] = useState(fruit);
      return (
        <Combobox
          aria-label="Fruit"
          items={items}
          onInputChange={(text, { reason }) => {
            if (reason !== 'input' && reason !== 'clear') return;
            search(text);
            setItems(
              fruit.filter((item) => String(item.label).toLowerCase().includes(text.toLowerCase())),
            );
          }}
        />
      );
    }
    render(<Remote />);
    await user.type(input(), 'ban');
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(input()).toHaveValue('Banana');
    expect(search.mock.calls).toEqual([['b'], ['ba'], ['ban']]);
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(search).toHaveBeenLastCalledWith('');
  });

  it('UIC-COMBOBOX-6.2 closes after creating an option as a pick', async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    function Creating() {
      const [items, setItems] = useState(fruit);
      const [value, setValue] = useState<string | null>(null);
      return (
        <Combobox
          aria-label="Fruit"
          items={items}
          value={value}
          onChange={(next) => setValue(next === null ? null : String(next))}
          onOpenChange={(isOpen, { reason }) =>
            calls.push(`${isOpen ? 'open' : 'close'} ${reason}`)
          }
          onCreateOption={(text) => {
            calls.push(`create ${text}`);
            setItems((current) => [...current, { id: text, label: text }]);
            setValue(text);
          }}
        />
      );
    }
    render(<Creating />);
    await user.type(input(), 'Kiwi');
    await user.click(screen.getByRole('option', { name: /Kiwi/ }));
    expect(input()).toHaveValue('Kiwi');
    expect(calls).toEqual(['open input', 'create Kiwi', 'close select']);
  });

  it('UIC-COMBOBOX-6.1 reports a pick by touch as a pick', async () => {
    const { calls, props } = recordCallbacks();
    const user = userEvent.setup();
    render(<Combobox aria-label="Fruit" defaultItems={fruit} {...props} />);
    await user.type(input(), 'b');
    const banana = await screen.findByRole('option', { name: 'Banana' });
    await user.pointer({ keys: '[TouchA]', target: banana });
    expect(calls).toContain('change "banana" select');
    expect(calls).toContain('close select');
  });

  it('UIC-COMBOBOX-6.1 takes handlers that read only the value', () => {
    const single: ComboboxProps['onChange'] = (value) => value;
    const multiple: ComboboxProps<'multiple'>['onChange'] = (keys) => keys.length;
    const text: ComboboxProps['onInputChange'] = (typed) => typed;
    render(
      <>
        <Combobox aria-label="One" defaultItems={fruit} onChange={single} onInputChange={text} />
        <Combobox
          aria-label="Many"
          selectionMode="multiple"
          defaultItems={fruit}
          onChange={multiple}
        />
      </>,
    );
    // @ts-expect-error A multiple combobox reports a list of keys, never one key.
    const wrong: ComboboxProps<'multiple'>['onChange'] = (key: string) => key;
    expect(wrong).toBeTypeOf('function');
  });
});
