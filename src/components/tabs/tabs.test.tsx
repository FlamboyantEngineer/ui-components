import { InfoGlyph } from '../../core/glyphs.js';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { I18nProvider } from '../../primitives/index.js';
import type { Key } from '../../core/props.js';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Tab, TabList, TabPanel, Tabs, type TabsProps } from './tabs.js';

function Fruit(props: Omit<TabsProps, 'children'> & { listLabel?: string }) {
  const { listLabel = 'Fruit', ...rest } = props;
  return (
    <Tabs {...rest}>
      <TabList aria-label={listLabel}>
        <Tab id="apple">Apple</Tab>
        <Tab id="banana">Banana</Tab>
        <Tab id="cherry">Cherry</Tab>
      </TabList>
      <TabPanel id="apple">Apples are crisp.</TabPanel>
      <TabPanel id="banana">Bananas are soft.</TabPanel>
      <TabPanel id="cherry">Cherries are small.</TabPanel>
    </Tabs>
  );
}

function selected() {
  return screen.getAllByRole('tab').find((tab) => tab.getAttribute('aria-selected') === 'true');
}

beforeAll(() => {
  // jsdom has no Web Animations; React Aria reads running animations before moving the indicator.
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Tabs', () => {
  it('UIC-TABS-1.1 renders a named tab list, tabs and the selected panel', () => {
    const { container } = render(<Fruit />);
    const list = screen.getByRole('tablist', { name: 'Fruit' });
    const tabs = within(list).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Apple', 'Banana', 'Cherry']);
    const apple = screen.getByRole('tab', { name: 'Apple' });
    expect(apple).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Banana' })).toHaveAttribute('aria-selected', 'false');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('Apples are crisp.');
    expect(apple).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAccessibleName('Apple');
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expectHooksMatchSpec(container, 'TABS', {
      slots: ['list', 'tab', 'indicator', 'label', 'panel'],
    });
  });

  it('UIC-TABS-1.1 follows a controlled selection and an uncontrolled default', async () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <Fruit selectedKey="banana" onSelectionChange={onSelectionChange} />,
    );
    expect(selected()).toHaveTextContent('Banana');
    await userEvent.click(screen.getByRole('tab', { name: 'Cherry' }));
    expect(onSelectionChange).toHaveBeenCalledWith('cherry');
    expect(selected()).toHaveTextContent('Banana');
    rerender(<Fruit selectedKey="cherry" onSelectionChange={onSelectionChange} />);
    expect(selected()).toHaveTextContent('Cherry');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Cherries are small.');

    rerender(<Fruit key="uncontrolled" defaultSelectedKey="banana" />);
    expect(selected()).toHaveTextContent('Banana');
    await userEvent.click(screen.getByRole('tab', { name: 'Apple' }));
    expect(selected()).toHaveTextContent('Apple');
  });

  it.each([
    [2.9, '2+'],
    [-1, '5'],
    [Number.NaN, '5'],
    [Number.POSITIVE_INFINITY, '5'],
  ])('UIC-TABS-1.2 normalizes the count cap %s like other library counts', (countMax, shown) => {
    render(
      <Tabs>
        <TabList aria-label="Counted">
          <Tab id="counted" count={5.9} countMax={Number(countMax)}>
            Entries
          </Tab>
        </TabList>
      </Tabs>,
    );
    const tab = screen.getByRole('tab', { name: `Entries ${shown}` });
    expect(tab).toHaveAccessibleDescription('5 items');
    expect(tab.querySelector('.ui-tabs__count')).toHaveTextContent(String(shown));
  });

  it('UIC-TABS-1.2 draws icons, labels and capped counts described with the full count', () => {
    const { container } = render(
      <>
        <p id="mail-hint" hidden>
          older than a year
        </p>
        <Tabs>
          <TabList aria-label="Mail">
            <Tab id="inbox" icon={InfoGlyph} count={15} countMax={9}>
              Inbox
            </Tab>
            <Tab id="sent" icon={<svg className="custom-glyph" />} count={9} countMax={9}>
              Sent
            </Tab>
            <Tab id="drafts" count={3} countLabel="3 unsaved">
              Drafts
            </Tab>
            <Tab id="spam" count={0}>
              Spam
            </Tab>
            <Tab id="archive" count={250} aria-describedby="mail-hint">
              Archive
            </Tab>
          </TabList>
          <TabPanel id="inbox">Inbox panel</TabPanel>
        </Tabs>
      </>,
    );
    const inbox = screen.getByRole('tab', { name: 'Inbox 9+' });
    expect(inbox).toHaveAccessibleDescription('15 items');
    expect(inbox.querySelector('.ui-tabs__count')).toHaveTextContent('9+');
    expect(inbox.querySelector('.ui-tabs__label')).toHaveAttribute('data-label', 'Inbox');
    const icon = inbox.querySelector('.ui-tabs__icon');
    expect(icon).toHaveClass('ui-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.custom-glyph')?.parentElement).toHaveClass('ui-tabs__icon');
    const sent = screen.getByRole('tab', { name: 'Sent 9' });
    expect(sent).toHaveAccessibleDescription('9 items');
    expect(screen.getByRole('tab', { name: 'Drafts 3' })).toHaveAccessibleDescription('3 unsaved');
    const spam = screen.getByRole('tab', { name: 'Spam' });
    expect(spam.querySelector('.ui-tabs__count')).toBeNull();
    expect(spam).not.toHaveAttribute('aria-describedby');
    const archive = screen.getByRole('tab', { name: 'Archive 99+' });
    expect(archive).toHaveAccessibleDescription('older than a year 250 items');
    expectHooksMatchSpec(container, 'TABS', {
      slots: ['list', 'tab', 'indicator', 'icon', 'label', 'count', 'panel'],
    });
  });

  it('UIC-TABS-1.3 puts the selection indicator in the selected tab only', async () => {
    const { container } = render(<Fruit />);
    const apple = screen.getByRole('tab', { name: 'Apple' });
    expect(apple.querySelector('.ui-tabs__indicator')).not.toBeNull();
    expect(container.querySelectorAll('.ui-tabs__indicator')).toHaveLength(1);
    await userEvent.click(screen.getByRole('tab', { name: 'Banana' }));
    await waitFor(() => {
      expect(container.querySelectorAll('.ui-tabs__indicator')).toHaveLength(1);
    });
    expect(
      screen.getByRole('tab', { name: 'Banana' }).querySelector('.ui-tabs__indicator'),
    ).not.toBeNull();
    expectHooksMatchSpec(container, 'TABS', { slots: ['indicator'] });
  });

  it('UIC-TABS-1.4 publishes size and orientation with defaults', () => {
    const { container, rerender } = render(<Fruit />);
    const root = container.querySelector('.ui-tabs') as HTMLElement;
    expect(root).toHaveClass('ui-tabs');
    expect(root).toHaveAttribute('data-size', 'md');
    expect(root).toHaveAttribute('data-orientation', 'horizontal');
    for (const orientation of ['horizontal', 'vertical'] as const) {
      for (const size of ['sm', 'md', 'lg'] as const) {
        rerender(<Fruit size={size} orientation={orientation} />);
        expect(root).toHaveAttribute('data-size', size);
        expect(root).toHaveAttribute('data-orientation', orientation);
        const list = screen.getByRole('tablist');
        expect(list).toHaveAttribute('data-orientation', orientation);
        expect(list).toHaveAttribute('aria-orientation', orientation);
        expectHooksMatchSpec(container, 'TABS');
      }
    }
  });

  it('UIC-TABS-1.5 appends caller classes and forwards ids, refs, data attributes and events', async () => {
    const rootRef = { current: null as HTMLDivElement | null };
    const tabRef = { current: null as HTMLDivElement | null };
    const onContextMenu = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const { container } = render(
      <Tabs className="caller-root" id="fruit" ref={rootRef} data-size="x">
        <TabList aria-label="Fruit" className="caller-list">
          <Tab
            id="apple"
            className="caller-tab"
            ref={tabRef}
            data-section="a"
            onContextMenu={onContextMenu}
          >
            Apple
          </Tab>
        </TabList>
        <TabPanel id="apple" className="caller-panel">
          Apples
        </TabPanel>
      </Tabs>,
    );
    const list = screen.getByRole('tablist', { name: 'Fruit' });
    const root = list.parentElement;
    expect(root).toHaveClass('ui-tabs', 'caller-root');
    expect(root).toHaveAttribute('id', 'fruit');
    expect(root).toHaveAttribute('data-size', 'md');
    expect(rootRef.current).toBe(root);
    expect(list).toHaveClass('ui-tabs__list', 'caller-list');
    const tab = screen.getByRole('tab');
    expect(tab).toHaveClass('ui-tabs__tab', 'caller-tab');
    expect(tab).toHaveAttribute('data-section', 'a');
    expect(tabRef.current).toBe(tab);
    expect(screen.getByRole('tabpanel')).toHaveClass('ui-tabs__panel', 'caller-panel');
    await userEvent.pointer({ keys: '[MouseRight]', target: tab });
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'TABS', { callerAttributes: ['data-section'] });
  });

  it('UIC-TABS-2.1 roves focus with wrapping arrows, Home and End, selecting automatically', async () => {
    render(<Fruit />);
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Apple' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Banana' })).toHaveAttribute('tabindex', '-1');
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Banana' })).toHaveFocus();
    expect(selected()).toHaveTextContent('Banana');
    await userEvent.keyboard('{End}');
    expect(selected()).toHaveTextContent('Cherry');
    await userEvent.keyboard('{ArrowRight}');
    expect(selected()).toHaveTextContent('Apple');
    await userEvent.keyboard('{ArrowLeft}');
    expect(selected()).toHaveTextContent('Cherry');
    await userEvent.keyboard('{Home}');
    expect(selected()).toHaveTextContent('Apple');
  });

  it('UIC-TABS-2.1 uses vertical arrows, mirrors in right-to-left and supports manual activation', async () => {
    const { unmount } = render(<Fruit orientation="vertical" />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    expect(selected()).toHaveTextContent('Banana');
    await userEvent.keyboard('{ArrowUp}');
    expect(selected()).toHaveTextContent('Apple');
    unmount();

    const { unmount: unmountRtl } = render(
      <I18nProvider locale="he-IL">
        <Fruit />
      </I18nProvider>,
    );
    await userEvent.tab();
    await userEvent.keyboard('{ArrowLeft}');
    expect(selected()).toHaveTextContent('Banana');
    unmountRtl();

    render(<Fruit keyboardActivation="manual" />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Banana' })).toHaveFocus();
    expect(selected()).toHaveTextContent('Apple');
    await userEvent.keyboard(' ');
    expect(selected()).toHaveTextContent('Banana');
  });

  it('UIC-TABS-2.2 skips and refuses disabled tabs, or disables every tab', async () => {
    const onSelectionChange = vi.fn();
    const { container, rerender } = render(
      <Tabs onSelectionChange={onSelectionChange}>
        <TabList aria-label="Fruit">
          <Tab id="apple">Apple</Tab>
          <Tab id="banana" isDisabled>
            Banana
          </Tab>
          <Tab id="cherry">Cherry</Tab>
        </TabList>
        <TabPanel id="apple">Apples</TabPanel>
        <TabPanel id="cherry">Cherries</TabPanel>
      </Tabs>,
    );
    onSelectionChange.mockClear();
    const banana = screen.getByRole('tab', { name: 'Banana' });
    expect(banana).toHaveAttribute('aria-disabled', 'true');
    expect(banana).toHaveAttribute('data-disabled', 'true');
    await userEvent.click(banana);
    expect(onSelectionChange).not.toHaveBeenCalled();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(selected()).toHaveTextContent('Cherry');
    expect(onSelectionChange).toHaveBeenCalledWith('cherry');
    expectHooksMatchSpec(container, 'TABS');

    rerender(<Fruit isDisabled />);
    expect(container.querySelector('.ui-tabs')).toHaveAttribute('data-disabled', 'true');
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab).toHaveAttribute('aria-disabled', 'true');
    }
    expectHooksMatchSpec(container, 'TABS');
  });

  it('UIC-TABS-2.3 renders link tabs that navigate through the provider router', async () => {
    const navigate = vi.fn();
    render(
      <UiProvider navigate={navigate}>
        <Tabs selectedKey="overview">
          <TabList aria-label="Sections">
            <Tab id="overview" href="/overview">
              Overview
            </Tab>
            <Tab id="settings" href="/settings">
              Settings
            </Tab>
          </TabList>
          <TabPanel id="overview">Overview panel</TabPanel>
        </Tabs>
      </UiProvider>,
    );
    const settings = screen.getByRole('tab', { name: 'Settings' });
    expect(settings.tagName).toBe('A');
    expect(settings).toHaveAttribute('href', '/settings');
    await userEvent.click(settings);
    expect(navigate).toHaveBeenCalledWith('/settings', undefined);
  });

  it('UIC-TABS-2.4 marks an overflowing list and scrolls the selected tab toward its middle', async () => {
    const scrollTo = vi.fn();
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
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const boxes: Record<string, [number, number]> = {
        Apple: [0, 150],
        Banana: [150, 150],
        Cherry: [300, 300],
      };
      if (this.getAttribute('role') === 'tablist') return new DOMRect(0, 0, 200, 30);
      const [left, width] = boxes[this.textContent ?? ''] ?? [0, 0];
      return new DOMRect(left - (this.parentElement?.scrollLeft ?? 0), 0, width, 30);
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    try {
      const { container } = render(<Fruit defaultSelectedKey="banana" />);
      const list = screen.getByRole('tablist');
      expect(list).toHaveAttribute('data-overflowing', 'true');
      // Banana's middle (225) minus the list's middle (100).
      await waitFor(() =>
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 125, behavior: 'smooth' }),
      );
      expectHooksMatchSpec(container, 'TABS');

      await userEvent.click(screen.getByRole('tab', { name: 'Cherry' }));
      // Cherry's middle (450) would need 350 of scroll; the range (500 - 200) stops it at 300.
      await waitFor(() =>
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: 'smooth' }),
      );
      await userEvent.click(screen.getByRole('tab', { name: 'Apple' }));
      await waitFor(() =>
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'smooth' }),
      );

      vi.stubGlobal(
        'matchMedia',
        (query: string) => ({ matches: query.includes('reduce') }) as MediaQueryList,
      );
      await userEvent.click(screen.getByRole('tab', { name: 'Banana' }));
      await waitFor(() =>
        expect(scrollTo).toHaveBeenLastCalledWith({ left: 125, behavior: 'auto' }),
      );
    } finally {
      vi.unstubAllGlobals();
      delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
    }
  });

  it('UIC-TABS-2.4 leaves a list that fits unmarked and unscrolled', async () => {
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    try {
      render(<Fruit defaultSelectedKey="cherry" />);
      expect(screen.getByRole('tablist')).not.toHaveAttribute('data-overflowing');
      await new Promise((resolve) => requestAnimationFrame(resolve));
      expect(scrollTo).not.toHaveBeenCalled();
    } finally {
      delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
    }
  });

  it('UIC-TABS-2.5 publishes hover, press and focus states on tabs, root and panels', async () => {
    function Forced() {
      const [key, setKey] = useState<Key>('apple');
      return (
        <Tabs selectedKey={key} onSelectionChange={setKey}>
          <TabList aria-label="Fruit">
            <Tab id="apple">Apple</Tab>
            <Tab id="banana">Banana</Tab>
          </TabList>
          <TabPanel id="apple">Apples</TabPanel>
          <TabPanel id="banana" shouldForceMount>
            Bananas
          </TabPanel>
        </Tabs>
      );
    }
    const view = render(<Forced />);
    let container = view.container;
    const hidden = container.querySelector('.ui-tabs__panel[data-inert]');
    expect(hidden).toHaveTextContent('Bananas');
    expect(hidden).toHaveAttribute('inert');
    const banana = screen.getByRole('tab', { name: 'Banana' });
    await userEvent.hover(banana);
    expect(banana).toHaveAttribute('data-hovered', 'true');
    await userEvent.pointer({ keys: '[MouseLeft>]', target: banana });
    expect(banana).toHaveAttribute('data-pressed', 'true');
    expectHooksMatchSpec(container, 'TABS');
    await userEvent.pointer({ keys: '[/MouseLeft]', target: banana });
    await userEvent.unhover(banana);
    view.unmount();

    // A fresh render keeps the pointer sequence above from moving focus during the keyboard checks.
    container = render(<Forced />).container;
    await userEvent.tab();
    const focused = document.activeElement as HTMLElement;
    expect(focused).toHaveAttribute('role', 'tab');
    expect(focused).toHaveAttribute('data-focus-visible', 'true');
    expect(focused).toHaveAttribute('data-focused', 'true');
    const root = container.querySelector('.ui-tabs') as HTMLElement;
    expect(root).toHaveAttribute('data-focused', 'true');
    expect(root).toHaveAttribute('data-focus-visible', 'true');
    expect(focused).toHaveAttribute('data-selected', 'true');
    await userEvent.tab();
    const panel = screen.getAllByRole('tabpanel').find((element) => !element.hasAttribute('inert'));
    expect(panel).toHaveAttribute('data-focus-visible', 'true');
    expectHooksMatchSpec(container, 'TABS');
  });
});

