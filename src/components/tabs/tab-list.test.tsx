import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Tab, TabList, TabPanel, Tabs, type TabListProps } from './tabs.js';

const fruit = ['Apple', 'Banana', 'Cherry', 'Fig', 'Grape'];

function Fruit({
  defaultSelectedKey,
  isDisabled,
  ...list
}: Partial<TabListProps> & { defaultSelectedKey?: Key; isDisabled?: boolean }) {
  return (
    <Tabs defaultSelectedKey={defaultSelectedKey} isDisabled={isDisabled}>
      <TabList aria-label="Fruit" {...list}>
        {fruit.map((name) => (
          <Tab key={name} id={name.toLowerCase()}>
            {name}
          </Tab>
        ))}
      </TabList>
      {fruit.map((name) => (
        <TabPanel key={name} id={name.toLowerCase()}>
          About {name}
        </TabPanel>
      ))}
    </Tabs>
  );
}

/** Tabs are ten pixels per character; the bar around a list offers `room` pixels. */
function stubBar(room: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const width = this.getAttribute('role') === 'tab' ? (this.textContent ?? '').length * 10 : 0;
    return new DOMRect(0, 0, width, 30);
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains('ui-tabs__bar') ? room : 0;
  });
}

function shownTabs(): string[] {
  return screen.getAllByRole('tab').map((tab) => tab.textContent ?? '');
}

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TabList', () => {
  it('UIC-TABS-2.6 UIC-OVERFLOW-LIST-1.7 collapses the tabs that do not fit into a menu after the list', async () => {
    stubBar(160);
    const { container } = render(<Fruit overflow="menu" />);
    // Apple (50) and Banana (60) fit beside the menu; the others go into it.
    expect(shownTabs()).toEqual(['Apple', 'Banana']);
    const list = screen.getByRole('tablist', { name: 'Fruit' });
    expect(list).toHaveAttribute('data-overflowing', 'true');
    const bar = list.parentElement as HTMLElement;
    expect(bar).toHaveClass('ui-tabs__bar');
    expect(bar).toHaveAttribute('data-overflow', 'menu');
    const more = screen.getByRole('button', { name: '3 more items' });
    expect(more.closest('.ui-tabs__overflow')).toBe(list.nextElementSibling);
    expectHooksMatchSpec(container, 'TABS', { slots: ['bar', 'list', 'tab', 'overflow'] });

    await userEvent.click(more);
    const menu = await screen.findByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Cherry', 'Fig', 'Grape']);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Grape' }));
    expect(screen.getByRole('tab', { name: 'Grape' })).toHaveAttribute('aria-selected', 'true');
    // Grape (50) is kept first, then Apple (50) and Banana (60) from the start.
    expect(shownTabs()).toEqual(['Apple', 'Banana', 'Grape']);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('About Grape');
  });

  it('UIC-TABS-2.6 keeps the selected tab and shows a tab that keyboard focus reaches', async () => {
    stubBar(160);
    render(<Fruit overflow="menu" defaultSelectedKey="fig" />);
    expect(shownTabs()).toEqual(['Apple', 'Banana', 'Fig']);
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Fig' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Grape' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Grape' })).toHaveAttribute('aria-selected', 'true');
    expect(shownTabs()).toEqual(['Apple', 'Banana', 'Grape']);
  });

  it('UIC-TABS-2.6 renders every tab and no menu when they fit', () => {
    stubBar(400);
    render(<Fruit overflow="menu" />);
    expect(shownTabs()).toEqual(fruit);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('tablist')).not.toHaveAttribute('data-overflowing');
  });

  it('UIC-TABS-2.2 UIC-TABS-2.6 disables overflow choices and its trigger with every tab', async () => {
    const user = userEvent.setup();
    stubBar(160);
    const { rerender } = render(<Fruit overflow="menu" />);
    const apple = screen.getByRole('tab', { name: 'Apple' });
    const more = screen.getByRole('button', { name: '3 more items' });
    await user.click(more);
    await screen.findByRole('menu');
    rerender(<Fruit overflow="menu" isDisabled />);
    expect(more).toBeDisabled();
    const grape = screen.getByRole('menuitem', { name: 'Grape' });
    expect(grape).toHaveAttribute('aria-disabled', 'true');
    await user.click(grape);
    expect(apple).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Escape}');
    rerender(<Fruit overflow="menu" />);
    await user.click(more);
    await user.click(await screen.findByRole('menuitem', { name: 'Grape' }));
    expect(screen.getByRole('tab', { name: 'Grape' })).toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-TABS-2.7 draws scroll buttons at the edges that hide tabs and pages the list', async () => {
    const scrollTo = vi.fn(function (this: HTMLElement, { left }: ScrollToOptions) {
      this.scrollLeft = left ?? 0;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.getAttribute('role') === 'tablist' ? 500 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.getAttribute('role') === 'tablist' ? 200 : 0;
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    try {
      const { container } = render(<Fruit scrollButtons />);
      const list = screen.getByRole('tablist');
      await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      const buttons = container.querySelectorAll('.ui-tabs__scroll-button');
      expect(buttons).toHaveLength(2);
      const back = buttons[0] as HTMLButtonElement;
      const forward = buttons[1] as HTMLButtonElement;
      expect(back).toHaveAttribute('aria-label', 'Scroll backward');
      expect(back).toHaveAttribute('hidden');
      expect(forward).toHaveAttribute('aria-label', 'Scroll forward');
      expect(forward).not.toHaveAttribute('hidden');
      expect(forward).toHaveAttribute('tabindex', '-1');
      expect(forward).toHaveAttribute('data-edge', 'end');
      await userEvent.click(forward);
      expect(scrollTo).toHaveBeenLastCalledWith({ left: 160, behavior: 'auto' });
      fireEvent.scroll(list);
      await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      expect(back).not.toHaveAttribute('hidden');
      expectHooksMatchSpec(container, 'TABS', { slots: ['bar', 'list', 'scroll-button'] });
    } finally {
      delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
    }
  });

  it('UIC-TABS-2.8 removes a tab by its close mark or the Delete key and adds one', async () => {
    const onRemove = vi.fn();
    const onAdd = vi.fn();
    const { container } = render(<Fruit onRemove={onRemove} onAdd={onAdd} />);
    const banana = screen.getByRole('tab', { name: 'Banana' });
    expect(banana).toHaveAttribute('aria-keyshortcuts', 'Delete');
    const mark = banana.querySelector('.ui-tabs__remove') as HTMLElement;
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    await userEvent.click(mark);
    expect(onRemove).toHaveBeenLastCalledWith(new Set(['banana']));
    expect(banana).toHaveAttribute('aria-selected', 'false');

    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Apple' })).toHaveFocus();
    await userEvent.keyboard('{Delete}');
    expect(onRemove).toHaveBeenLastCalledWith(new Set(['apple']));
    await userEvent.keyboard('{ArrowRight}{Backspace}');
    expect(onRemove).toHaveBeenLastCalledWith(new Set(['banana']));

    await userEvent.click(screen.getByRole('button', { name: 'Add tab' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'TABS', { slots: ['bar', 'list', 'tab', 'remove', 'add'] });
  });

  it.each(['tabs', 'keys', 'tab'] as const)(
    'UIC-TABS-2.2 UIC-TABS-2.8 refuses a close mark while disabled through %s and follows changes',
    async (source) => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const tabs = (isDisabled: boolean) => (
        <Tabs
          isDisabled={source === 'tabs' && isDisabled}
          disabledKeys={source === 'keys' && isDisabled ? ['banana'] : []}
        >
          <TabList aria-label="Fruit" onRemove={onRemove}>
            <Tab id="apple">Apple</Tab>
            <Tab id="banana" isDisabled={source === 'tab' && isDisabled}>
              Banana
            </Tab>
          </TabList>
        </Tabs>
      );
      const { rerender } = render(tabs(false));
      const banana = screen.getByRole('tab', { name: 'Banana' });
      const mark = banana.querySelector('.ui-tabs__remove') as HTMLElement;
      await user.click(banana);
      rerender(tabs(true));
      await user.click(mark);
      await user.keyboard('{Delete}{Backspace}');
      expect(onRemove).not.toHaveBeenCalled();
      expect(mark).toBeInTheDocument();
      rerender(tabs(false));
      await user.click(mark);
      expect(onRemove).toHaveBeenCalledExactlyOnceWith(new Set(['banana']));
    },
  );

  it('UIC-TABS-2.8 removes tabs a caller drops from its list', async () => {
    function Editable() {
      const [names, setNames] = useState(['Apple', 'Banana', 'Cherry']);
      return (
        <Tabs>
          <TabList
            aria-label="Fruit"
            onRemove={(keys) => setNames((current) => current.filter((name) => !keys.has(name)))}
            onAdd={() => setNames((current) => [...current, `Fruit ${current.length + 1}`])}
          >
            {names.map((name) => (
              <Tab key={name} id={name}>
                {name}
              </Tab>
            ))}
          </TabList>
        </Tabs>
      );
    }
    render(<Editable />);
    await userEvent.click(screen.getByRole('button', { name: 'Add tab' }));
    expect(shownTabs()).toEqual(['Apple', 'Banana', 'Cherry', 'Fruit 4']);
    await userEvent.click(screen.getByRole('tab', { name: 'Apple' }));
    await userEvent.keyboard('{Delete}');
    expect(shownTabs()).toEqual(['Banana', 'Cherry', 'Fruit 4']);
  });

  it('UIC-TABS-1.6 renders the family through caller elements with their states', () => {
    render(
      <Tabs render={(props, state) => <div {...props} data-swapped={state.orientation} />}>
        <TabList
          aria-label="Fruit"
          render={(props, state) => <div {...props} data-swapped={`list ${state.orientation}`} />}
        >
          <Tab
            id="apple"
            render={(props, state) => (
              <div {...props} data-swapped={state.isSelected ? 'selected tab' : 'tab'} />
            )}
          >
            Apple
          </Tab>
        </TabList>
        <TabPanel
          id="apple"
          render={(props, state) => (
            <div {...props} data-swapped={state.isInert ? 'inert panel' : 'panel'} />
          )}
        >
          Apples
        </TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tablist')).toHaveAttribute('data-swapped', 'list horizontal');
    expect(screen.getByRole('tab')).toHaveAttribute('data-swapped', 'selected tab');
    expect(screen.getByRole('tab')).toHaveClass('ui-tabs__tab');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('data-swapped', 'panel');
    expect(screen.getByRole('tablist').parentElement).toHaveAttribute('data-swapped', 'horizontal');
  });
});
