import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { DialogTrigger } from '../../primitives/index.js';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { ModalHost, createModalController } from '../modal-controller/modal-controller.js';
import { ConfirmDialog, confirm, type ConfirmDialogProps } from './confirm-dialog.js';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function Harness(props: Omit<ConfirmDialogProps, 'isOpen' | 'title'> & { title?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Delete file
      </button>
      <ConfirmDialog
        title="Delete Report.pdf?"
        message="The file moves to the bin."
        {...props}
        isOpen={open}
        onOpenChange={(next) => {
          props.onOpenChange?.(next);
          setOpen(next);
        }}
      />
    </>
  );
}

async function openHarness(props: Parameters<typeof Harness>[0] = {}) {
  render(<Harness {...props} />);
  const trigger = screen.getByRole('button', { name: 'Delete file' });
  await userEvent.click(trigger);
  return { trigger, dialog: await screen.findByRole('alertdialog') };
}

describe('ConfirmDialog', () => {
  it('UIC-CONFIRM-DIALOG-1.1 renders an alert dialog with its message and two actions', async () => {
    const { dialog } = await openHarness({ children: <p>Shared with 3 people.</p> });
    expect(dialog).toHaveAccessibleName('Delete Report.pdf?');
    expect(dialog).toHaveAccessibleDescription('The file moves to the bin.');
    const message = screen.getByText('The file moves to the bin.');
    expect(message).toHaveClass('ui-confirm-dialog__message');
    expect(message.nextElementSibling).toHaveTextContent('Shared with 3 people.');
    expect(document.querySelector('.ui-modal')).toHaveClass('ui-confirm-dialog');
    const buttons = [...document.querySelectorAll('.ui-modal__actions button')];
    expect(buttons.map((button) => button.textContent)).toEqual(['Cancel', 'Confirm']);
    expectHooksMatchSpec(document.body, 'CONFIRM-DIALOG', { slots: ['message'] });
    expectHooksMatchSpec(document.body, 'MODAL', { slots: ['cancel', 'primary'] });
  });

  it('UIC-CONFIRM-DIALOG-1.1 takes labels from props or the provider', async () => {
    render(
      <UiProvider strings={{ confirm: 'Yes', cancel: 'No' }}>
        <ConfirmDialog title="Leave?" isOpen />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
    expect(document.querySelector('.ui-modal__body')).toBeNull();
  });

  it('UIC-CONFIRM-DIALOG-1.2 confirms without cancelling and cancels through every dismissal', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    await openHarness({ onConfirm, onCancel, onOpenChange, confirmLabel: 'Delete' });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete file' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Delete file' }));
    await screen.findByRole('alertdialog');
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('UIC-CONFIRM-DIALOG-1.2 stays pending while onConfirm runs and open when it fails', async () => {
    const task = deferred();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Archive?"
        isOpen
        isDismissable
        onCancel={onCancel}
        confirmLabel="Archive"
        pendingLabel="Archiving"
        onConfirm={() => task.promise}
      />,
    );
    const archive = screen.getByRole('button', { name: 'Archive' });
    await userEvent.click(archive);
    expect(archive).toHaveAttribute('data-pending', 'true');
    expect(screen.getByRole('progressbar', { name: 'Archiving' })).toBeInTheDocument();
    await act(async () => {
      task.resolve();
      await task.promise;
    });
    expect(onCancel).not.toHaveBeenCalled();

    const { unmount: unmountFailing } = render(
      <ConfirmDialog
        title="Archive again?"
        isOpen
        confirmLabel="Retry"
        onConfirm={() => Promise.reject(new Error('Archive refused.'))}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Archive refused.');
    expect(screen.getByRole('alertdialog', { name: 'Archive again?' })).toBeInTheDocument();
    unmountFailing();
  });

  it('UIC-CONFIRM-DIALOG-1.2 cancels on an outside press only when dismissable', async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="Discard?" isOpen isDismissable onCancel={onCancel} />);
    await userEvent.click(document.querySelector('.ui-modal') as HTMLElement);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('UIC-CONFIRM-DIALOG-1.3 focuses Cancel first and returns focus to the trigger', async () => {
    const { trigger } = await openHarness();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('UIC-CONFIRM-DIALOG-1.3 focuses the confirm action when asked', async () => {
    await openHarness({ autoFocusConfirm: true, confirmLabel: 'Delete' });
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus();
  });

  it('UIC-CONFIRM-DIALOG-1.4 marks a destructive decision with the danger tone', () => {
    const { rerender } = render(<ConfirmDialog title="Keep?" isOpen confirmLabel="Keep" />);
    expect(document.querySelector('.ui-modal')).toHaveAttribute('data-tone', 'neutral');
    expect(screen.getByRole('button', { name: 'Keep' })).toHaveAttribute('data-variant', 'primary');
    rerender(<ConfirmDialog title="Delete?" isOpen tone="danger" confirmLabel="Delete" />);
    expect(document.querySelector('.ui-modal')).toHaveAttribute('data-tone', 'danger');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute(
      'data-variant',
      'danger',
    );
  });

  it('UIC-CONFIRM-DIALOG-1.5 renders a string message as text', () => {
    render(
      <ConfirmDialog title="Delete?" isOpen message={'Delete <img src=x onerror="boom()"> now?'} />,
    );
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('Delete <img src=x onerror="boom()"> now?')).toBeInTheDocument();
  });

  it('UIC-CONFIRM-DIALOG-1.6 offers a third action that closes without cancelling', async () => {
    const onSecondaryAction = vi.fn();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    await openHarness({
      title: 'Save changes to Report.pdf?',
      confirmLabel: 'Save',
      secondaryActionLabel: "Don't save",
      onSecondaryAction,
      onConfirm,
      onCancel,
    });
    const buttons = [...document.querySelectorAll('.ui-modal__actions button')];
    expect(buttons.map((button) => button.textContent)).toEqual(['Cancel', "Don't save", 'Save']);
    expect(screen.getByRole('button', { name: "Don't save" })).toHaveClass('ui-modal__secondary');
    await userEvent.click(screen.getByRole('button', { name: "Don't save" }));
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('UIC-CONFIRM-DIALOG-1.7 draws the glyph of a news tone, or the caller icon, before the title', () => {
    const { rerender } = render(<ConfirmDialog title="Saved" isOpen tone="success" />);
    const overlay = () => document.querySelector('.ui-modal');
    const icon = () => document.querySelector('.ui-confirm-dialog__icon');
    expect(overlay()).toHaveAttribute('data-tone', 'success');
    expect(icon()).toHaveAttribute('data-glyph', 'success');
    expect(icon()?.closest('h2')).toHaveClass('ui-modal__title');
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Saved');
    expectHooksMatchSpec(document.body, 'CONFIRM-DIALOG', { slots: ['icon'] });
    for (const tone of ['info', 'warning'] as const) {
      rerender(<ConfirmDialog title="Note" isOpen tone={tone} />);
      expect(icon()).toHaveAttribute('data-glyph', tone);
    }
    rerender(<ConfirmDialog title="Delete?" isOpen tone="danger" />);
    expect(icon()).toBeNull();
    rerender(<ConfirmDialog title="Upload failed" isOpen tone="danger" icon="error" />);
    expect(icon()).toHaveAttribute('data-glyph', 'error');
    rerender(<ConfirmDialog title="Plain" isOpen tone="info" icon={null} />);
    expect(icon()).toBeNull();
  });

  it('UIC-CONFIRM-DIALOG-1.8 leaves Cancel out and focuses the action of an acknowledgement', async () => {
    const onCancel = vi.fn();
    await openHarness({ cancelLabel: null, confirmLabel: 'Got it', onCancel });
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Got it' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('UIC-CONFIRM-DIALOG-1.9 anchors the confirmation to its trigger', async () => {
    const onConfirm = vi.fn();
    render(
      <DialogTrigger>
        <Button>Remove</Button>
        <ConfirmDialog
          title="Remove Lima?"
          message="It leaves the list."
          placement="top"
          confirmLabel="Remove"
          onConfirm={onConfirm}
        />
      </DialogTrigger>,
    );
    const trigger = screen.getByRole('button', { name: 'Remove' });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Remove Lima?' });
    expect(dialog).toHaveAccessibleDescription('It leaves the list.');
    const root = document.querySelector('.ui-confirm-dialog');
    expect(root).toHaveClass('ui-modal');
    expect(root).toHaveAttribute('data-trigger', 'DialogTrigger');
    expect(root).toHaveAttribute('data-layer', 'dropdown');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Remove', hidden: false }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('UIC-CONFIRM-DIALOG-2.1 resolves true after confirming and false otherwise', async () => {
    const controller = createModalController();
    render(<ModalHost controller={controller} />);

    let answer!: Promise<boolean>;
    const onConfirm = vi.fn();
    act(() => {
      answer = confirm(controller, {
        title: 'Delete Report.pdf?',
        message: 'This cannot be undone.',
        confirmLabel: 'Delete',
        tone: 'danger',
        onConfirm,
      });
    });
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete Report.pdf?' });
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
    const settled = vi.fn();
    void answer.then(settled);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await expect(answer).resolves.toBe(true);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(settled).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).toEqual([]);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    act(() => {
      answer = confirm(controller, { title: 'Archive?' });
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await expect(answer).resolves.toBe(false);

    act(() => {
      answer = confirm(controller, { title: 'Leave?' });
    });
    await screen.findByRole('alertdialog');
    await userEvent.keyboard('{Escape}');
    await expect(answer).resolves.toBe(false);

    const onSecondaryAction = vi.fn();
    act(() => {
      answer = confirm(controller, {
        title: 'Save?',
        secondaryActionLabel: "Don't save",
        onSecondaryAction,
      });
    });
    await userEvent.click(await screen.findByRole('button', { name: "Don't save" }));
    await expect(answer).resolves.toBe(false);
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);

    act(() => {
      answer = confirm(controller, { title: 'Close all?' });
    });
    act(() => controller.closeAll());
    await expect(answer).resolves.toBe(false);
  });

  it('UIC-CONFIRM-DIALOG-3.1 appends the caller class and forwards data attributes and id', () => {
    render(
      <ConfirmDialog
        title="Hooks?"
        isOpen
        className="caller"
        id="confirm-hooks"
        data-purpose="leave"
      />,
    );
    const root = screen.getByRole('alertdialog').closest('.ui-modal');
    expect(root).toHaveClass('ui-modal', 'ui-confirm-dialog', 'caller');
    expect(root).toHaveAttribute('data-purpose', 'leave');
    expect(screen.getByRole('alertdialog')).toHaveAttribute('id', 'confirm-hooks');
    expectHooksMatchSpec(document.body, 'CONFIRM-DIALOG', { callerAttributes: ['data-purpose'] });
  });
});
