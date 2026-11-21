import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import { Dialog, type DialogProps, DialogTrigger } from './dialog.js';

/** A page with a field, a button that opens a floating dialog, and the dialog. */
function FloatingPage(props: Partial<DialogProps>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <input aria-label="Page field" />
      <button type="button" onClick={() => setOpen(true)}>
        Open notes
      </button>
      <Dialog
        title="Notes"
        {...props}
        isNonModal
        isOpen={open}
        onOpenChange={(next) => {
          props.onOpenChange?.(next);
          setOpen(next);
        }}
      >
        <input aria-label="Note" />
      </Dialog>
    </>
  );
}

const root = () => document.querySelector<HTMLElement>('.ui-dialog');

describe('Dialog presentations', () => {
  it('UIC-DIALOG-8.1 floats a non-modal dialog over a page that stays usable', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<FloatingPage onOpenChange={onOpenChange} />);
    const opener = screen.getByRole('button', { name: 'Open notes' });
    await user.click(opener);
    const dialog = await screen.findByRole('dialog', { name: 'Notes' });
    expect(root()).toHaveAttribute('data-non-modal', 'true');
    expect(root()).toHaveAttribute('data-layer', 'modal');
    expect(root()?.style.pointerEvents).toBe('none');
    expect(root()?.style.position).toBe('fixed');
    expect(dialog.parentElement).toHaveClass('ui-dialog__panel');
    expect(dialog.parentElement?.style.pointerEvents).toBe('auto');
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveFocus();
    expectHooksMatchSpec(document.body, 'DIALOG', { slots: ['panel', 'dialog', 'body'] });

    const field = screen.getByRole('textbox', { name: 'Page field' });
    expect(field).not.toHaveAttribute('aria-hidden');
    expect(field.closest('[inert]')).toBeNull();
    await user.click(field);
    expect(field).toHaveFocus();
    await user.type(field, 'Lima');
    expect(field).toHaveValue('Lima');
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('textbox', { name: 'Note' }));
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('UIC-DIALOG-8.1 keeps a non-modal dialog opened over a blocking one reachable and announced', async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <Button>Settings</Button>
        <Dialog title="Settings">
          <DialogTrigger>
            <Button>Notes</Button>
            <Dialog title="Notes" isNonModal cancelAction={null}>
              <input aria-label="Note" />
              <button type="button">Pin</button>
            </Dialog>
          </DialogTrigger>
        </Dialog>
      </DialogTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(await screen.findByRole('button', { name: 'Notes' }));
    const notes = await screen.findByRole('dialog', { name: 'Notes' });
    const note = screen.getByRole('textbox', { name: 'Note' });
    await waitFor(() => expect(note).toHaveFocus());
    expect(notes.closest('[aria-hidden="true"], [inert]')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Pin' }));
    expect(screen.getByRole('button', { name: 'Pin' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Notes' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
  });

  it('UIC-DIALOG-8.1 leaves focus where the reader moved it and honours keyboard dismissal settings', async () => {
    const user = userEvent.setup();
    function Toggle() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen(!open)}>
            Toggle
          </button>
          <Dialog title="Palette" isNonModal isOpen={open} isKeyboardDismissDisabled>
            <button type="button">Swatch</button>
          </Dialog>
        </>
      );
    }
    render(<Toggle />);
    expect(await screen.findByRole('button', { name: 'Swatch' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Palette' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle' })).toHaveFocus();
  });

  it('UIC-DIALOG-8.1 follows a DialogTrigger and calls onExitComplete once closed', async () => {
    const user = userEvent.setup();
    const onExitComplete = vi.fn();
    render(
      <DialogTrigger>
        <Button>Details</Button>
        <Dialog title="Details" isNonModal onExitComplete={onExitComplete}>
          <p>Body</p>
        </Dialog>
      </DialogTrigger>,
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    await user.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'Details' })).toHaveFocus();
    expect(onExitComplete).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onExitComplete).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  it('UIC-DIALOG-8.2 anchors a dialog to its trigger as a popover on the dropdown layer', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <DialogTrigger>
        <Button>Archive</Button>
        <Dialog
          title="Archive Report.pdf?"
          role="alertdialog"
          placement="bottom start"
          primaryAction={{ label: 'Archive', onPress: (close) => (onPress(), close()) }}
        />
      </DialogTrigger>,
    );
    const trigger = screen.getByRole('button', { name: 'Archive' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Archive Report.pdf?' });
    const popover = root();
    expect(popover).toHaveAttribute('data-layer', 'dropdown');
    expect(popover).toHaveAttribute('data-trigger', 'DialogTrigger');
    expect(popover).toHaveAttribute('data-placement');
    expect(popover).not.toHaveAttribute('role');
    expect(popover?.style.zIndex).toBe('130');
    expect(popover?.querySelector('.ui-dialog__panel')).toBeNull();
    expect(popover?.contains(dialog)).toBe(true);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expectHooksMatchSpec(document.body, 'DIALOG', { slots: ['dialog', 'footer'] });

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.click(trigger);
    await user.click(await screen.findByRole('button', { name: 'Archive', hidden: false }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-DIALOG-8.2 closes an anchored dialog on an outside press by default and accepts an opt-out', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Anchored({ isDismissable }: { isDismissable?: boolean | undefined }) {
      return (
        <>
          <button type="button">Outside</button>
          <DialogTrigger onOpenChange={onOpenChange}>
            <Button>Rename</Button>
            <Dialog title="Rename" placement="bottom" isDismissable={isDismissable}>
              <input aria-label="Name" />
            </Dialog>
          </DialogTrigger>
        </>
      );
    }
    const { unmount } = render(<Anchored isDismissable={false} />);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.click(document.body);
    expect(screen.getByRole('dialog', { name: 'Rename' })).toBeInTheDocument();
    unmount();
    onOpenChange.mockClear();
    render(<Anchored />);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.click(document.body);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
