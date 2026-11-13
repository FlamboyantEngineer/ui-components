import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { CascaderField, type CascaderOption, type CascaderValue } from './cascader-field.js';
import type { CascaderLoader } from './use-cascader-loads.js';

const places: CascaderOption[] = [
  {
    id: 'north',
    label: 'North',
    children: [
      {
        id: 'lakes',
        label: 'Lakes',
        children: [
          { id: 'pine', label: 'Pine Harbour' },
          { id: 'fern', label: 'Fern Bay', isDisabled: true },
          { id: 'reed', label: 'Reed Point' },
        ],
      },
      { id: 'hills', label: 'Hills', children: [{ id: 'oak', label: 'Oak Rise' }] },
    ],
  },
  {
    id: 'south',
    label: 'South',
    children: [
      { id: 'coast', label: 'Coast', children: [{ id: 'pine-s', label: 'Pine Harbour' }] },
    ],
  },
  { id: 'closed', label: 'Closed region', isDisabled: true, children: [] },
  { id: 1, label: 'Zone one' },
  { id: '1', label: 'Zone "1"' },
];

function trigger() {
  return screen.getByRole('button', { name: /^Place/ });
}

function panel(name: string) {
  return screen.getByRole('listbox', { name });
}

/** A loader whose answers the test settles one by one. */
function createLoader() {
  const calls: Array<{
    option: CascaderOption;
    signal: AbortSignal;
    resolve: (options: CascaderOption[]) => void;
    reject: (error: Error) => void;
  }> = [];
  const loadChildren: CascaderLoader = vi.fn(
    (option, { signal }) =>
      new Promise<readonly CascaderOption[]>((resolve, reject) => {
        calls.push({ option, signal, resolve, reject });
      }),
  );
  return { loadChildren, calls };
}

