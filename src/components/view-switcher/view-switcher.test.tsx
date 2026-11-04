import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { FolderGlyph } from '../../core/glyphs.js';
import type { Key } from '../../core/props.js';
import { requireDefined } from '../../utils/require-defined.js';
import { ViewSwitcher, type ViewSwitcherView } from './view-switcher.js';

const views: ViewSwitcherView[] = [
  { id: 'all', label: 'All recipes', icon: FolderGlyph },
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
  await userEvent.click(await screen.findByRole('menuitem', { name: action }));
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
    expect(requireDefined(tabs()[0]).querySelector('[data-glyph="folder"]')).not.toBeNull();
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
    await user.click(requireDefined(tabs()[2]));
    expect(onSelectionChange).toHaveBeenLastCalledWith('baking');
    expect(tabs()[2]).toHaveAttribute('aria-selected', 'true');
    rerender(
      <ViewSwitcher views={views} selectedKey="all" onSelectionChange={onSelectionChange} />,
    );
    expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
    await user.click(requireDefined(tabs()[1]));
    expect(onSelectionChange).toHaveBeenLastCalledWith('quick');
    expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('UIC-VIEW-SWITCHER-1.3 marks the default view and a modified selected view', () => {
    const { container } = render(
      <ViewSwitcher views={views} defaultViewKey="all" selectedKey="quick" isDirty />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-dirty', 'true');
    expect(
      requireDefined(tabs()[0]).querySelector('.ui-view-switcher__default [data-glyph="star"]'),
    ).not.toBeNull();
    expect(tabs()[0]).toHaveAccessibleName('All recipes Default view');
    expect(tabs()[1]).toHaveAccessibleName('Quick meals Modified');
    expect(requireDefined(tabs()[0]).querySelector('.ui-view-switcher__modified')).toBeNull();
    expect(requireDefined(tabs()[0]).querySelector('.ui-view-switcher__label')).toHaveAttribute(
      'data-label',
      'All recipes',
    );
    expectHooksMatchSpec(container, 'VIEW-SWITCHER', { slots: ['default', 'modified'] });
  });

  it('UIC-VIEW-SWITCHER-1.4 saves and resets a modified view', async () => {
    const onSave = vi.fn();
    const onReset = vi.fn();
    const { rerender } = render(
      <ViewSwitcher views={views} onSave={onSave} onReset={onReset} onSaveAs={() => {}} />,
    );
    await userEvent.click(actionsButton('All recipes'));
    await screen.findByRole('menu');
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

  it.each([
    { name: 'during a composition', init: { isComposing: true } },
    { name: 'that confirms a candidate', init: { keyCode: 229 } },
  ])('UIC-VIEW-SWITCHER-1.5 leaves an Enter $name to the input method', async ({ init }) => {
    const user = userEvent.setup();
    const onSaveAs = vi.fn();
    render(<ViewSwitcher views={views} onSaveAs={onSaveAs} />);
    await user.click(actionsButton('All recipes'));
    await user.click(await screen.findByRole('menuitem', { name: 'Save as new view' }));
    const dialog = await screen.findByRole('dialog', { name: 'New view' });
    const field = within(dialog).getByRole('textbox', { name: /^View name/ });
    await user.type(field, 'Mine');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing or keyCode on a keydown
    fireEvent.keyDown(field, { key: 'Enter', ...init });
    expect(onSaveAs).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSaveAs).toHaveBeenCalledWith('Mine');
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

  it('UIC-VIEW-SWITCHER-1.5 settles a dismissed save without closing the dialog opened since', async () => {
    const user = userEvent.setup();
    const save = deferred();
    const onSaveAs = vi.fn(() => save.promise);
    render(<ViewSwitcher views={views} onSaveAs={onSaveAs} onRename={vi.fn()} />);
    await chooseAction('All recipes', 'Save as new view');
    const first = screen.getByRole('dialog', { name: 'New view' });
    await user.type(within(first).getByRole('textbox', { name: /^View name/ }), 'Mine{Enter}');
    expect(onSaveAs).toHaveBeenCalledWith('Mine');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await chooseAction('All recipes', 'Rename');
    const second = await screen.findByRole('dialog', { name: 'Rename view' });
    const field = within(second).getByRole('textbox', { name: /^View name/ });
    await user.type(field, ' today');
    await act(async () => save.resolve());
    expect(screen.getByRole('dialog', { name: 'Rename view' })).toBeInTheDocument();
    expect(field).toHaveValue('All recipes today');
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
    fireEvent.contextMenu(requireDefined(tabs()[2]));
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
    await screen.findByRole('menu');
    expect(screen.queryByRole('menuitem', { name: 'Set as default view' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('UIC-VIEW-SWITCHER-1.2 UIC-VIEW-SWITCHER-1.7 selects the default view when the selected one is deleted', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn<(key: Key) => void>();
    function Deleting() {
      const [list, setList] = useState(views);
      return (
        <ViewSwitcher
          views={list}
          defaultSelectedKey="quick"
          onSelectionChange={onSelectionChange}
          onDelete={(key) => setList((current) => current.filter((view) => view.id !== key))}
        >
          <p>Rows</p>
        </ViewSwitcher>
      );
    }
    render(<Deleting />);
    await user.click(actionsButton('Quick meals'));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete Quick meals?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(screen.getByRole('tab', { name: 'All recipes' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Rows');
    expect(actionsButton('All recipes')).toBeInTheDocument();
    expect(onSelectionChange.mock.calls).toEqual([['all']]);
  });

  it('UIC-VIEW-SWITCHER-1.2 shows the default view while a controlled key names no view', () => {
    render(
      <ViewSwitcher views={views} selectedKey="gone" defaultViewKey="baking" variant="menu">
        <p>Rows</p>
      </ViewSwitcher>,
    );
    expect(screen.getByRole('button', { name: 'Baking Default view' })).toBeInTheDocument();
    expect(screen.getByText('Rows')).toBeInTheDocument();
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
    const menu = await screen.findByRole('menu', { name: 'Views' });
    const items = within(menu).getAllByRole('menuitemradio');
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect(items[0]).toHaveTextContent('Default view');
    await userEvent.click(requireDefined(items[2]));
    expect(onSelectionChange).toHaveBeenCalledWith('baking');
    expect(screen.getByRole('button', { name: 'Baking Modified' })).toBeInTheDocument();
  });

  it('UIC-VIEW-SWITCHER-2.1 names the list and moves between views by keyboard', async () => {
    render(<ViewSwitcher views={views} aria-label="Recipe views" onRename={() => {}} />);
    const list = screen.getByRole('tablist', { name: 'Recipe views' });
    requireDefined(tabs()[0]).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tabs()[1]).toHaveFocus();
    expect(tabs()[1]).toHaveAttribute('aria-selected', 'true');
    expect(list).toBeInTheDocument();
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    expect(await screen.findByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
  });

  it('UIC-VIEW-SWITCHER-2.1 names the menu of views by aria-labelledby', async () => {
    const user = userEvent.setup();
    render(
      <>
        <h2 id="saved">Saved views</h2>
        <ViewSwitcher views={views} variant="menu" aria-labelledby="saved" />
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'All recipes' }));
    expect(await screen.findByRole('menu')).toHaveAccessibleName('Saved views');
  });

  it('UIC-VIEW-SWITCHER-1.1 keeps the content’s state when the variant changes', async () => {
    const user = userEvent.setup();
    function Counter() {
      const [count, setCount] = useState(0);
      return (
        <button type="button" onClick={() => setCount(count + 1)}>
          Count {count}
        </button>
      );
    }
    function Switcher({ variant }: { variant: 'tabs' | 'menu' }) {
      return (
        <ViewSwitcher views={views} selectedKey="quick" variant={variant}>
          <input aria-label="Notes" />
          <Counter />
        </ViewSwitcher>
      );
    }
    const { rerender } = render(<Switcher variant="tabs" />);
    const input = screen.getByRole('textbox', { name: 'Notes' });
    await user.click(screen.getByRole('button', { name: 'Count 0' }));
    await user.type(input, 'Unsaved content');
    const expectKept = () => {
      expect(screen.getByRole('textbox', { name: 'Notes' })).toBe(input);
      expect(input).toHaveValue('Unsaved content');
      expect(input).toHaveFocus();
      expect(screen.getByRole('button', { name: 'Count 1' })).toBeInTheDocument();
    };
    const panel = screen.getByRole('tabpanel', { name: 'Quick meals' });
    expect(requireDefined(tabs()[1])).toHaveAttribute('aria-controls', panel.id);
    rerender(<Switcher variant="menu" />);
    expectKept();
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(input.closest('.ui-view-switcher__panel')).not.toHaveAttribute('id');
    expect(input.closest('.ui-view-switcher__panel')).not.toHaveAttribute('aria-labelledby');
    rerender(<Switcher variant="tabs" />);
    expectKept();
    expect(screen.getByRole('tabpanel', { name: 'Quick meals' })).toBe(panel);
    expect(requireDefined(tabs()[1])).toHaveAttribute('aria-controls', panel.id);
    expect(panel).not.toHaveAttribute('tabindex');
  });

  it('UIC-VIEW-SWITCHER-1.1 follows the selected tab and makes an empty panel a tab stop', async () => {
    const user = userEvent.setup();
    render(
      <ViewSwitcher views={views}>
        <p>Rows</p>
      </ViewSwitcher>,
    );
    expect(screen.getByRole('tabpanel', { name: 'All recipes' })).toHaveAttribute('tabindex', '0');
    await user.click(requireDefined(tabs()[2]));
    const panel = screen.getByRole('tabpanel', { name: 'Baking' });
    expect(requireDefined(tabs()[2])).toHaveAttribute('aria-controls', panel.id);
  });

  describe('UIC-VIEW-SWITCHER-1.10 revalidates an open dialog', () => {
    const two = views.slice(0, 2);
    type Handlers = Partial<
      Pick<Parameters<typeof ViewSwitcher>[0], 'onRename' | 'onDelete' | 'onSaveAs' | 'views'>
    >;
    function mountSwitcher(handlers: Handlers) {
      const { rerender } = render(
        <ViewSwitcher defaultSelectedKey="all" {...handlers} views={handlers.views ?? two} />,
      );
      return (next: Handlers) =>
        rerender(<ViewSwitcher defaultSelectedKey="all" {...next} views={next.views ?? two} />);
    }

    it.each([
      ['rename', 'Rename', 'dialog'],
      ['delete', 'Delete', 'alertdialog'],
    ] as const)(
      'closes the %s dialog when its handler goes, and keeps it closed',
      async (_, action, role) => {
        const handler = vi.fn();
        const props = action === 'Rename' ? { onRename: handler } : { onDelete: handler };
        const update = mountSwitcher(props);
        await chooseAction('All recipes', action);
        expect(screen.getByRole(role)).toBeInTheDocument();
        update({});
        await waitFor(() => expect(screen.queryByRole(role)).not.toBeInTheDocument());
        update(props);
        expect(screen.queryByRole(role)).not.toBeInTheDocument();
        expect(handler).not.toHaveBeenCalled();
      },
    );

    it('closes a dialog whose view is gone, and the delete dialog when one view is left', async () => {
      const onRename = vi.fn();
      const onDelete = vi.fn();
      const update = mountSwitcher({ onRename, onDelete });
      await chooseAction('All recipes', 'Rename');
      update({ onRename, onDelete, views: views.slice(1, 3) });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      update({ onRename, onDelete });
      fireEvent.contextMenu(requireDefined(tabs()[0]));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
      expect(screen.getByRole('alertdialog', { name: 'Delete All recipes?' })).toBeInTheDocument();
      update({ onRename, onDelete, views: views.slice(0, 1) });
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
      expect(onRename).not.toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('runs the current handler and the current label for a dialog still valid', async () => {
      const first = vi.fn();
      const second = vi.fn();
      const onSaveAs = vi.fn();
      const update = mountSwitcher({ onDelete: first, onSaveAs });
      await chooseAction('All recipes', 'Delete');
      update({
        onDelete: second,
        onSaveAs,
        views: [{ id: 'all', label: 'Every recipe' }, views[1] as ViewSwitcherView],
      });
      const dialog = screen.getByRole('alertdialog', { name: 'Delete Every recipe?' });
      await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith('all');
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());

      const replaced = vi.fn();
      await chooseAction('Every recipe', 'Save as new view');
      update({ onSaveAs: replaced });
      const field = screen.getByRole('textbox', { name: /^View name/ });
      await userEvent.type(field, 'Weekend{Enter}');
      expect(onSaveAs).not.toHaveBeenCalled();
      expect(replaced).toHaveBeenCalledWith('Weekend');
    });

    it('keeps a started deletion apart from a later dialog', async () => {
      const pending = deferred();
      const onDelete = vi.fn(() => pending.promise);
      const onRename = vi.fn();
      const update = mountSwitcher({ onDelete, onRename });
      await chooseAction('All recipes', 'Delete');
      await userEvent.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }),
      );
      expect(onDelete).toHaveBeenCalledTimes(1);
      update({ onDelete, onRename, views: views.slice(1, 3) });
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
      await chooseAction('Quick meals', 'Rename');
      await act(async () => pending.resolve());
      expect(screen.getByRole('dialog', { name: 'Rename view' })).toBeInTheDocument();
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });
});