describe('Tabs remembered selection', () => {
  it('UIC-TABS-3.7 stores the selection and restores it when the tabs mount again', async () => {
    const storage = createMemoryStorage();
    const onSelectionChange = vi.fn();
    const { unmount } = render(
      <UiProvider storage={storage}>
        <Fruit
          persistKey="fruit-tab"
          defaultSelectedKey="banana"
          onSelectionChange={onSelectionChange}
        />
      </UiProvider>,
    );
    expect(selected()).toHaveTextContent('Banana');
    await userEvent.click(screen.getByRole('tab', { name: 'Cherry' }));
    expect(storage.getItem('fruit-tab')).toBe('"cherry"');
    expect(onSelectionChange).toHaveBeenLastCalledWith('cherry');
    unmount();
    render(
      <UiProvider storage={storage}>
        <Fruit persistKey="fruit-tab" defaultSelectedKey="banana" />
      </UiProvider>,
    );
    expect(selected()).toHaveTextContent('Cherry');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Cherries are small.');
  });

  it('UIC-TABS-3.7 falls back on an unreadable value and replaces a key no tab has', () => {
    const storage = createMemoryStorage({ broken: '{', stale: '"kiwi"', numbered: '[1]' });
    const { unmount } = render(
      <UiProvider storage={storage}>
        <Fruit persistKey="broken" defaultSelectedKey="cherry" />
        <Fruit persistKey="numbered" defaultSelectedKey="banana" listLabel="Numbered" />
      </UiProvider>,
    );
    const lists = screen.getAllByRole('tablist');
    expect(within(lists[0] as HTMLElement).getByRole('tab', { selected: true })).toHaveTextContent(
      'Cherry',
    );
    expect(within(lists[1] as HTMLElement).getByRole('tab', { selected: true })).toHaveTextContent(
      'Banana',
    );
    unmount();
    render(
      <UiProvider storage={storage}>
        <Fruit persistKey="stale" />
      </UiProvider>,
    );
    expect(selected()).toHaveTextContent('Apple');
    expect(storage.getItem('stale')).toBe('"apple"');
  });

  it('UIC-TABS-3.7 restores another key and never stores a controlled selection', async () => {
    const storage = createMemoryStorage({ first: '"banana"', second: '"cherry"' });
    const { rerender } = render(
      <UiProvider storage={storage}>
        <Fruit persistKey="first" />
      </UiProvider>,
    );
    expect(selected()).toHaveTextContent('Banana');
    rerender(
      <UiProvider storage={storage}>
        <Fruit persistKey="second" />
      </UiProvider>,
    );
    expect(selected()).toHaveTextContent('Cherry');
    rerender(
      <UiProvider storage={storage}>
        <Fruit persistKey="second" selectedKey="apple" />
      </UiProvider>,
    );
    expect(selected()).toHaveTextContent('Apple');
    await userEvent.click(screen.getByRole('tab', { name: 'Banana' }));
    expect(storage.getItem('second')).toBe('"cherry"');
  });
});