describe('CascaderField', () => {
  it('UIC-CASCADER-FIELD-1.1 draws a trigger named by the label and the chosen path', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<CascaderField label="Place" options={places} />);
    expect(trigger()).toHaveAccessibleName('Place Select an option');
    expect(container.querySelector('.ui-field')).toHaveClass('ui-cascader-field');
    rerender(
      <CascaderField
        key="chosen"
        label="Place"
        options={places}
        defaultValue={['north', 'lakes', 'pine']}
      />,
    );
    expect(trigger()).toHaveAccessibleName('Place North / Lakes / Pine Harbour');
    await user.click(trigger());
    expectHooksMatchSpec(document.body, 'CASCADER-FIELD', {
      slots: ['trigger', 'value', 'segment', 'separator', 'popover', 'dialog', 'panels', 'panel'],
    });
  });

  it('UIC-CASCADER-FIELD-2.1 UIC-CASCADER-FIELD-2.2 opens levels with the arrows and chooses a leaf with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CascaderField label="Place" options={places} onChange={onChange} />);
    await user.click(trigger());
    const top = panel('Place');
    expect(within(top).getByRole('option', { name: 'North' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(within(panel('North')).getByRole('option', { name: 'Lakes' })).toHaveFocus();
    expect(within(top).getByRole('option', { name: 'North' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.keyboard('{ArrowRight}');
    const lakes = panel('Lakes');
    expect(within(lakes).getByRole('option', { name: 'Pine Harbour' })).toHaveFocus();
    // Fern Bay is disabled, so Arrow Down passes over it.
    await user.keyboard('{ArrowDown}');
    expect(within(lakes).getByRole('option', { name: 'Reed Point' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(within(panel('North')).getByRole('option', { name: 'Lakes' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['north', 'lakes', 'reed']);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger()).toHaveAccessibleName('Place North / Lakes / Reed Point');
    // Focus returns from the closed overlay in a later frame (T11).
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('UIC-CASCADER-FIELD-2.2 opens a branch and chooses a leaf by pointer, and reopens on the chosen path', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CascaderField label="Place" options={places} onChange={onChange} />);
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'South' }));
    await user.click(within(panel('South')).getByRole('option', { name: 'Coast' }));
    await user.click(within(panel('Coast')).getByRole('option', { name: 'Pine Harbour' }));
    expect(onChange).toHaveBeenLastCalledWith(['south', 'coast', 'pine-s']);
    // Two places share a label; the path tells them apart.
    expect(trigger()).toHaveAccessibleName('Place South / Coast / Pine Harbour');
    await user.click(trigger());
    expect(within(panel('Coast')).getByRole('option', { name: 'Pine Harbour' })).toHaveFocus();
    expect(screen.getAllByRole('listbox')).toHaveLength(3);
  });

  it('UIC-CASCADER-FIELD-2.1 mirrors the arrows right to left', async () => {
    const user = userEvent.setup();
    render(
      <UiProvider locale="he">
        <CascaderField label="Place" options={places} />
      </UiProvider>,
    );
    await user.click(trigger());
    await user.keyboard('{ArrowLeft}');
    expect(within(panel('North')).getByRole('option', { name: 'Lakes' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(within(panel('Place')).getByRole('option', { name: 'North' })).toHaveFocus();
  });

  it('UIC-CASCADER-FIELD-1.2 keeps numeric and text ids apart and never opens a disabled branch', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CascaderField label="Place" options={places} onChange={onChange} />);
    await user.click(trigger());
    const closed = screen.getByRole('option', { name: 'Closed region' });
    expect(closed).toHaveAttribute('aria-disabled', 'true');
    await user.click(closed);
    expect(screen.getAllByRole('listbox')).toHaveLength(1);
    await user.click(screen.getByRole('option', { name: 'Zone "1"' }));
    expect(onChange).toHaveBeenLastCalledWith(['1']);
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'Zone one' }));
    expect(onChange).toHaveBeenLastCalledWith([1]);
  });

  it('UIC-CASCADER-FIELD-3.1 loads a branch on first opening, moves into it once loaded and retries a failure', async () => {
    const user = userEvent.setup();
    const { loadChildren, calls } = createLoader();
    const remote: CascaderOption[] = [
      { id: 'east', label: 'East', hasChildren: true },
      { id: 'west', label: 'West', hasChildren: true },
    ];
    render(<CascaderField label="Place" options={remote} loadChildren={loadChildren} />);
    await user.click(trigger());
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(calls).toHaveLength(1);
    expect(calls[0]?.option.id).toBe('east');
    // Focus waits on the branch until its options arrive.
    expect(screen.getByRole('option', { name: 'East' })).toHaveFocus();
    await act(async () => calls[0]?.resolve([{ id: 'dune', label: 'Dune Field' }]));
    expect(within(panel('East')).getByRole('option', { name: 'Dune Field' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}{ArrowDown}{ArrowRight}');
    await act(async () => calls[1]?.reject(new Error('Offline')));
    expect(screen.getByRole('status')).toHaveTextContent('Could not load these options');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(calls).toHaveLength(3);
    await act(async () => calls[2]?.resolve([{ id: 'mesa', label: 'Mesa' }]));
    expect(within(panel('West')).getByRole('option', { name: 'Mesa' })).toBeInTheDocument();
    // A loaded branch opens again without a second load.
    await user.click(screen.getByRole('option', { name: 'East' }));
    expect(calls).toHaveLength(3);
  });

  it('UIC-CASCADER-FIELD-2.1 UIC-CASCADER-FIELD-3.1 loads the saved path’s branch when it opens', async () => {
    const user = userEvent.setup();
    const { loadChildren, calls } = createLoader();
    const remote: CascaderOption[] = [
      { id: 'east', label: 'East', hasChildren: true },
      { id: 'west', label: 'West' },
    ];
    render(
      <CascaderField
        label="Place"
        options={remote}
        loadChildren={loadChildren}
        defaultValue={['east', 'mesa']}
      />,
    );
    await user.click(trigger());
    expect(calls.map((call) => call.option.id)).toEqual(['east']);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    // Focus waits on the branch until its level arrives, then moves onto the saved leaf.
    expect(screen.getByRole('option', { name: 'East' })).toHaveFocus();
    await act(async () =>
      calls[0]?.resolve([
        { id: 'dune', label: 'Dune Field' },
        { id: 'mesa', label: 'Mesa' },
      ]),
    );
    expect(within(panel('East')).getByRole('option', { name: 'Mesa' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await user.click(trigger());
    expect(calls).toHaveLength(1);
  });

  it('UIC-CASCADER-FIELD-3.1 fails a load whose loader throws at once', async () => {
    const user = userEvent.setup();
    const loadChildren: CascaderLoader = () => {
      throw new Error('No loader yet');
    };
    render(
      <CascaderField
        label="Place"
        options={[{ id: 'east', label: 'East', hasChildren: true }]}
        loadChildren={loadChildren}
      />,
    );
    await user.click(trigger());
    await user.keyboard('{ArrowRight}');
    expect(await screen.findByRole('status')).toHaveTextContent('Could not load these options');
  });

  it('UIC-CASCADER-FIELD-1.2 describes each branch as opening more options', async () => {
    const user = userEvent.setup();
    render(<CascaderField label="Place" options={places} />);
    await user.click(trigger());
    expect(screen.getByRole('option', { name: 'North' })).toHaveAccessibleDescription(
      'Opens more options',
    );
    expect(screen.getByRole('option', { name: 'Zone one' })).not.toHaveAccessibleDescription();
  });

  it('UIC-CASCADER-FIELD-2.1 follows an open state owned by the host', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Owned() {
      const [isOpen, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Show places
          </button>
          <CascaderField
            label="Place"
            options={places}
            defaultValue={['north', 'lakes', 'reed']}
            isOpen={isOpen}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
          />
        </>
      );
    }
    render(<Owned />);
    await user.click(screen.getByRole('button', { name: 'Show places' }));
    expect(within(panel('Lakes')).getByRole('option', { name: 'Reed Point' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('dialog', { name: 'Place' })).toBeInTheDocument();
  });

  it('UIC-CASCADER-FIELD-2.1 starts open with defaultOpen', () => {
    render(<CascaderField label="Place" options={places} defaultOpen />);
    expect(screen.getByRole('dialog', { name: 'Place' })).toBeInTheDocument();
  });

  it('UIC-CASCADER-FIELD-3.2 keeps a controlled replacement while a branch loads, and aborts on unmount', async () => {
    const user = userEvent.setup();
    const { loadChildren, calls } = createLoader();
    const remote: CascaderOption[] = [
      { id: 'east', label: 'East', hasChildren: true },
      { id: 'north', label: 'North', children: [{ id: 'oak', label: 'Oak Rise' }] },
    ];
    function Controlled() {
      const [value, setValue] = useState<CascaderValue>(null);
      return (
        <>
          <button type="button" onClick={() => setValue(['north', 'oak'])}>
            Choose Oak Rise
          </button>
          <CascaderField
            label="Place"
            options={remote}
            loadChildren={loadChildren}
            value={value}
            onChange={setValue}
          />
        </>
      );
    }
    const { unmount } = render(<Controlled />);
    await user.click(trigger());
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Choose Oak Rise' }));
    expect(trigger()).toHaveAccessibleName('Place North / Oak Rise');
    await act(async () => calls[0]?.resolve([{ id: 'dune', label: 'Dune Field' }]));
    expect(trigger()).toHaveAccessibleName('Place North / Oak Rise');
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'East' }));
    expect(within(panel('East')).getByRole('option', { name: 'Dune Field' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(trigger());
    await user.click(screen.getByRole('option', { name: 'East' }));
    const signal = calls[0]?.signal;
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it('UIC-CASCADER-FIELD-1.3 clears with Backspace, resets with the form, submits the leaf id and stays closed while read-only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, rerender } = render(
      <form>
        <CascaderField
          label="Place"
          name="place"
          options={places}
          defaultValue={['north', 'hills', 'oak']}
          onChange={onChange}
        />
      </form>,
    );
    const form = container.querySelector('form');
    expect(form && new FormData(form).get('place')).toBe('oak');
    trigger().focus();
    await user.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(trigger()).toHaveAccessibleName('Place Select an option');
    act(() => form?.reset());
    // The field resets once the form's reset event has passed.
    await act(() => new Promise((resolve) => setTimeout(resolve, 5)));
    expect(trigger()).toHaveAccessibleName('Place North / Hills / Oak Rise');
    rerender(
      <form>
        <CascaderField label="Place" name="place" options={places} isReadOnly />
      </form>,
    );
    await user.click(trigger());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-FIELD-11.2 draws an option shortcut after its description', async () => {
    const user = userEvent.setup();
    const options: CascaderOption[] = [
      { id: 'bold', label: 'Bold', description: 'Heavier', shortcut: 'Ctrl+B' },
      { id: 'more', label: 'More', children: [{ id: 'plain', label: 'Plain' }] },
    ];
    const { baseElement } = render(<CascaderField label="Place" options={options} />);
    await user.click(trigger());
    const bold = screen.getByRole('option', { name: 'Bold Heavier Control B' });
    expect(bold.querySelector('.ui-cascader-field__option-shortcut')).toHaveClass('ui-shortcut');
    expect(screen.getByRole('option', { name: 'More' })).toBeInTheDocument();
    expectHooksMatchSpec(baseElement, 'CASCADER-FIELD', { slots: ['option-shortcut'] });
  });

  it('UIC-CASCADER-FIELD-1.1 shows an id whose option is not known yet', () => {
    render(<CascaderField label="Place" options={places} defaultValue={['north', 'gone']} />);
    expect(trigger()).toHaveAccessibleName('Place North / gone');
  });
});
