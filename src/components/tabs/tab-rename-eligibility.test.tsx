import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import { Tab, TabList, TabPanel, Tabs } from './tabs.js';

interface ListOptions {
  onRename?: ((key: Key, name: string) => void) | undefined;
  isDisabled?: boolean;
  disabledKeys?: Key[];
  disabledTab?: string;
  ids?: string[];
}

const names: Record<string, string> = { apple: 'Apple', banana: 'Banana', cherry: 'Cherry' };

function list({ onRename, isDisabled, disabledKeys, disabledTab, ids }: ListOptions) {
  const shown = ids ?? Object.keys(names);
  return (
    <Tabs isDisabled={isDisabled} disabledKeys={disabledKeys}>
      <TabList aria-label="Fruit" onRename={onRename}>
        {shown.map((id) => (
          <Tab key={id} id={id} isDisabled={id === disabledTab}>
            {names[id]}
          </Tab>
        ))}
      </TabList>
      {shown.map((id) => (
        <TabPanel key={id} id={id}>
          About {names[id]}
        </TabPanel>
      ))}
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });

async function startEditing(onRename: ListOptions['onRename']) {
  const user = userEvent.setup();
  const view = render(list({ onRename }));
  await user.tab();
  await user.keyboard('{F2}');
  await user.keyboard('{Control>}a{/Control}Changed');
  expect(screen.getByRole('textbox')).toHaveValue('Changed');
  return { user, rerender: (options: ListOptions) => view.rerender(list(options)) };
}

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

describe('Tab renaming as the tab changes', { timeout: 15_000 }, () => {
  it.each<[string, ListOptions]>([
    ['every tab is disabled', { isDisabled: true }],
    ['the tab joins disabledKeys', { disabledKeys: ['apple'] }],
    ['the tab turns disabled', { disabledTab: 'apple' }],
  ])('UIC-TABS-3.8 ends the edit without renaming when %s', async (_case, options) => {
    const onRename = vi.fn();
    const { user, rerender } = await startEditing(onRename);
    rerender({ onRename, ...options });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onRename).not.toHaveBeenCalled();
  });

  it('UIC-TABS-3.8 ends the edit when the list stops taking renames', async () => {
    const onRename = vi.fn();
    const { user, rerender } = await startEditing(onRename);
    rerender({ onRename: undefined });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(tab('Apple')).toHaveFocus();
    rerender({ onRename });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onRename).not.toHaveBeenCalled();
  });

  it('UIC-TABS-3.8 does not reopen the edit when the removed tab comes back', async () => {
    const onRename = vi.fn();
    const { rerender } = await startEditing(onRename);
    rerender({ onRename, ids: ['banana', 'cherry'] });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(tab('Banana')).toHaveFocus();
    rerender({ onRename, ids: ['apple', 'banana', 'cherry'] });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(onRename).not.toHaveBeenCalled();
  });

  it('UIC-TABS-3.8 renames with the current callback after it changes', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { user, rerender } = await startEditing(first);
    rerender({ onRename: second });
    expect(screen.getByRole('textbox')).toHaveValue('Changed');
    await user.keyboard('{Enter}');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('apple', 'Changed');
  });
});
