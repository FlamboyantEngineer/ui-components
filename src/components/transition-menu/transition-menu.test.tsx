import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import {
  TransitionMenu,
  type TransitionMenuState,
  type TransitionMenuTransition,
} from './transition-menu.js';

const states: TransitionMenuState[] = [
  { id: 'open', label: 'Open', tone: 'info' },
  { id: 'active', label: 'In progress', tone: 'warning' },
  { id: 'done', label: 'Done', tone: 'success' },
  { id: 'dropped', label: 'Dropped' },
];

const transitions: TransitionMenuTransition[] = [
  { id: 'start', to: 'active', label: 'Start work', description: 'Assigns it to you' },
  { id: 'finish', to: 'done', confirmMessage: 'Finished items leave the board.' },
  { id: 'drop', to: 'dropped', requiresComment: true },
  { id: 'review', to: 'done', label: 'Send for review', disabledReason: 'Add a reviewer first' },
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

const trigger = () => screen.getByRole('button', { name: /^Status: Open/ });

beforeAll(() => {
  if (typeof Element.prototype.getAnimations !== 'function') {
    Element.prototype.getAnimations = () => [];
  }
});

describe('TransitionMenu', { timeout: 15_000 }, () => {
  it('UIC-TRANSITION-MENU-1.1 UIC-TRANSITION-MENU-1.7 shows the current state as a badge', () => {
    const { container, rerender } = render(
      <TransitionMenu
        states={states}
        value="open"
        transitions={transitions}
        onTransition={() => {}}
        className="extra"
        id="status"
        data-lab="status"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('SPAN');
    expect(root).toHaveClass('ui-transition-menu', 'extra');
    expect(root).toHaveAttribute('id', 'status');
    expect(root).toHaveAttribute('data-lab', 'status');
    const badge = container.querySelector('.ui-transition-menu__badge');
    expect(badge).toHaveClass('ui-badge');
    expect(badge).toHaveAttribute('data-tone', 'info');
    expect(badge).toHaveTextContent('Open');
    expectHooksMatchSpec(container, 'TRANSITION-MENU', {
      slots: ['trigger', 'badge'],
      callerAttributes: ['data-lab'],
    });
    rerender(
      <TransitionMenu states={states} value="dropped" transitions={[]} onTransition={() => {}} />,
    );
    expect(root).toHaveAttribute('data-readonly', 'true');
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('.ui-transition-menu__badge')).toHaveAttribute(
      'data-tone',
      'neutral',
    );
    rerender(
      <TransitionMenu states={states} value="archived" transitions={[]} onTransition={() => {}} />,
    );
    expect(root).toHaveTextContent('archived');
  });

  it('UIC-TRANSITION-MENU-1.2 UIC-TRANSITION-MENU-1.3 lists the transitions with their targets', async () => {
    const user = userEvent.setup();
    render(
      <TransitionMenu
        states={states}
        value="open"
        transitions={transitions}
        onTransition={() => {}}
      />,
    );
    expect(trigger()).toHaveClass('ui-transition-menu__trigger', 'ui-button');
    expect(trigger()).toHaveAttribute('data-variant', 'bare');
    expect(trigger().querySelector('[data-glyph="chevron-down"]')).not.toBeNull();
    await user.click(trigger());
    const menu = screen.getByRole('menu', { name: 'Status' });
    const items = within(menu).getAllByRole('menuitem');
    expect(items.map((item) => item.querySelector('.ui-menu-item__label')?.textContent)).toEqual([
      'Start work',
      'Done',
      'Dropped',
      'Send for review',
    ]);
    expect(items[0]).toHaveClass('ui-transition-menu__transition', 'ui-menu-item');
    expect(items.map((item) => item.getAttribute('data-target-tone'))).toEqual([
      'warning',
      'success',
      'neutral',
      'success',
    ]);
    expect(items[0]!.querySelector('.ui-status-light')).toHaveAttribute('data-tone', 'warning');
    expect(items[0]).toHaveTextContent('Assigns it to you');
    expect(items[3]).toHaveAttribute('aria-disabled', 'true');
    expect(items[3]).toHaveTextContent('Add a reviewer first');
    expectHooksMatchSpec(document.body, 'TRANSITION-MENU', { slots: ['transition'] });
  });

  it('UIC-TRANSITION-MENU-1.4 runs a transition and stays pending until it settles', async () => {
    const user = userEvent.setup();
    let run = deferred();
    const onTransition = vi.fn(() => run.promise);
    const { container } = render(
      <TransitionMenu
        states={states}
        value="open"
        transitions={transitions}
        onTransition={onTransition}
      />,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('menuitem', { name: /Start work/ }));
    expect(onTransition).toHaveBeenCalledWith({ transition: 'start', to: 'active' });
    expect(container.firstElementChild).toHaveAttribute('data-pending', 'true');
    await waitFor(() => expect(trigger()).toHaveAttribute('data-pending', 'true'));
    await act(async () => run.reject(new Error('Busy')));
    expect(container.firstElementChild).not.toHaveAttribute('data-pending');
    run = deferred();
    await user.click(trigger());
    await user.click(screen.getByRole('menuitem', { name: /Send for review/ }));
    expect(onTransition).toHaveBeenCalledTimes(1);
  });

  it('UIC-TRANSITION-MENU-1.5 confirms a transition in a dialog', async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn();
    render(
      <TransitionMenu
        states={states}
        value="open"
        transitions={transitions}
        onTransition={onTransition}
      />,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('menuitem', { name: /Done/ }));
    const dialog = screen.getByRole('dialog', { name: 'Move to Done' });
    expect(dialog).toHaveAccessibleDescription('Finished items leave the board.');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onTransition).not.toHaveBeenCalled();
    await user.click(trigger());
    await user.click(screen.getByRole('menuitem', { name: /Done/ }));
    await user.click(screen.getByRole('button', { name: 'Move to Done' }));
    expect(onTransition).toHaveBeenCalledWith({ transition: 'finish', to: 'done' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('UIC-TRANSITION-MENU-1.5 asks for a required comment', async () => {
    const user = userEvent.setup();
    const run = deferred();
    const onTransition = vi.fn(() => run.promise);
    render(
      <TransitionMenu
        states={states}
        value="open"
        transitions={transitions}
        onTransition={onTransition}
      />,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('menuitem', { name: /Dropped/ }));
    const dialog = screen.getByRole('dialog', { name: 'Move to Dropped' });
    const comment = within(dialog).getByRole('textbox', { name: /^Comment/ });
    expect(comment).toHaveFocus();
    expect(comment.closest('.ui-transition-menu__comment')).toHaveClass('ui-text-field');
    const action = within(dialog).getByRole('button', { name: 'Move to Dropped' });
    expect(action).toBeDisabled();
    await user.type(comment, '   ');
    expect(action).toBeDisabled();
    await user.type(comment, 'Out of scope ');
    await user.click(action);
    expect(onTransition).toHaveBeenCalledWith({
      transition: 'drop',
      to: 'dropped',
      comment: 'Out of scope',
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(async () => run.resolve());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('UIC-TRANSITION-MENU-1.6 refuses transitions while disabled', () => {
    const { container } = render(
      <TransitionMenu
        states={states}
        value="open"
        transitions={transitions}
        onTransition={() => {}}
        isDisabled
      />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-disabled', 'true');
    expect(trigger()).toBeDisabled();
  });

  it('UIC-TRANSITION-MENU-2.1 names the trigger and the menu and opens by keyboard', async () => {
    const user = userEvent.setup();
    render(
      <TransitionMenu
        states={states}
        value="active"
        label="Stage"
        transitions={transitions}
        onTransition={() => {}}
      />,
    );
    const button = screen.getByRole('button', { name: 'Stage: In progress' });
    expect(button).toHaveAttribute('aria-haspopup', 'true');
    button.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu', { name: 'Stage' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Start work/ })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: /Dropped/ })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(button).toHaveFocus());
  });
});
