import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
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
          { verb: 'edit', id: 'edit', isDisabled: true, tooltip: 'Locked by Ana', onPress },
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
    expect(byId('edit')).not.toBeDisabled();
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

  it('UIC-ACTION-ROW-1.6 wraps the more verb in a menu trigger', async () => {
    const onAction = vi.fn();
    render(
      <ActionRow
        actions={[
          {
            verb: 'more',
            id: 'more',
            wrap: (button) => (
              <MenuTrigger>
                {button}
                <Popover>
                  <Menu aria-label="More" onAction={onAction}>
                    <MenuItem id="export">Export</MenuItem>
                    <MenuItem id="archive">Archive</MenuItem>
                  </Menu>
                </Popover>
              </MenuTrigger>
            ),
          },
        ]}
      />,
    );
    const more = screen.getByRole('button', { name: 'More' });
    expect(more).toHaveAttribute('aria-haspopup', 'true');
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    const menu = await screen.findByRole('menu');
    expect(more).toHaveAttribute('aria-controls', menu.id);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Export' }));
    expect(onAction.mock.calls[0]?.[0]).toBe('export');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(more).toHaveAttribute('aria-expanded', 'false');
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

    rerender(<ActionRow actions={[]} />);
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
});
