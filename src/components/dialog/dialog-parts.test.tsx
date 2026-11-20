import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import {
  AlertDialog,
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Sheet,
} from './dialog.js';

describe('Dialog parts', () => {
  it('UIC-DIALOG-4.4 names and describes the dialog, focuses the body and closes from the footer', async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <Button>View delivery details</Button>
        <Dialog>
          <DialogHeader>
            <DialogTitle id="delivery-title">Delivery details</DialogTitle>
            <DialogDescription id="delivery-note">The parcel ships on Tuesday.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <button type="button">Show address</button>
          </DialogBody>
          <DialogFooter>
            <DialogClose>Done</DialogClose>
          </DialogFooter>
        </Dialog>
      </DialogTrigger>,
    );
    const trigger = screen.getByRole('button', { name: 'View delivery details' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Delivery details' });
    expect(dialog).toHaveAccessibleDescription('The parcel ships on Tuesday.');
    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'delivery-title');
    expect(screen.getByRole('button', { name: 'Show address' })).toHaveFocus();
    expectHooksMatchSpec(document.body, 'DIALOG', {
      slots: ['header', 'title', 'description', 'body', 'footer', 'close'],
    });
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('UIC-DIALOG-4.2 UIC-DIALOG-4.4 keeps the composed title when adding a built-in close button', async () => {
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen showCloseButton>
        <DialogHeader>
          <DialogTitle>Shipping options</DialogTitle>
        </DialogHeader>
      </Dialog>,
    );
    expect(screen.getByRole('dialog', { name: 'Shipping options' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('UIC-DIALOG-2.3 UIC-DIALOG-4.4 disables a composed close button when dismissal is refused', () => {
    render(
      <Dialog defaultOpen isDismissDisabled>
        <DialogTitle>Uploading</DialogTitle>
        <DialogClose>Close</DialogClose>
      </Dialog>,
    );
    expect(screen.getByRole('dialog', { name: 'Uploading' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
  });

  it('UIC-DIALOG-21.1 opens a composed alert without outside dismissal', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog defaultOpen>
        <DialogTitle>Delivery interrupted</DialogTitle>
        <DialogDescription>A new address is required.</DialogDescription>
        <DialogClose>Return to address</DialogClose>
      </AlertDialog>,
    );
    const dialog = screen.getByRole('alertdialog', { name: 'Delivery interrupted' });
    expect(dialog).toHaveAccessibleDescription('A new address is required.');
    await user.click(dialog.closest('.ui-dialog') as HTMLElement);
    expect(dialog).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Return to address' })).toHaveFocus(),
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('UIC-DIALOG-8.3 shares the dialog dismissal and focus behavior at the viewport edge', async () => {
    const user = userEvent.setup();
    render(
      <DialogTrigger>
        <Button>Order summary</Button>
        <Sheet>
          <DialogTitle>Order summary</DialogTitle>
          <DialogClose>Done</DialogClose>
        </Sheet>
      </DialogTrigger>,
    );
    const trigger = screen.getByRole('button', { name: 'Order summary' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Order summary' });
    const overlay = dialog.closest('.ui-dialog') as HTMLElement;
    expect(overlay).toHaveAttribute('data-side', 'right');
    expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus();
    await user.click(overlay);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
