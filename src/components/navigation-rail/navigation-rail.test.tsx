import {
  CalendarGlyph,
  FolderGlyph,
  HelpGlyph,
  InfoGlyph,
  UsersGlyph,
  WarningGlyph,
} from '../../core/glyphs.js';
import { act, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { createMemoryStorage } from '../../core/storage.js';
import { NavigationRail, type NavigationRailProps } from './navigation-rail.js';
import {
  NavigationRailGroup,
  NavigationRailItem,
  NavigationRailSection,
} from './navigation-rail-items.js';

function Rail(props: Partial<NavigationRailProps> & { current?: string }) {
  const { current = 'inbox', ...rest } = props;
  return (
    <NavigationRail aria-label="Main navigation" header={<span>Orchard</span>} {...rest}>
      <NavigationRailSection title="Pinned">
        <NavigationRailItem label="Harvest plan" href="/plan" icon={CalendarGlyph} />
      </NavigationRailSection>
      <NavigationRailSection title="Workspace">
        <NavigationRailItem
          label="Inbox"
          href="/inbox"
          icon={InfoGlyph}
          count={4}
          countLabel="4 unread"
          isCurrent={current === 'inbox'}
        />
        <NavigationRailItem label="Team" href="/team" icon={UsersGlyph} count={0} />
        <NavigationRailGroup label="Fields" icon={FolderGlyph}>
          <NavigationRailItem label="North field" href="/north" isCurrent={current === 'north'} />
          <NavigationRailItem label="South field" href="/south" />
        </NavigationRailGroup>
      </NavigationRailSection>
    </NavigationRail>
  );
}

const nav = () => screen.getByRole('navigation', { name: 'Main navigation' });
const toggle = (name = 'Collapse navigation') => screen.getByRole('button', { name });

describe('NavigationRail', () => {
  it('UIC-NAVIGATION-RAIL-1.1 UIC-NAVIGATION-RAIL-3.1 renders a named navigation of header, body and footer', () => {
    const { container } = render(<Rail footer={<span>Maria</span>} />);
    const rail = nav();
    expect(rail.tagName).toBe('NAV');
    expect(rail).toHaveClass('ui-navigation-rail');
    expect([...rail.children].map((node) => node.className).filter(Boolean)).toEqual([
      'ui-navigation-rail__header',
      'ui-navigation-rail__body',
      'ui-navigation-rail__footer',
    ]);
    expect(rail.querySelector('.ui-navigation-rail__header')).toHaveTextContent('Orchard');
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expectHooksMatchSpec(container, 'NAVIGATION-RAIL', {
      slots: ['header', 'toggle', 'body', 'footer', 'section', 'list', 'item', 'link', 'group'],
    });
  });

  it('UIC-NAVIGATION-RAIL-1.1 leaves out an empty footer', () => {
    render(<Rail />);
    expect(nav().querySelector('.ui-navigation-rail__footer')).toBeNull();
  });

  it('UIC-NAVIGATION-RAIL-1.2 collapses and expands from the toggle, which keeps focus', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const { container } = render(<Rail onCollapsedChange={onCollapsedChange} />);
    const button = toggle();
    const body = nav().querySelector('.ui-navigation-rail__body');
    expect(button).toHaveClass('ui-navigation-rail__toggle', 'ui-button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', body?.id);
    expect(button.querySelector('[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'chevron-double-left',
    );
    expect(nav()).not.toHaveAttribute('data-collapsed');
    await user.click(button);
    expect(nav()).toHaveAttribute('data-collapsed', 'true');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(toggle('Expand navigation')).toBe(button);
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button.querySelector('[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'chevron-double-right',
    );
    expectHooksMatchSpec(container, 'NAVIGATION-RAIL');
    await user.keyboard('{Enter}');
    expect(nav()).not.toHaveAttribute('data-collapsed');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
  });

  it('UIC-NAVIGATION-RAIL-1.2 follows a controlled state and points the glyphs right to left', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    render(
      <UiProvider locale="ar-EG">
        <Rail isCollapsed onCollapsedChange={onCollapsedChange} />
      </UiProvider>,
    );
    const button = toggle('Expand navigation');
    expect(button.querySelector('[data-glyph]')).toHaveAttribute(
      'data-glyph',
      'chevron-double-left',
    );
    await user.click(button);
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(nav()).toHaveAttribute('data-collapsed', 'true');
  });

  it('UIC-NAVIGATION-RAIL-1.3 resizes by keyboard within bounds and reports the end', async () => {
    const user = userEvent.setup();
    const onWidthChange = vi.fn();
    const { container } = render(
      <Rail isResizable defaultWidth={200} onWidthChange={onWidthChange} maxWidth={320} />,
    );
    const rail = nav();
    expect(rail).toHaveAttribute('data-resizable', 'true');
    expect(rail.style.getPropertyValue('--ui-navigation-rail-width')).toBe('200px');
    const handle = screen.getByRole('separator', { name: 'Resize navigation' });
    expect(handle).toHaveClass('ui-navigation-rail__resize-handle', 'ui-resize-handle');
    expect(handle).toHaveAttribute('aria-valuemin', '180');
    expect(handle).toHaveAttribute('aria-valuemax', '320');
    act(() => handle.focus());
    await user.keyboard('{ArrowRight}');
    expect(onWidthChange).toHaveBeenLastCalledWith(216);
    expect(rail.style.getPropertyValue('--ui-navigation-rail-width')).toBe('216px');
    await user.keyboard('{End}');
    expect(onWidthChange).toHaveBeenLastCalledWith(320);
    await user.keyboard('{Home}');
    expect(onWidthChange).toHaveBeenLastCalledWith(180);
    expectHooksMatchSpec(container, 'NAVIGATION-RAIL', { slots: ['resize-handle'] });
    await user.click(toggle());
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('UIC-NAVIGATION-RAIL-1.3 drags the width live and commits it when the drag ends', async () => {
    const user = userEvent.setup();
    const onWidthChange = vi.fn();
    render(<Rail isResizable onWidthChange={onWidthChange} />);
    const rail = nav();
    const handle = screen.getByRole('separator');
    await user.pointer([
      { keys: '[MouseLeft>]', target: handle, coords: { clientX: 240 } },
      { coords: { clientX: 300 } },
    ]);
    expect(rail).toHaveAttribute('data-resizing', 'true');
    expect(rail.style.getPropertyValue('--ui-navigation-rail-width')).toBe('300px');
    expect(onWidthChange).not.toHaveBeenCalled();
    await user.pointer({ keys: '[/MouseLeft]' });
    expect(onWidthChange).toHaveBeenCalledWith(300);
    expect(rail).not.toHaveAttribute('data-resizing');
    expect(rail.style.getPropertyValue('--ui-navigation-rail-width')).toBe('300px');
  });

  it('UIC-NAVIGATION-RAIL-1.3 draws a width outside the bounds at the nearest bound', () => {
    render(<Rail isResizable width={900} />);
    expect(nav().style.getPropertyValue('--ui-navigation-rail-width')).toBe('400px');
  });

  it('UIC-NAVIGATION-RAIL-1.3 sets no width without isResizable', () => {
    render(<Rail />);
    expect(nav()).not.toHaveAttribute('style');
    expect(nav()).not.toHaveAttribute('data-resizable');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('UIC-NAVIGATION-RAIL-1.4 restores and saves the collapsed state and width', async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({ 'rail:collapsed': 'true', 'rail:width': '260' });
    const { unmount } = render(
      <UiProvider storage={storage}>
        <Rail persistKey="rail" isResizable />
      </UiProvider>,
    );
    expect(nav()).toHaveAttribute('data-collapsed', 'true');
    await user.click(toggle('Expand navigation'));
    expect(storage.getItem('rail:collapsed')).toBe('false');
    expect(nav().style.getPropertyValue('--ui-navigation-rail-width')).toBe('260px');
    act(() => screen.getByRole('separator').focus());
    await user.keyboard('{ArrowLeft}');
    expect(storage.getItem('rail:width')).toBe('240');
    unmount();
    storage.setItem('rail:width', 'wide');
    render(
      <UiProvider storage={storage}>
        <Rail persistKey="rail" isResizable width={300} isCollapsed={false} />
      </UiProvider>,
    );
    expect(nav().style.getPropertyValue('--ui-navigation-rail-width')).toBe('300px');
  });

  it('UIC-NAVIGATION-RAIL-1.4 falls back to the default for an unreadable value', () => {
    const storage = createMemoryStorage({ 'rail:width': 'wide' });
    render(
      <UiProvider storage={storage}>
        <Rail persistKey="rail" isResizable defaultWidth={220} />
      </UiProvider>,
    );
    expect(nav().style.getPropertyValue('--ui-navigation-rail-width')).toBe('220px');
  });

  it('UIC-NAVIGATION-RAIL-1.4 falls back to the default for stored values of the wrong type', () => {
    const storage = createMemoryStorage({ 'rail:width': '"wide"', 'rail:collapsed': '"no"' });
    render(
      <UiProvider storage={storage}>
        <Rail persistKey="rail" isResizable defaultWidth={240} />
      </UiProvider>,
    );
    expect(nav().style.getPropertyValue('--ui-navigation-rail-width')).toBe('240px');
    expect(nav()).not.toHaveAttribute('data-collapsed');
  });

  it('UIC-NAVIGATION-RAIL-1.5 moves focus with arrows, Home and End, skipping closed groups', async () => {
    const user = userEvent.setup();
    render(<Rail />);
    const plan = screen.getByRole('link', { name: 'Harvest plan' });
    act(() => plan.focus());
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('link', { name: 'Inbox 4' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Fields' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('link', { name: 'Team' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(plan).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Fields' }));
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('link', { name: 'North field' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'South field' })).toHaveFocus();
  });

  it('UIC-NAVIGATION-RAIL-1.5 leaves the caret keys to a field in a section', async () => {
    const user = userEvent.setup();
    render(
      <NavigationRail aria-label="Main navigation">
        <NavigationRailSection title="Pinned">
          <li>
            <input aria-label="Filter" />
          </li>
          <NavigationRailItem label="Harvest plan" href="/plan" />
        </NavigationRailSection>
      </NavigationRail>,
    );
    const filter = screen.getByRole<HTMLInputElement>('textbox', { name: 'Filter' });
    await user.click(filter);
    await user.keyboard('plan{Home}');
    expect(filter).toHaveFocus();
    expect(filter.selectionStart).toBe(0);
    await user.keyboard('{End}{ArrowDown}');
    expect(filter).toHaveFocus();
    expect(filter.selectionStart).toBe(4);
  });

  it('UIC-NAVIGATION-RAIL-2.1 names each list by its section title', async () => {
    const user = userEvent.setup();
    render(
      <NavigationRail aria-label="Main navigation">
        <NavigationRailSection title="Pinned">
          <NavigationRailItem label="Plan" href="/plan" icon={CalendarGlyph} />
        </NavigationRailSection>
        <NavigationRailSection>
          <NavigationRailItem label="Help" href="/help" icon={HelpGlyph} />
        </NavigationRailSection>
      </NavigationRail>,
    );
    const pinned = screen.getByRole('list', { name: 'Pinned' });
    expect(pinned).toHaveClass('ui-navigation-rail__list');
    expect(pinned.parentElement).toHaveClass('ui-navigation-rail__section');
    const title = screen.getByText('Pinned');
    expect(title).toHaveClass('ui-navigation-rail__section-title');
    const unnamed = screen.getAllByRole('list').at(-1);
    expect(unnamed).not.toHaveAttribute('aria-labelledby');
    await user.click(toggle());
    expect(screen.getByText('Pinned')).toHaveClass('ui-visually-hidden');
    expect(screen.getByRole('list', { name: 'Pinned' })).toBeInTheDocument();
  });

  it('UIC-NAVIGATION-RAIL-2.2 draws links through the provider and marks the current page', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const renderLink = vi.fn((props: { href: string }) => <a {...props} data-routed="true" />);
    const { container } = render(
      <UiProvider renderLink={renderLink}>
        <NavigationRail aria-label="Main navigation">
          <NavigationRailSection>
            <NavigationRailItem label="Inbox" href="/inbox" icon={InfoGlyph} isCurrent />
            <NavigationRailItem label="Refresh" onPress={onPress} />
          </NavigationRailSection>
        </NavigationRail>
      </UiProvider>,
    );
    const inbox = screen.getByRole('link', { name: 'Inbox' });
    expect(inbox).toHaveAttribute('data-routed', 'true');
    expect(inbox).toHaveAttribute('href', '/inbox');
    expect(inbox).toHaveClass('ui-navigation-rail__link', 'ui-link');
    expect(inbox).toHaveAttribute('data-variant', 'secondary');
    expect(inbox).toHaveAttribute('data-underline', 'none');
    expect(inbox).toHaveAttribute('aria-current', 'page');
    expect(inbox.closest('li')).toHaveClass('ui-navigation-rail__item');
    expect(inbox.closest('li')).toHaveAttribute('data-current', 'true');
    expect(inbox.querySelector('.ui-navigation-rail__icon')).toHaveClass('ui-icon');
    expect(inbox.querySelector('.ui-navigation-rail__label')).toHaveTextContent('Inbox');
    const refresh = screen.getByRole('link', { name: 'Refresh' });
    expect(refresh).not.toHaveAttribute('aria-current');
    expect(refresh.closest('li')).not.toHaveAttribute('data-current');
    await user.click(refresh);
    expect(onPress).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'NAVIGATION-RAIL', {
      slots: ['icon', 'label'],
      callerAttributes: ['data-routed'],
    });
  });

  it('UIC-NAVIGATION-RAIL-2.3 shows positive counts, capped, in the name and describes the full count', async () => {
    const user = userEvent.setup();
    render(
      <NavigationRail aria-label="Main navigation">
        <NavigationRailSection>
          <NavigationRailItem label="Inbox" href="/inbox" icon={InfoGlyph} count={4} />
          <NavigationRailItem
            label="Alerts"
            href="/alerts"
            icon={WarningGlyph}
            count={250}
            countLabel="250 new"
          />
          <NavigationRailItem label="Team" href="/team" icon={UsersGlyph} count={-2} />
        </NavigationRailSection>
      </NavigationRail>,
    );
    const inbox = screen.getByRole('link', { name: 'Inbox 4' });
    expect(inbox).toHaveAccessibleDescription('4 items');
    const count = inbox.querySelector('.ui-navigation-rail__count');
    expect(count).toHaveClass('ui-badge');
    expect(count).toHaveAttribute('data-placement', 'inline');
    const alerts = screen.getByRole('link', { name: 'Alerts 99+' });
    expect(alerts).toHaveAccessibleDescription('250 new');
    const team = screen.getByRole('link', { name: 'Team' });
    expect(team.querySelector('.ui-badge')).toBeNull();
    expect(team).not.toHaveAttribute('aria-describedby');
    await user.click(toggle());
    expect(
      screen.getByRole('link', { name: 'Inbox 4' }).querySelector('.ui-badge'),
    ).toHaveAttribute('data-placement', 'overlay');
  });

  it('UIC-NAVIGATION-RAIL-2.4 hides labels in a collapsed rail and shows them as tooltips', async () => {
    const user = userEvent.setup();
    const { container } = render(<Rail defaultCollapsed />);
    const plan = screen.getByRole('link', { name: 'Harvest plan' });
    expect(plan.querySelector('.ui-navigation-rail__label')).toHaveClass('ui-visually-hidden');
    await user.hover(plan);
    const tooltip = await screen.findByRole('tooltip', {}, { timeout: 2000 });
    expect(tooltip).toHaveTextContent('Harvest plan');
    expect(plan).not.toHaveAttribute('aria-describedby');
    await user.unhover(plan);
    expectHooksMatchSpec(container, 'NAVIGATION-RAIL');
  });

  it('UIC-NAVIGATION-RAIL-2.4 shows initials for an item without an icon while collapsed', async () => {
    const user = userEvent.setup();
    render(
      <NavigationRail aria-label="Main navigation">
        <NavigationRailSection>
          <NavigationRailItem label="Orchard map" href="/map" />
        </NavigationRailSection>
      </NavigationRail>,
    );
    const link = screen.getByRole('link', { name: 'Orchard map' });
    expect(link.querySelector('.ui-navigation-rail__monogram')).toBeNull();
    await user.click(toggle());
    const monogram = link.querySelector('.ui-navigation-rail__monogram');
    expect(monogram).toHaveTextContent('OM');
    expect(monogram).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('link', { name: 'Orchard map' })).toBe(link);
  });

  it('UIC-NAVIGATION-RAIL-2.4 opens no tooltip while expanded', async () => {
    const user = userEvent.setup();
    render(<Rail />);
    await user.hover(screen.getByRole('link', { name: 'Harvest plan' }));
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('UIC-NAVIGATION-RAIL-2.5 opens and closes a group under its button', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { container } = render(
      <NavigationRail aria-label="Main navigation">
        <NavigationRailSection>
          <NavigationRailGroup
            label="Fields"
            icon={FolderGlyph}
            onExpandedChange={onExpandedChange}
          >
            <NavigationRailItem label="North field" href="/north" />
          </NavigationRailGroup>
        </NavigationRailSection>
      </NavigationRail>,
    );
    const trigger = screen.getByRole('button', { name: 'Fields' });
    const group = trigger.closest('.ui-navigation-rail__group');
    expect(trigger).toHaveClass('ui-navigation-rail__group-trigger');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.querySelector('.ui-navigation-rail__indicator')).toHaveAttribute(
      'data-glyph',
      'chevron-right',
    );
    expect(screen.queryByRole('link', { name: 'North field' })).not.toBeInTheDocument();
    await user.click(trigger);
    expect(group).toHaveAttribute('data-expanded', 'true');
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    const panel = screen.getByRole('group', { name: 'Fields' });
    expect(panel).toHaveClass('ui-navigation-rail__group-panel');
    expect(within(panel).getByRole('link', { name: 'North field' })).toBeInTheDocument();
    expect(trigger.querySelector('.ui-navigation-rail__indicator')).toHaveAttribute(
      'data-glyph',
      'chevron-down',
    );
    expectHooksMatchSpec(container, 'NAVIGATION-RAIL', {
      slots: ['group', 'group-trigger', 'indicator', 'group-panel'],
    });
  });

  it('UIC-NAVIGATION-RAIL-2.5 marks and opens groups holding the current page, nested too', async () => {
    const user = userEvent.setup();
    function Page() {
      const [current, setCurrent] = useState('none');
      return (
        <>
          <button type="button" onClick={() => setCurrent('pears')}>
            Go to pears
          </button>
          <NavigationRail aria-label="Main navigation">
            <NavigationRailSection>
              <NavigationRailGroup label="Orchard">
                <NavigationRailGroup label="Fruit">
                  <NavigationRailItem label="Pears" href="/pears" isCurrent={current === 'pears'} />
                </NavigationRailGroup>
              </NavigationRailGroup>
              <NavigationRailGroup label="Barn" isExpanded={false}>
                <NavigationRailItem label="Tools" href="/tools" />
              </NavigationRailGroup>
            </NavigationRailSection>
          </NavigationRail>
        </>
      );
    }
    render(<Page />);
    const orchard = screen.getByRole('button', { name: 'Orchard' });
    expect(orchard.closest('li')).not.toHaveAttribute('data-current');
    await user.click(screen.getByRole('button', { name: 'Go to pears' }));
    expect(orchard.closest('li')).toHaveAttribute('data-current', 'true');
    expect(screen.getByRole('button', { name: 'Fruit' }).closest('li')).toHaveAttribute(
      'data-current',
      'true',
    );
    expect(orchard).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Pears' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Barn' }).closest('li')).not.toHaveAttribute(
      'data-current',
    );
  });

  it('UIC-NAVIGATION-RAIL-2.5 follows a controlled group', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <NavigationRail aria-label="Main navigation">
        <NavigationRailSection>
          <NavigationRailGroup label="Fields" isExpanded onExpandedChange={onExpandedChange}>
            <NavigationRailItem label="North field" href="/north" />
          </NavigationRailGroup>
        </NavigationRailSection>
      </NavigationRail>,
    );
    await user.click(screen.getByRole('button', { name: 'Fields' }));
    expect(onExpandedChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('link', { name: 'North field' })).toBeInTheDocument();
  });

  it('UIC-NAVIGATION-RAIL-2.6 keeps groups closed in a collapsed rail and expands both on press', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    render(<Rail defaultCollapsed current="north" onCollapsedChange={onCollapsedChange} />);
    const trigger = screen.getByRole('button', { name: 'Fields' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.closest('li')).toHaveAttribute('data-current', 'true');
    expect(trigger.querySelector('.ui-navigation-rail__label')).toHaveClass('ui-visually-hidden');
    await user.hover(trigger);
    expect(await screen.findByRole('tooltip', {}, { timeout: 2000 })).toHaveTextContent('Fields');
    expect(trigger).toHaveAccessibleDescription('');
    await user.click(trigger);
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(nav()).not.toHaveAttribute('data-collapsed');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'North field' })).toBeInTheDocument();
  });

  it('UIC-NAVIGATION-RAIL-2.6 UIC-COMPOSITION-5.1 reports no change for an open group pressed in a collapsed rail', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <NavigationRail aria-label="Main navigation" defaultCollapsed>
        <NavigationRailSection>
          <NavigationRailGroup label="Fields" isExpanded onExpandedChange={onExpandedChange}>
            <NavigationRailItem label="North field" href="/north" />
          </NavigationRailGroup>
        </NavigationRailSection>
      </NavigationRail>,
    );
    await user.click(screen.getByRole('button', { name: 'Fields' }));
    expect(nav()).not.toHaveAttribute('data-collapsed');
    expect(onExpandedChange).not.toHaveBeenCalled();
  });

  it('UIC-NAVIGATION-RAIL-3.2 forwards classes, ids and data attributes', () => {
    const { container } = render(
      <NavigationRail aria-label="Main navigation" className="extra" id="rail" data-app="notes">
        <NavigationRailSection className="pinned" data-section="pinned">
          <NavigationRailItem label="Plan" href="/plan" className="plan" data-item="plan" />
          <NavigationRailGroup label="Fields" className="fields" data-group="fields" />
        </NavigationRailSection>
      </NavigationRail>,
    );
    const rail = nav();
    expect(rail).toHaveClass('ui-navigation-rail', 'extra');
    expect(rail).toHaveAttribute('id', 'rail');
    expect(rail).toHaveAttribute('data-app', 'notes');
    expect(container.querySelector('[data-section="pinned"]')).toHaveClass(
      'ui-navigation-rail__section',
      'pinned',
    );
    expect(container.querySelector('[data-item="plan"]')).toHaveClass(
      'ui-navigation-rail__item',
      'plan',
    );
    expect(container.querySelector('[data-group="fields"]')).toHaveClass(
      'ui-navigation-rail__item',
      'fields',
    );
    expectHooksMatchSpec(container, 'NAVIGATION-RAIL', {
      callerAttributes: ['data-app', 'data-section', 'data-item', 'data-group'],
    });
  });
});
