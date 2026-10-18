import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { Tab, TabList, TabPanel, Tabs, type TabListProps } from './tabs.js';

interface Fruit {
  id: string;
  name: string;
}

const fruit: Fruit[] = [
  { id: 'apple', name: 'Apple' },
  { id: 'banana', name: 'Banana' },
  { id: 'cherry', name: 'Cherry' },
];

/** Renameable fruit tabs that apply each rename, reporting it to `onRename`. */
function Renameable({
  onRename,
  disabledKeys,
  ...list
}: Partial<TabListProps> & { disabledKeys?: Key[] }) {
  const [items, setItems] = useState(fruit);
  return (
    <Tabs disabledKeys={disabledKeys}>
      <TabList
        aria-label="Fruit"
        onRename={(key, name) => {
          onRename?.(key, name);
          setItems((current) =>
            current.map((item) => (item.id === key ? { ...item, name } : item)),
          );
        }}
        {...list}
      >
        {items.map((item) => (
          <Tab key={item.id} id={item.id}>
            {item.name}
          </Tab>
        ))}
      </TabList>
      {items.map((item) => (
        <TabPanel key={item.id} id={item.id}>
          About {item.name}
        </TabPanel>
      ))}
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });
const field = () => screen.getByRole('textbox');

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

// Fields driven by userEvent are slow in jsdom on a busy machine.
describe('Tab renaming', { timeout: 15_000 }, () => {
  it('UIC-TABS-3.1 opens a name field over a double-clicked tab and renames it on Enter', async () => {
    const onRename = vi.fn();
    const { container } = render(<Renameable onRename={onRename} />);
    await userEvent.dblClick(tab('Banana'));
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Rename Banana' });
    expect(input).toHaveFocus();
    expect(input).toHaveValue('Banana');
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 6]);
    expect(tab('Banana')).toHaveAttribute('data-renaming', 'true');
    // A tab holds no control: the field sits after the list.
    expect(screen.getByRole('tablist').contains(input)).toBe(false);
    expect(input.parentElement).toHaveClass('ui-tabs__rename');
    expect(input.parentElement).toHaveStyle({ position: 'absolute' });
    expectHooksMatchSpec(container, 'TABS', { slots: ['rename', 'rename-input'] });

    await userEvent.keyboard('{Control>}a{/Control}  Plantain {Enter}');
    expect(onRename).toHaveBeenCalledWith('banana', 'Plantain');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(tab('Plantain')).toHaveFocus();
    expect(tab('Plantain')).not.toHaveAttribute('data-renaming');
  });

  it('UIC-TABS-3.1 renames the focused tab with F2 and keeps its keys from the list', async () => {
    const onRemove = vi.fn();
    render(<Renameable onRemove={onRemove} />);
    await userEvent.tab();
    expect(tab('Apple')).toHaveFocus();
    await userEvent.keyboard('{F2}');
    expect(field()).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}{Backspace}{Delete}{Home}');
    expect(onRemove).not.toHaveBeenCalled();
    expect(field()).toHaveFocus();
    expect(field()).toHaveValue('Appl');
  });

  it('UIC-TABS-3.1 abandons the edit on Escape, and on a blank or unchanged name', async () => {
    const onRename = vi.fn();
    render(<Renameable onRename={onRename} />);
    await userEvent.dblClick(tab('Cherry'));
    await userEvent.keyboard('Plum{Escape}');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(tab('Cherry')).toHaveFocus();
    await userEvent.keyboard('{F2}{Enter}');
    await userEvent.keyboard('{F2}{Control>}a{/Control}   {Enter}');
    expect(onRename).not.toHaveBeenCalled();
    expect(tab('Cherry')).toHaveFocus();
  });

  it('UIC-TABS-3.1 renames the tab when focus leaves the field', async () => {
    const onRename = vi.fn();
    render(
      <>
        <Renameable onRename={onRename} />
        <button type="button">Elsewhere</button>
      </>,
    );
    await userEvent.dblClick(tab('Apple'));
    await userEvent.keyboard('{End} pie');
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onRename).toHaveBeenCalledWith('apple', 'Apple pie');
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });

  it('UIC-TABS-3.1 keeps the field open when focus returns to the renamed tab', async () => {
    render(<Renameable />);
    await userEvent.dblClick(tab('Banana'));
    act(() => tab('Banana').focus());
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(field()).toHaveFocus();
  });

  it('UIC-TABS-3.1 renames no disabled tab', async () => {
    render(<Renameable disabledKeys={['banana']} />);
    await userEvent.dblClick(tab('Banana'));
    fireEvent.doubleClick(tab('Banana'));
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('UIC-TABS-3.2 shows the message of a refused name and keeps the field open on Enter', async () => {
    const onRename = vi.fn();
    const validateName = vi.fn((_key: Key, name: string) =>
      fruit.some((item) => item.name === name) ? `${name} is taken.` : null,
    );
    const { container } = render(<Renameable onRename={onRename} validateName={validateName} />);
    await userEvent.dblClick(tab('Apple'));
    await userEvent.keyboard('{Control>}a{/Control}Cherry');
    expect(validateName).toHaveBeenLastCalledWith('apple', 'Cherry');
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field()).toHaveAttribute('data-invalid', 'true');
    expect(field()).toHaveAccessibleDescription('Cherry is taken.');
    expectHooksMatchSpec(container, 'TABS', { slots: ['rename-error'] });
    await userEvent.keyboard('{Enter}');
    expect(field()).toHaveFocus();
    expect(onRename).not.toHaveBeenCalled();

    await userEvent.keyboard('{Backspace}ies');
    expect(field()).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText('Cherry is taken.')).toBeNull();
    await userEvent.keyboard('{Control>}a{/Control}Apple');
    expect(validateName).not.toHaveBeenLastCalledWith('apple', 'Apple');
    expect(field()).not.toHaveAttribute('aria-invalid');
  });

  it('UIC-TABS-3.2 abandons a refused name when focus leaves the field', async () => {
    const onRename = vi.fn();
    render(<Renameable onRename={onRename} validateName={() => 'Names are fixed.'} />);
    await userEvent.dblClick(tab('Apple'));
    await userEvent.keyboard('Plum');
    act(() => field().blur());
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(onRename).not.toHaveBeenCalled();
  });
});
