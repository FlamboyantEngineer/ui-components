import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Key } from '../../core/props.js';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { ViewSwitcher, type ViewSwitcherView } from './view-switcher.js';

const views: ViewSwitcherView[] = [
  { id: 'all', label: 'All recipes', icon: 'folder' },
  { id: 'quick', label: 'Quick meals' },
  { id: 'baking', label: 'Baking' },
];

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

const tabs = () => screen.getAllByRole('tab');
const actionsButton = (name: string) => screen.getByRole('button', { name: `Actions for ${name}` });

async function chooseAction(name: string, action: string) {
  await userEvent.click(await screen.findByRole('button', { name: `Actions for ${name}` }));
  await userEvent.click(screen.getByRole('menuitem', { name: action }));
}

describe('ViewSwitcher', { timeout: 20_000 }, () => {
  it('UIC-VIEW-SWITCHER-1.1 UIC-VIEW-SWITCHER-1.9 lists the views as tabs with the content in a panel', () => {
    const { container } = render(
      <ViewSwitcher views={views} className="extra" id="views" data-lab="views">
        <p>Rows</p>
      </ViewSwitcher>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveClass('ui-view-switcher', 'extra');
    expect(root).toHaveAttribute('id', 'views');
    expect(root).toHaveAttribute('data-lab', 'views');
    expect(root).toHaveAttribute('data-variant', 'tabs');
    const list = screen.getByRole('tablist', { name: 'Views' });
    expect(list).toHaveClass('ui-tabs__list', 'ui-view-switcher__tabs');
    expect(tabs().map((tab) => tab.textContent)).toEqual(['All recipes', 'Quick meals', 'Baking']);
    expect(tabs()[0]).toHaveClass('ui-view-switcher__tab');
    expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs()[0]!.querySelector('[data-glyph="folder"]')).not.toBeNull();
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveClass('ui-view-switcher__panel');
    expect(panel).toHaveTextContent('Rows');
    expect(tabs()[0]).toHaveAttribute('aria-controls', panel.id);
    expectHooksMatchSpec(container, 'VIEW-SWITCHER', {
      slots: ['bar', 'tabs', 'tab', 'label', 'panel'],
      callerAttributes: ['data-lab'],
    });
  });

  it('UIC-VIEW-SWITCHER-1.2 selects a view, controlled or not', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn<(key: Key) => void>();
    const { rerender } = render(
      <ViewSwitcher views={views} defaultViewKey="quick" onSelectionChange={onSelectionChange} />,
    );
    expect(tabs()[1]).toHaveAttribute('aria-selected', 'true');
    await user.click(tabs()[2]!);
    expect(onSelectionChange).toHaveBeenLastCalledWith('baking');
    expect(tabs()[2]).toHaveAttribute('aria-selected', 'true');
    rerender(
      <ViewSwitcher views={views} selectedKey="all" onSelectionChange={onSelectionChange} />,
    );
    expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
    await user.click(tabs()[1]!);
    expect(onSelectionChange).toHaveBeenLastCalledWith('quick');
    expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-VIEW-SWITCHER-1.3 marks the default view and a modified selected view', () => {
    const { container } = render(
      <ViewSwitcher views={views} defaultViewKey="all" selectedKey="quick" isDirty />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-dirty', 'true');
    expect(
      tabs()[0]!.querySelector('.ui-view-switcher__default [data-glyph="star"]'),
    ).not.toBeNull();
    expect(tabs()[0]).toHaveAccessibleName('All recipes Default view');
    expect(tabs()[1]).toHaveAccessibleName('Quick meals Modified');
    expect(tabs()[0]!.querySelector('.ui-view-switcher__modified')).toBeNull();
    expectHooksMatchSpec(container, 'VIEW-SWITCHER', { slots: ['default', 'modified'] });
  });

  it('UIC-VIEW-SWITCHER-1.4 saves and resets a modified view', async () => {
    const onSave = vi.fn();
    const onReset = vi.fn();
    const { rerender } = render(
      <ViewSwitcher views={views} onSave={onSave} onReset={onReset} onSaveAs={() => {}} />,
    );
    await userEvent.click(actionsButton('All recipes'));
    expect(screen.queryByRole('menuitem', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Reset changes' })).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    rerender(
      <ViewSwitcher views={views} onSave={onSave} onReset={onReset} onSaveAs={() => {}} isDirty />,
    );
    await chooseAction('All recipes', 'Save');
    expect(onSave).toHaveBeenCalledWith('all');
    await chooseAction('All recipes', 'Reset changes');
    expect(onReset).toHaveBeenCalledWith('all');
  });

  it('UIC-VIEW-SWITCHER-1.5 saves the settings as a new named view', async () => {
    const save = deferred();
    const onSaveAs = vi.fn(() => save.promise);
    render(<ViewSwitcher views={views} onSaveAs={onSaveAs} />);
    await chooseAction('All recipes', 'Save as new view');
    const dialog = screen.getByRole('dialog', { name: 'New view' });
    const field = within(dialog).getByRole('textbox', { name: /^View name/ });
    expect(field).toHaveFocus();
    const action = within(dialog).getByRole('button', { name: 'Save' });
    expect(action).toBeDisabled();
    await userEvent.type(field, '  Weeknight ');
    await userEvent.click(action);
    expect(onSaveAs).toHaveBeenCalledWith('Weeknight');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(async () => save.resolve());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('UIC-VIEW-SWITCHER-1.5 saves once per Enter or Control+Enter, pending, and shows a failure', async () => {
    const user = userEvent.setup();
    const save = deferred();
    const onSaveAs = vi.fn(() => save.promise);
    render(<ViewSwitcher views={views} onSaveAs={onSaveAs} />);
    await user.click(actionsButton('All recipes'));
    await user.click(await screen.findByRole('menuitem', { name: 'Save as new view' }));
    const dialog = await screen.findByRole('dialog', { name: 'New view' });
    const action = within(dialog).getByRole('button', { name: 'Save' });
    await user.type(within(dialog).getByRole('textbox', { name: /^View name/ }), 'Mine');
    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSaveAs).toHaveBeenCalledTimes(1);
    expect(onSaveAs).toHaveBeenCalledWith('Mine');
    expect(action).toHaveAttribute('data-pending', 'true');
    await act(async () => save.reject(new Error('Name taken')));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Name taken');
    expect(screen.getByRole('dialog', { name: 'New view' })).toBeInTheDocument();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSaveAs).toHaveBeenCalledTimes(2);
  });

  it('UIC-VIEW-SWITCHER-1.6 renames a view from its actions or its tab menu', async () => {
    const onRename = vi.fn();
    render(<ViewSwitcher views={views} onRename={onRename} />);
    await chooseAction('All recipes', 'Rename');
    const dialog = screen.getByRole('dialog', { name: 'Rename view' });
    const field = within(dialog).getByRole('textbox', { name: /^View name/ });
    expect(field).toHaveValue('All recipes');
    await userEvent.clear(field);
    await userEvent.type(field, 'Everything{Enter}');
    expect(onRename).toHaveBeenCalledWith('all', 'Everything');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.contextMenu(tabs()[2]!);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    expect(screen.getByRole('textbox', { name: /^View name/ })).toHaveValue('Baking');
  });

  it('UIC-VIEW-SWITCHER-1.7 makes a view the default and deletes a view after a confirmation', async () => {
    const onDefaultViewChange = vi.fn();
    const onDelete = vi.fn();
    const { rerender } = render(
      <ViewSwitcher
        views={views}
        defaultViewKey="quick"
        defaultSelectedKey="all"
        onDefaultViewChange={onDefaultViewChange}
        onDelete={onDelete}
      />,
    );
    await chooseAction('All recipes', 'Set as default view');
    expect(onDefaultViewChange).toHaveBeenCalledWith('all');
    await chooseAction('All recipes', 'Delete');
    const dialog = screen.getByRole('alertdialog', { name: 'Delete All recipes?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith('all');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    rerender(
      <ViewSwitcher
        views={views.slice(0, 1)}
        defaultViewKey="all"
        onDefaultViewChange={onDefaultViewChange}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(actionsButton('All recipes'));
    expect(screen.queryByRole('menuitem', { name: 'Set as default view' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('UIC-VIEW-SWITCHER-1.8 puts the views in a menu', async () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <ViewSwitcher
        views={views}
        variant="menu"
        defaultViewKey="all"
        isDirty
        onSelectionChange={onSelectionChange}
        onSave={() => {}}
      >
        <p>Rows</p>
      </ViewSwitcher>,
    );
    expect(container.firstElementChild).toHaveAttribute('data-variant', 'menu');
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'All recipes Default view Modified' });
    expect(trigger).toHaveClass('ui-view-switcher__menu', 'ui-dropdown-menu');
    expect(container).toHaveTextContent('Rows');
    expectHooksMatchSpec(container, 'VIEW-SWITCHER', { slots: ['bar', 'menu', 'actions'] });
    await userEvent.click(trigger);
    const menu = screen.getByRole('menu', { name: 'Views' });
    const items = within(menu).getAllByRole('menuitemradio');
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect(items[0]).toHaveTextContent('Default view');
    await userEvent.click(items[2]!);
    expect(onSelectionChange).toHaveBeenCalledWith('baking');
    expect(screen.getByRole('button', { name: 'Baking Modified' })).toBeInTheDocument();
  });

  it('UIC-VIEW-SWITCHER-2.1 names the list and moves between views by keyboard', async () => {
    render(<ViewSwitcher views={views} aria-label="Recipe views" onRename={() => {}} />);
    const list = screen.getByRole('tablist', { name: 'Recipe views' });
    tabs()[0]!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tabs()[1]).toHaveFocus();
    expect(tabs()[1]).toHaveAttribute('aria-selected', 'true');
    expect(list).toBeInTheDocument();
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    expect(await screen.findByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
  });
});
