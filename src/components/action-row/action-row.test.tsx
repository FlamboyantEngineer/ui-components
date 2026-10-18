import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
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
      <UiProvider strings={{ edit: 'Modifier' }}>
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
            icon: 'expand',
            label: 'Full screen',
            isSelected: true,
            onPress,
          },
          {
            verb: 'custom',
            id: 'pin',
            icon: <svg data-testid="pin" />,
            label: 'Pin',
            isSelected: false,
            ref,
          },
          { verb: 'custom', id: 'help', icon: 'help', label: 'Help' },
        ]}
      />,
    );
    const full = screen.getByRole('button', { name: 'Full screen' });
    expect(full).toHaveAttribute('aria-pressed', 'true');
    expect(full).toHaveAttribute('data-selected', 'true');
    expect(full.querySelector('[data-glyph]')).toHaveAttribute('data-glyph', 'expand');
    expect(screen.getByRole('button', { name: 'Pin' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('pin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Help' })).not.toHaveAttribute('aria-pressed');
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Pin' }));
    await userEvent.click(full);
    expect(onPress).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'ACTION-ROW');
  });

  it('UIC-ACTION-ROW-1.3 draws custom actions in their order, then the verbs in a fixed order', () => {
    const actions: ActionRowAction[] = [
      { verb: 'cancel', id: 'cancel', onPress: noop },
      { verb: 'custom', id: 'second-custom', icon: 'info', label: 'History', onPress: noop },
      { verb: 'save', id: 'save', onPress: noop },
      { verb: 'edit', id: 'edit', onPress: noop },
      { verb: 'custom', id: 'first-custom', icon: 'expand', label: 'Full screen', onPress: noop },
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
    expect(buttons(container).map((button) => button.id)).toEqual(expected);
    expect(orderActions(actions).map((action) => action.id)).toEqual(expected);
  });

  it('UIC-ACTION-ROW-1.4 shows the tooltip on keyboard focus without changing the name', async () => {
    render(
      <ActionRow
        actions={[
          { verb: 'refresh', onPress: noop },
          {
            verb: 'custom',
            icon: 'expand',
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

    await userEvent.tab();
    const refresh = screen.getByRole('button', { name: 'Refresh' });
    expect(refresh).toHaveFocus();
    const tooltip = await screen.findByRole('tooltip', { name: 'Refresh' });
    expect(tooltip).toHaveClass('ui-action-row__tooltip');
    expect(refresh).toHaveAttribute('aria-describedby', tooltip.id);
    expectHooksMatchSpec(document.body, 'ACTION-ROW', { slots: ['tooltip'] });
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
            icon: 'info',
            label: 'Details',
            isExpanded: false,
            'aria-haspopup': 'dialog',
            'data-section': 'details',
            onPress,
          },
        ]}
      />,
    );
    const byId = (id: string) => container.querySelector<HTMLButtonElement>(`#${id}`);
    expect(byId('add')).toBeDisabled();
    expect(byId('add')).toHaveAttribute('aria-controls', 'list');
    expect(byId('edit')).toBeEnabled();
    expect(byId('edit')).toHaveAttribute('aria-disabled', 'true');
    expect(byId('save')).toHaveAttribute('data-pending', 'true');
    expect(byId('save')).toHaveAccessibleName(/^Save/);
    expect(within(byId('save') as HTMLElement).getByRole('progressbar')).toHaveAccessibleName(
      'Saving',
    );
    expect(byId('details')).toHaveAttribute('aria-expanded', 'false');
    expect(byId('details')).toHaveAttribute('aria-haspopup', 'dialog');
    expect(byId('details')).toHaveAttribute('data-section', 'details');
    expect(byId('details')).toHaveAttribute('data-verb', 'custom');
    await userEvent.click(byId('edit') as HTMLButtonElement);
    await userEvent.click(byId('save') as HTMLButtonElement);
    expect(onPress).not.toHaveBeenCalled();
    await userEvent.click(byId('details') as HTMLButtonElement);
    expect(onPress).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'ACTION-ROW', { callerAttributes: ['data-section'] });
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
              { id: 'export', label: 'Export', icon: 'upload', shortcut: 'Ctrl+E' },
              { id: 'archive', label: 'Archive', onAction: onArchive },
              { id: 'locked', label: 'Rename', isDisabled: true },
              { type: 'separator', id: 'rule' },
              {
                type: 'section',
                id: 'danger',
                title: 'Danger zone',
                items: [{ id: 'delete', label: 'Delete', icon: 'delete', tone: 'danger' }],
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
    const menu = screen.getByRole('menu', { name: 'More actions' });
    expect(more).toHaveAttribute('aria-controls', menu.id);
    expect(menu).toHaveAttribute('data-size', 'sm');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.dataset.key),
    ).toEqual(['export', 'archive', 'locked', 'delete']);
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
    expect(screen.getByRole('menuitem', { name: /Export/ })).toHaveFocus();
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
            icon: 'sort-ascending',
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
      expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
        'More',
        'Edit',
        'Delete',
      ]);
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
      expect(onEdit).toHaveBeenCalledTimes(1);

      await userEvent.click(more);
      await userEvent.click(screen.getByRole('menuitem', { name: 'More' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
      expect(onAction.mock.calls[0]?.[0]).toBe('rename');
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
});
