import {
  DeleteGlyph,
  ExpandGlyph,
  HelpGlyph,
  InfoGlyph,
  SortAscendingGlyph,
  UploadGlyph,
} from '../../core/glyphs.js';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { deepActive, inShadow, ShadowHost } from '../../../test/shadow-fixtures.js';
import { UiProvider } from '../../core/provider.js';
import { ActionRow, actionVerbs, orderActions, type ActionRowAction } from './action-row.js';

const noop = () => undefined;

function buttons(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('.ui-action-row__action'));
}

describe('ActionRow', () => {
  it('UIC-ACTION-ROW-1.1 draws each standard verb with its glyph and provider label', () => {
    const verbs = Object.keys(actionVerbs) as Array<keyof typeof actionVerbs>;
    const { container } = render(
      <ActionRow actions={verbs.map((verb) => ({ verb, onPress: noop }))} />,
    );
    expect(
      buttons(container).map((button) => [
        button.dataset.verb,
        button.getAttribute('aria-label'),
        button.querySelector('[data-glyph]')?.getAttribute('data-glyph'),
      ]),
    ).toEqual([
      ['add', 'Add', 'plus'],
      ['refresh', 'Refresh', 'refresh'],
      ['more', 'More', 'more'],
      ['edit', 'Edit', 'edit'],
      ['delete', 'Delete', 'delete'],
      ['save', 'Save', 'save'],
      ['cancel', 'Cancel', 'close'],
      ['close', 'Close', 'close'],
    ]);
    expectHooksMatchSpec(container, 'ACTION-ROW', { slots: ['actions', 'action'] });
  });

  it('UIC-ACTION-ROW-1.1 lets an action name its subject and follows provider strings', () => {
    const { rerender } = render(
      <ActionRow actions={[{ verb: 'add', label: 'Add comment', onPress: noop }]} />,
    );
    const add = screen.getByRole('button', { name: 'Add comment' });
    expect(add.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'plus');
    rerender(
      <UiProvider messages={{ edit: 'Modifier' }}>
        <ActionRow actions={[{ verb: 'edit', onPress: noop }]} />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
  });

  it('UIC-ACTION-ROW-1.1 rejects a verb outside the list at compile time', () => {
    // @ts-expect-error A verb outside the standard set has no glyph, label or place.
    const unknown: ActionRowAction = { verb: 'publish', onPress: noop };
    expect(unknown.verb).toBe('publish');
  });

  it('UIC-ACTION-ROW-1.2 draws custom actions as toggles with their own icon and label', async () => {
    const ref = createRef<HTMLButtonElement>();
    const onPress = vi.fn();
    const { container } = render(
      <ActionRow
        actions={[
          {
            verb: 'custom',
            id: 'full',
            icon: ExpandGlyph,
            label: 'Full screen',
            isSelected: true,
            onPress,
          },
          {
            verb: 'custom',
            id: 'pin',
            icon: <svg role="img" aria-label="Pin glyph" />,
            label: 'Pin',
            isSelected: false,
            ref,
          },
          { verb: 'custom', id: 'help', icon: HelpGlyph, label: 'Help' },
        ]}
      />,
    );
    const full = screen.getByRole('button', { name: 'Full screen' });
    expect(full).toHaveAttribute('aria-pressed', 'true');
    expect(full).toHaveAttribute('data-selected', 'true');
    expect(full.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'expand');
    expect(screen.getByRole('button', { name: 'Pin' })).toHaveAttribute('aria-pressed', 'false');
    expect(
      within(screen.getByRole('button', { name: 'Pin' })).getByRole('img', {
        name: 'Pin glyph',
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Help' })).not.toHaveAttribute('aria-pressed');
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Pin' }));
    await userEvent.click(full);
    expect(onPress).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'ACTION-ROW');
  });

  it('UIC-ACTION-ROW-1.2 shows the label of a custom action without an icon, keeping its states', async () => {
    const onPress = vi.fn();
    render(
      <ActionRow
        actions={[
          { verb: 'custom', id: 'schedule', label: 'Schedule', onPress, isSelected: false },
          {
            verb: 'custom',
            id: 'more',
            label: 'More',
            items: [{ id: 'archive', label: 'Archive' }],
            onAction: noop,
          },
          { verb: 'custom', id: 'wait', label: 'Wait', isPending: true },
        ]}
      />,
    );
    const schedule = screen.getByRole('button', { name: 'Schedule' });
    expect(schedule).toHaveTextContent('Schedule');
    expect(schedule).toHaveAttribute('data-content', 'label');
    expect(schedule).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(schedule);
    expect(onPress).toHaveBeenCalledTimes(1);
    const more = screen.getByRole('button', { name: 'More' });
    expect(more).toHaveTextContent('More');
    expect(more).toHaveAttribute('aria-haspopup', 'true');
    await userEvent.click(more);
    expect(await screen.findByRole('menuitem', { name: 'Archive' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Wait/ })).toHaveAttribute('aria-disabled', 'true');
  });

  it('UIC-ACTION-ROW-1.7 keeps each action on its own button as actions come, go and move', async () => {
    const user = userEvent.setup();
    const onFirst = vi.fn();
    const onSecond = vi.fn();
    const first: ActionRowAction = {
      verb: 'custom',
      id: 'first',
      icon: InfoGlyph,
      label: 'First',
      onPress: onFirst,
    };
    const second: ActionRowAction = {
      verb: 'custom',
      id: 'second',
      icon: HelpGlyph,
      label: 'Second',
      onPress: onSecond,
    };
    const zero: ActionRowAction = { verb: 'custom', id: 0, icon: UploadGlyph, label: 'Zero' };
    // Two actions of one verb, told apart by their ids.
    const deletes: ActionRowAction[] = [
      { verb: 'delete', id: 'delete-row', label: 'Delete row' },
      { verb: 'delete', id: 'delete-column', label: 'Delete column' },
    ];
    const { rerender } = render(<ActionRow actions={[first, second, ...deletes]} />);
    const secondButton = screen.getByRole('button', { name: 'Second' });
    const columnButton = screen.getByRole('button', { name: 'Delete column' });

    rerender(<ActionRow actions={[zero, second, first, ...deletes.toReversed()]} />);
    expect(screen.getByRole('button', { name: 'Second' })).toBe(secondButton);
    expect(screen.getByRole('button', { name: 'Delete column' })).toBe(columnButton);

    await user.click(screen.getByRole('button', { name: 'First' }));
    expect(onFirst).toHaveBeenCalledTimes(1);
    // The focused action leaves: focus moves to the next action's own button, never onto the
    // removed action's button reused for another command.
    rerender(<ActionRow actions={[zero, second, ...deletes]} />);
    expect(screen.queryByRole('button', { name: 'First' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete column' })).toHaveFocus();
    rerender(<ActionRow actions={[zero, second]} />);
    expect(secondButton).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSecond).toHaveBeenCalledTimes(1);
    expect(onFirst).toHaveBeenCalledTimes(1);
  });

  it('UIC-ACTION-ROW-1.7 moves focus to the overflow menu button when the focused action collapses into it', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const width = this.classList.contains('ui-action-row__action') ? 30 : 0;
      return new DOMRect(0, 0, width, 30);
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('ui-action-row__actions') ? 70 : 0;
    });
    const actions: ActionRowAction[] = [
      { verb: 'add', onPress: noop },
      { verb: 'delete', onPress: noop },
    ];
    try {
      const { rerender } = render(<ActionRow overflow="menu" actions={actions} />);
      screen.getByRole('button', { name: 'Delete' }).focus();
      // A third action leaves room for one action and the menu button.
      rerender(
        <ActionRow overflow="menu" actions={[...actions, { verb: 'edit', onPress: noop }]} />,
      );
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^\d+ more/ })).toHaveFocus();
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('UIC-ACTION-ROW-1.7 moves focus to the overflow menu button inside a shadow root', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const width = this.classList.contains('ui-action-row__action') ? 30 : 0;
      return new DOMRect(0, 0, width, 30);
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('ui-action-row__actions') ? 70 : 0;
    });
    const actions: ActionRowAction[] = [
      { verb: 'add', onPress: noop },
      { verb: 'delete', onPress: noop },
    ];
    const tree = (shown: ActionRowAction[]) => (
      <ShadowHost name="page">
        <ActionRow overflow="menu" actions={shown} />
      </ShadowHost>
    );
    try {
      const { rerender } = render(tree(actions));
      inShadow('page').getByRole('button', { name: 'Delete' }).focus();
      rerender(tree([...actions, { verb: 'edit', onPress: noop }]));
      expect(deepActive()).toBe(inShadow('page').getByRole('button', { name: /^\d+ more/ }));
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('UIC-ACTION-ROW-1.3 draws custom actions in their order, then the verbs in a fixed order', () => {
    const actions: ActionRowAction[] = [
      { verb: 'cancel', id: 'cancel', onPress: noop },
      { verb: 'custom', id: 'second-custom', icon: InfoGlyph, label: 'History', onPress: noop },
      { verb: 'save', id: 'save', onPress: noop },
      { verb: 'edit', id: 'edit', onPress: noop },
      {
        verb: 'custom',
        id: 'first-custom',
        icon: ExpandGlyph,
        label: 'Full screen',
        onPress: noop,
      },
      { verb: 'add', id: 'add', onPress: noop },
      { verb: 'refresh', id: 'refresh', onPress: noop },
      { verb: 'close', id: 'close', onPress: noop },
      { verb: 'delete', id: 'delete', onPress: noop },
      { verb: 'more', id: 'more', onPress: noop },
    ];
    const expected = [
      'second-custom',
      'first-custom',
      'add',
      'refresh',
      'more',
      'edit',
      'delete',
      'save',
      'cancel',
      'close',
    ];
    const { container } = render(<ActionRow actions={actions} />);
    expect(buttons(container).map((button) => button.getAttribute('aria-label'))).toEqual([
      'History',
      'Full screen',
      'Add',
      'Refresh',
      'More',
      'Edit',
      'Delete',
      'Save',
      'Cancel',
      'Close',
    ]);
    expect(orderActions(actions).map((action) => action.id)).toEqual(expected);
  });

  it('UIC-ACTION-ROW-1.4 shows the tooltip on keyboard focus without changing the name', async () => {
    render(
      <ActionRow
        actions={[
          { verb: 'refresh', onPress: noop },
          {
            verb: 'custom',
            id: 'full-screen',
            icon: ExpandGlyph,
            label: 'Full screen',
            tooltip: 'Full screen (F)',
            onPress: noop,
          },
        ]}
      />,
    );
    await userEvent.tab();
    const full = screen.getByRole('button', { name: 'Full screen' });
    expect(full).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Full screen (F)');
    expect(full).toHaveAccessibleName('Full screen');
    expect(full).toHaveAccessibleDescription('Full screen (F)');

    await userEvent.tab();
    const refresh = screen.getByRole('button', { name: 'Refresh' });
    expect(refresh).toHaveFocus();
    const tooltip = await screen.findByRole('tooltip', { name: 'Refresh' });
    expect(tooltip).toHaveClass('ui-tooltip');
    // A tooltip that only repeats the label does not describe the button as well.
    expect(refresh).not.toHaveAttribute('aria-describedby');
    expect(refresh).toHaveAccessibleDescription('');
    expectHooksMatchSpec(document.body, 'ACTION-ROW', { slots: ['action'] });
  });

  it('UIC-ACTION-ROW-1.5 publishes disabled, pending, expanded and caller states on the button', async () => {
    const onPress = vi.fn();
    const { container } = render(
      <ActionRow
        actions={[
          { verb: 'add', id: 'add', isDisabled: true, 'aria-controls': 'list', onPress },
          {
            verb: 'edit',
            id: 'edit',
            isDisabled: true,
            tooltip: 'Only the owner can edit this',
            onPress,
          },
          { verb: 'save', id: 'save', isPending: true, onPress },
          {
            verb: 'custom',
            id: 'details',
            icon: InfoGlyph,
            label: 'Details',
            isExpanded: false,
            'aria-haspopup': 'dialog',
            'data-section': 'details',
            onPress,
          },
        ]}
      />,
    );
    const byId = (id: string) =>
      buttons(container).find((button) => button.getAttribute('aria-label') === id);
    expect(byId('Add')).toBeDisabled();
    expect(byId('Add')).toHaveAttribute('aria-controls', 'list');
    expect(byId('Edit')).toBeEnabled();
    expect(byId('Edit')).toHaveAttribute('aria-disabled', 'true');
    expect(byId('Save')).toHaveAttribute('data-pending', 'true');
    expect(byId('Save')).toHaveAccessibleName(/^Save/);
    expect(within(byId('Save') as HTMLElement).getByRole('progressbar')).toHaveAccessibleName(
      'Saving',
    );
    expect(byId('Details')).toHaveAttribute('aria-expanded', 'false');
    expect(byId('Details')).toHaveAttribute('aria-haspopup', 'dialog');
    expect(byId('Details')).toHaveAttribute('data-section', 'details');
    expect(byId('Details')).toHaveAttribute('data-verb', 'custom');
    await userEvent.click(byId('Edit') as HTMLButtonElement);
    await userEvent.click(byId('Save') as HTMLButtonElement);
    expect(onPress).not.toHaveBeenCalled();
    await userEvent.click(byId('Details') as HTMLButtonElement);
    expect(onPress).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'ACTION-ROW', { callerAttributes: ['data-section'] });
  });

  it('UIC-ACTION-ROW-1.5 keeps an action that returns a promise pending in the row and in the overflow menu', async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const width = this.classList.contains('ui-action-row__action') ? 30 : 0;
      return new DOMRect(0, 0, width, 30);
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('ui-action-row__actions') ? 40 : 0;
    });
    let settle: (() => void) | undefined;
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );
    const onRefresh = vi.fn();
    const actions: ActionRowAction[] = [
      { verb: 'refresh', onPress: onRefresh },
      { verb: 'save', onPress: onSave },
    ];
    try {
      const { rerender } = render(<ActionRow actions={actions} />);
      const save = screen.getByRole('button', { name: /^Save/ });
      await user.click(save);
      await user.click(save);
      save.focus();
      await user.keyboard('{Enter}');
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(save).toHaveAttribute('data-pending', 'true');
      // A synchronous action runs on every press.
      await user.click(screen.getByRole('button', { name: 'Refresh' }));
      await user.click(screen.getByRole('button', { name: 'Refresh' }));
      expect(onRefresh).toHaveBeenCalledTimes(2);

      // The row narrows while the save is running: its overflow item stays pending.
      rerender(<ActionRow overflow="menu" actions={actions} />);
      const more = await screen.findByRole('button', { name: /^\d+ more/ });
      await user.click(more);
      const item = await screen.findByRole('menuitem', { name: /^Save/ });
      expect(item).toHaveAttribute('aria-disabled', 'true');
      await user.click(item);
      await user.keyboard('{Enter}');
      expect(onSave).toHaveBeenCalledTimes(1);
      await user.keyboard('{Escape}');

      settle?.();
      await user.click(more);
      await waitFor(() =>
        expect(screen.getByRole('menuitem', { name: /^Save/ })).not.toHaveAttribute(
          'aria-disabled',
        ),
      );
      await user.click(screen.getByRole('menuitem', { name: /^Save/ }));
      expect(onSave).toHaveBeenCalledTimes(2);
      // Pending again, the menu item refuses the next choice after a reopen.
      await user.click(more);
      await user.click(await screen.findByRole('menuitem', { name: /^Save/ }));
      expect(onSave).toHaveBeenCalledTimes(2);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('UIC-ACTION-ROW-1.5 hands a rejected action to its onError and ends its pending state', async () => {
    const user = userEvent.setup();
    const failure = new Error('Offline');
    const onError = vi.fn();
    const onSave = vi.fn(() => Promise.reject(failure));
    render(<ActionRow actions={[{ verb: 'save', onPress: onSave, onError }]} />);
    const save = screen.getByRole('button', { name: /^Save/ });
    await user.click(save);
    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));
    expect(save).not.toHaveAttribute('data-pending');
    await user.click(save);
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it('UIC-ACTION-ROW-1.6 opens a menu of typed items from an action', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onPress = vi.fn();
    const onArchive = vi.fn();
    render(
      <ActionRow
        size="xs"
        actions={[
          {
            verb: 'more',
            id: 'more',
            label: 'More actions',
            onPress,
            onAction,
            items: [
              { id: 'export', label: 'Export', icon: UploadGlyph, shortcut: 'Ctrl+E' },
              { id: 'archive', label: 'Archive', onAction: onArchive },
              { id: 'locked', label: 'Rename', isDisabled: true },
              { type: 'separator', id: 'rule' },
              {
                type: 'section',
                id: 'danger',
                title: 'Danger zone',
                items: [{ id: 'delete', label: 'Delete', icon: DeleteGlyph, tone: 'danger' }],
              },
            ],
          },
        ]}
      />,
    );
    const more = screen.getByRole('button', { name: 'More actions' });
    expect(more).toHaveAttribute('aria-haspopup', 'true');
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    expect(onPress).not.toHaveBeenCalled();
    expect(more).toHaveAttribute('aria-expanded', 'true');
    const menu = await screen.findByRole('menu', { name: 'More actions' });
    expect(more).toHaveAttribute('aria-controls', menu.id);
    expect(menu).toHaveAttribute('data-size', 'sm');
    expect(within(menu).getAllByRole('menuitem')).toEqual([
      within(menu).getByRole('menuitem', { name: /^Export\b/ }),
      within(menu).getByRole('menuitem', { name: 'Archive' }),
      within(menu).getByRole('menuitem', { name: 'Rename' }),
      within(menu).getByRole('menuitem', { name: 'Delete' }),
    ]);
    expect(within(menu).getByRole('menuitem', { name: /Rename/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(within(menu).getByRole('group', { name: 'Danger zone' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'data-tone',
      'danger',
    );
    expect(within(menu).getByRole('separator')).toBeInTheDocument();
    await user.click(within(menu).getByRole('menuitem', { name: /Export/ }));
    expect(onAction.mock.calls.map(([key]) => key)).toEqual(['export']);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(more).toHaveFocus());

    await user.keyboard('{ArrowDown}');
    expect(await screen.findByRole('menuitem', { name: /Export/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls.map(([key]) => key)).toEqual(['export', 'archive']);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('UIC-ACTION-ROW-1.6 keeps the tooltip of a menu action and presses plainly without items', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(
      <ActionRow
        actions={[
          {
            verb: 'custom',
            id: 'sort',
            icon: SortAscendingGlyph,
            label: 'Sort',
            tooltip: 'Sort the list',
            isExpanded: true,
            'aria-haspopup': 'dialog',
            items: [{ id: 'name', label: 'By name' }],
          },
          { verb: 'more', id: 'more', isDisabled: true, items: [{ id: 'x', label: 'Export' }] },
        ]}
      />,
    );
    await user.tab();
    const sort = screen.getByRole('button', { name: 'Sort' });
    expect(sort).toHaveAttribute('data-verb', 'custom');
    expect(sort).toHaveAttribute('aria-expanded', 'false');
    expect(sort).toHaveAttribute('aria-haspopup', 'true');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Sort the list');
    const more = screen.getByRole('button', { name: 'More' });
    expect(more).toBeDisabled();
    await user.click(more);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    rerender(<ActionRow actions={[{ verb: 'more', id: 'more', items: [], onPress }]} />);
    const plain = screen.getByRole('button', { name: 'More' });
    expect(plain).not.toHaveAttribute('aria-haspopup');
    await user.click(plain);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('UIC-ACTION-ROW-1.6 keeps the button and its focus as menu items arrive and leave', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const row = (items: ActionRowAction['items']) => (
      <ActionRow actions={[{ verb: 'more', id: 'more', items, onPress }]} />
    );
    const { rerender } = render(row([]));
    await user.tab();
    const more = screen.getByRole('button', { name: 'More' });
    expect(more).toHaveFocus();
    rerender(row([{ id: 'export', label: 'Export' }]));
    expect(screen.getByRole('button', { name: 'More' })).toBe(more);
    expect(more).toHaveFocus();
    expect(more).toHaveAttribute('aria-haspopup', 'true');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    rerender(row([]));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'More' })).toBe(more);
    expect(more).not.toHaveAttribute('aria-haspopup');
    more.focus();
    await user.keyboard('{Enter}');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('UIC-ACTION-ROW-2.1 puts lead content before the actions and renders nothing when empty', () => {
    const { container, rerender } = render(
      <ActionRow lead={<span>Inbox</span>} actions={[{ verb: 'refresh', onPress: noop }]} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(Array.from(root.children, (child) => child.className)).toEqual([
      'ui-action-row__lead',
      'ui-action-row__actions',
    ]);
    expect(root.firstElementChild).toHaveTextContent('Inbox');
    expectHooksMatchSpec(container, 'ACTION-ROW', { slots: ['lead', 'actions', 'action'] });

    rerender(<ActionRow lead={<span>Working</span>} actions={[]} />);
    expect(container.querySelector('.ui-action-row__actions')).toBeNull();
    expect(container.querySelector('.ui-action-row__lead')).toHaveTextContent('Working');

    rerender(<ActionRow lead="" actions={[{ verb: 'refresh', onPress: noop }]} />);
    expect(container.querySelector('.ui-action-row__lead')).toBeNull();

    rerender(<ActionRow actions={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ActionRow lead={false} actions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('UIC-ACTION-ROW-2.2 sizes every action and publishes the size', () => {
    const actions: ActionRowAction[] = [
      { verb: 'add', onPress: noop },
      { verb: 'edit', onPress: noop },
    ];
    const { container, rerender } = render(<ActionRow actions={actions} />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('data-size', 'md');
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      rerender(<ActionRow actions={actions} size={size} />);
      expect(root).toHaveAttribute('data-size', size);
      for (const button of buttons(container)) expect(button).toHaveAttribute('data-size', size);
    }
  });

  it('UIC-ACTION-ROW-2.3 appends the caller class and forwards id and data attributes', () => {
    const { container } = render(
      <ActionRow
        actions={[{ verb: 'add', onPress: noop }]}
        className="caller"
        id="row"
        data-testid="probe"
        data-size="huge"
      />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass('ui-action-row', 'caller');
    expect(root).toHaveAttribute('id', 'row');
    expect(root).toHaveAttribute('data-testid', 'probe');
    expect(root).toHaveAttribute('data-size', 'md');
    expectHooksMatchSpec(container, 'ACTION-ROW');
  });

  it('UIC-ACTION-ROW-2.4 makes the actions one toolbar with arrow-key focus', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <button type="button">Before</button>
        <ActionRow
          toolbar
          aria-label="Note actions"
          actions={[
            { verb: 'edit', onPress: noop },
            { verb: 'delete', onPress: noop },
            { verb: 'close', onPress: noop },
          ]}
        />
        <button type="button">After</button>
      </>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Note actions' });
    expect(toolbar).toHaveClass('ui-action-row__actions');
    expect(toolbar).toHaveAttribute('data-orientation', 'horizontal');
    expect(toolbar.closest('.ui-action-row')).not.toHaveAttribute('aria-label');
    await user.click(screen.getByRole('button', { name: 'Before' }));
    await user.tab();
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expectHooksMatchSpec(container, 'ACTION-ROW', { slots: ['actions', 'action'] });
  });

  it('UIC-ACTION-ROW-2.5 keeps the actions that fit and lists the others in a menu', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const width = this.classList.contains('ui-action-row__action') ? 30 : 0;
      return new DOMRect(0, 0, width, 30);
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('ui-action-row__actions') ? 70 : 0;
    });
    const onEdit = vi.fn();
    const onAction = vi.fn();
    try {
      const { container } = render(
        <ActionRow
          overflow="menu"
          actions={[
            { verb: 'add', onPress: noop },
            { verb: 'edit', onPress: onEdit },
            { verb: 'refresh', onPress: noop },
            { verb: 'more', onAction, items: [{ id: 'rename', label: 'Rename' }] },
            { verb: 'delete', isDisabled: true, onPress: noop },
          ]}
        />,
      );
      const row = container.querySelector('.ui-action-row') as HTMLElement;
      expect(row).toHaveAttribute('data-overflow', 'menu');
      // Two 30px actions fit in 70px; the rest go into the menu after them.
      expect(buttons(container).map((button) => button.getAttribute('aria-label'))).toEqual([
        'Add',
        'Refresh',
      ]);
      const more = screen.getByRole('button', { name: '3 more items' });
      expect(more.closest('.ui-action-row__overflow')).not.toBeNull();
      expectHooksMatchSpec(container, 'ACTION-ROW', { slots: ['actions', 'action', 'overflow'] });

      await userEvent.click(more);
      expect((await screen.findAllByRole('menuitem')).map((item) => item.textContent)).toEqual([
        'More',
        'Edit',
        'Delete',
      ]);
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
      expect(onEdit).toHaveBeenCalledTimes(1);

      await userEvent.click(more);
      await userEvent.click(await screen.findByRole('menuitem', { name: 'More' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
      expect(onAction.mock.calls[0]?.[0]).toBe('rename');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('UIC-ACTION-ROW-2.5 binds each overflow submenu to its own action, whatever ids the menus share', async () => {
    const user = userEvent.setup();
    let rowWidth = 0;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const width = this.classList.contains('ui-action-row__action') ? 30 : 0;
      return new DOMRect(0, 0, width, 30);
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('ui-action-row__actions') ? rowWidth : 0;
    });
    const onFirst = vi.fn();
    const onSecond = vi.fn();
    const onOwnItem = vi.fn();
    const actions: ActionRowAction[] = [
      {
        verb: 'custom',
        id: 'first',
        icon: InfoGlyph,
        label: 'First',
        onAction: onFirst,
        items: [{ id: 'open', label: 'Open first' }],
      },
      {
        verb: 'custom',
        id: 'second',
        icon: HelpGlyph,
        label: 'Second',
        onAction: onSecond,
        items: [
          { id: 'open', label: 'Open second', onAction: onOwnItem },
          {
            type: 'section',
            id: 'more',
            title: 'More',
            items: [{ id: 1, label: 'Nested', items: [{ id: 'open', label: 'Open deep' }] }],
          },
        ],
      },
    ];
    try {
      const { rerender } = render(<ActionRow overflow="menu" actions={actions} />);
      await user.click(await screen.findByRole('button', { name: '2 more items' }));
      await user.click(await screen.findByRole('menuitem', { name: 'Second' }));
      await user.click(await screen.findByRole('menuitem', { name: 'Open second' }));
      expect(onFirst).not.toHaveBeenCalled();
      expect(onSecond.mock.calls).toEqual([['open']]);
      expect(onOwnItem).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('button', { name: '2 more items' }));
      await user.click(await screen.findByRole('menuitem', { name: 'First' }));
      await user.click(await screen.findByRole('menuitem', { name: 'Open first' }));
      expect(onFirst.mock.calls).toEqual([['open']]);

      await user.click(screen.getByRole('button', { name: '2 more items' }));
      await user.click(await screen.findByRole('menuitem', { name: 'Second' }));
      await user.click(await screen.findByRole('menuitem', { name: 'Nested' }));
      await user.click(await screen.findByRole('menuitem', { name: 'Open deep' }));
      expect(onSecond.mock.calls).toEqual([['open'], ['open']]);
      expect(onFirst).toHaveBeenCalledTimes(1);

      // The same actions, once the row is wide enough to show them, keep the same owners.
      rowWidth = 100;
      rerender(<ActionRow overflow="visible" actions={actions} />);
      await user.click(screen.getByRole('button', { name: 'Second' }));
      await user.click(await screen.findByRole('menuitem', { name: 'Open second' }));
      expect(onSecond.mock.calls).toEqual([['open'], ['open'], ['open']]);
      expect(onFirst).toHaveBeenCalledTimes(1);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('UIC-ACTION-ROW-3.1 shows the selected count with a clear button while there is a selection', async () => {
    const onClearSelection = vi.fn();
    const { container, rerender } = render(
      <ActionRow
        selectedCount={3}
        onClearSelection={onClearSelection}
        actions={[{ verb: 'delete', onPress: noop }]}
      />,
    );
    const row = container.querySelector('.ui-action-row') as HTMLElement;
    expect(row).toHaveAttribute('data-selection', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('3 selected');
    expect(screen.getByRole('status')).toHaveClass('ui-action-row__count');
    const clear = screen.getByRole('button', { name: 'Clear selection' });
    expect(clear).toHaveClass('ui-action-row__clear');
    expectHooksMatchSpec(container, 'ACTION-ROW', {
      slots: ['selection', 'clear', 'count', 'actions', 'action'],
    });
    await userEvent.click(clear);
    expect(onClearSelection).toHaveBeenCalledTimes(1);
    screen.getByRole('button', { name: 'Delete' }).focus();
    await userEvent.keyboard('{Escape}');
    expect(onClearSelection).toHaveBeenCalledTimes(2);
    rerender(
      <ActionRow
        selectedCount={0}
        onClearSelection={onClearSelection}
        actions={[{ verb: 'delete', onPress: noop }]}
      />,
    );
    expect(container.querySelector('.ui-action-row')).toBeNull();
  });

  it('UIC-ACTION-ROW-3.1 leaves an Escape that an input method composition owns to the input method', async () => {
    const user = userEvent.setup();
    const onClearSelection = vi.fn();
    render(
      <ActionRow
        selectedCount={2}
        onClearSelection={onClearSelection}
        lead={<input aria-label="Rename" />}
        actions={[{ verb: 'delete', onPress: noop }]}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Rename' });
    await user.click(input);
    // Input methods have no user-event support: the composition events are dispatched directly.
    fireEvent.compositionStart(input);
    fireEvent.compositionUpdate(input, { data: 'か' });
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
    fireEvent.keyDown(input, { key: 'Escape', isComposing: true });
    // eslint-disable-next-line testing-library/prefer-user-event -- the key code 229 some browsers report as a composition ends
    fireEvent.keyDown(input, { key: 'Escape', keyCode: 229 });
    fireEvent.compositionEnd(input, { data: '' });
    expect(onClearSelection).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');

    await user.keyboard('{Escape}');
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });
});
