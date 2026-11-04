import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import { Button } from '../button/button.js';
import { Tab, TabList, TabPanel, Tabs } from './tabs.js';

describe('Tab action parts', () => {
  it('UIC-TABS-3.11 owns only actual tabs after late rendering and keeps ordinary actions separate', async () => {
    const user = userEvent.setup();
    const add = vi.fn();
    const selection = vi.fn();
    const { container } = render(
      <Tabs defaultSelectedKey="one" onSelectionChange={selection}>
        <TabList
          aria-label="Sections"
          renderAfterTab={(key) => (key === 'one' ? <Button onPress={add}>Add item</Button> : null)}
        >
          <Tab id="one">One</Tab>
          <Tab id="two">Two</Tab>
        </TabList>
        <TabPanel id="one">First page.</TabPanel>
        <TabPanel id="two">Second page.</TabPanel>
      </Tabs>,
    );
    const owner = screen.getByRole('tablist', { name: 'Sections' });
    const tabs = screen.getAllByRole('tab');
    await waitFor(() =>
      expect(owner.getAttribute('aria-owns')?.split(' ')).toEqual(tabs.map((tab) => tab.id)),
    );
    expect(container.querySelector('.ui-tabs__list')).toHaveAttribute('role', 'group');
    const panel = screen.getByRole('tabpanel');
    const selected = screen.getByRole('tab', { selected: true });
    expect(selected).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', selected.id);
    expectHooksMatchSpec(container, 'TABS', {
      slots: ['owner', 'action', 'list', 'tab', 'panel'],
    });
    await user.click(screen.getByRole('button', { name: 'Add item' }));
    expect(add).toHaveBeenCalledOnce();
    expect(selection).not.toHaveBeenCalled();
    expect(panel).toHaveTextContent('First page.');
    await user.click(screen.getByRole('tab', { name: 'Two' }));
    expect(selection).toHaveBeenLastCalledWith('two');
  });
});

it('UIC-TABS-3.11 preserves typed and whitespace keys and keeps every action independent', async () => {
  const user = userEvent.setup();
  const selection = vi.fn();
  const seen = vi.fn((key: Key) => <Button>{`After ${typeof key}:${key}`}</Button>);
  render(
    <Tabs defaultSelectedKey={1} onSelectionChange={selection}>
      <TabList aria-label="Typed pages" renderAfterTab={seen}>
        <Tab id={1}>Numeric</Tab>
        <Tab id="1">String</Tab>
        <Tab id=" one ">Spaced</Tab>
      </TabList>
      <TabPanel id={1}>Numeric page.</TabPanel>
      <TabPanel id="1">String page.</TabPanel>
      <TabPanel id=" one ">Spaced page.</TabPanel>
    </Tabs>,
  );
  expect(seen).toHaveBeenCalledWith(1);
  expect(seen).toHaveBeenCalledWith('1');
  expect(seen).toHaveBeenCalledWith(' one ');
  expect(screen.getAllByRole('button')).toHaveLength(3);
  await user.click(screen.getByRole('tab', { name: 'String' }));
  expect(selection).toHaveBeenLastCalledWith('1');
  await user.click(screen.getByRole('tab', { name: 'Spaced' }));
  expect(selection).toHaveBeenLastCalledWith(' one ');
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Spaced page.');
});

it('UIC-TABS-3.11 null action output retains the native list and its public render and ref', async () => {
  const listRef = { current: null as HTMLDivElement | null };
  const add = vi.fn();
  render(
    <Tabs>
      <TabList
        ref={listRef}
        aria-label="Pages"
        renderAfterTab={() => null}
        onAdd={add}
        render={(props) => <div {...props} data-custom-list="true" />}
      >
        <Tab id="one">One</Tab>
        <Tab id="two">Two</Tab>
      </TabList>
      <TabPanel id="one">First page.</TabPanel>
      <TabPanel id="two">Second page.</TabPanel>
    </Tabs>,
  );
  const list = screen.getByRole('tablist', { name: 'Pages' });
  expect(list).not.toHaveAttribute('aria-owns');
  expect(list).toHaveAttribute('data-custom-list', 'true');
  expect(listRef.current).toBe(list);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Add tab' }));
  expect(add).toHaveBeenCalledOnce();
});

it('UIC-TABS-3.11 tracks mounted ID changes and a replacement visual list', async () => {
  const content = (replacement: boolean, extra: boolean) => (
    <Tabs>
      <TabList
        aria-label="Pages"
        renderAfterTab={(key) => (key === 'one' ? <Button>Add item</Button> : null)}
        render={(props) => <div key={String(replacement)} {...props} />}
      >
        <Tab id="one">One</Tab>
        <Tab id="two">Two</Tab>
        {extra && <Tab id="three">Three</Tab>}
      </TabList>
      <TabPanel id="one">First page.</TabPanel>
      <TabPanel id="two">Second page.</TabPanel>
      {extra && <TabPanel id="three">Third page.</TabPanel>}
    </Tabs>
  );
  const { rerender } = render(content(false, false));
  const owner = screen.getByRole('tablist', { name: 'Pages' });
  const tab = screen.getByRole('tab', { name: 'One' });
  const id = tab.id;
  tab.id = `${id}-changed`;
  await waitFor(() => expect(owner.getAttribute('aria-owns')?.split(' ')).toContain(tab.id));
  expect(owner.getAttribute('aria-owns')?.split(' ')).not.toContain(id);
  tab.id = id;
  rerender(content(true, false));
  rerender(content(true, true));
  await waitFor(() =>
    expect(owner.getAttribute('aria-owns')?.split(' ')).toEqual(
      screen.getAllByRole('tab').map((element) => element.id),
    ),
  );
});
