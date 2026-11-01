import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../button/button.js';
import { ModalTrigger } from '../modal/modal.js';
import { SignatureDialog, type SignatureDialogProps } from './signature-dialog.js';

const approve = [{ id: 'approve', label: 'Approved' }];

type DialogProps = Partial<SignatureDialogProps>;

function Dialog(props: DialogProps) {
  return (
    <SignatureDialog
      title="Sign the change"
      userName="Ada Lovelace"
      meanings={approve}
      onSign={() => undefined}
      isOpen
      {...props}
    />
  );
}

const passwordInput = () => screen.getByLabelText(/^Password/, { selector: 'input' });
const reasonBox = () => screen.queryByRole('textbox', { name: /^Reason/ });

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe('SignatureDialog entries no longer asked for', { timeout: 15_000 }, () => {
  it('UIC-SIGNATURE-DIALOG-2.2 signs without a reason or a signature once they are not asked, and keeps them for later', async () => {
    const user = userEvent.setup();
    const onSign = vi.fn();
    const asked = { reason: 'optional', drawing: 'optional', onSign } as const;
    const { rerender } = render(<Dialog {...asked} />);
    await user.type(requireReason(), 'Private draft reason');
    await user.click(screen.getByRole('radio', { name: 'Type' }));
    await user.type(screen.getByRole('textbox', { name: 'Signature' }), 'Ada L');
    await user.type(passwordInput(), 'pear-tree');
    rerender(<Dialog {...asked} reason="none" drawing="none" />);
    rerender(<Dialog {...asked} />);
    expect(requireReason()).toHaveValue('Private draft reason');
    rerender(<Dialog {...asked} reason="none" drawing="none" />);
    expect(reasonBox()).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign' }));
    expect(onSign).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'pear-tree', reason: '', signature: null }),
    );
  });

  it('UIC-SIGNATURE-DIALOG-2.1 drops the requirement of an entry no longer asked for', async () => {
    const user = userEvent.setup();
    const onSign = vi.fn();
    const { rerender } = render(<Dialog reason="required" drawing="required" onSign={onSign} />);
    await user.type(passwordInput(), 'pear-tree');
    await user.click(screen.getByRole('button', { name: 'Sign' }));
    expect(onSign).not.toHaveBeenCalled();
    rerender(<Dialog reason="none" drawing="none" onSign={onSign} />);
    await user.click(screen.getByRole('button', { name: 'Sign' }));
    expect(onSign).toHaveBeenCalledWith(expect.objectContaining({ reason: '', signature: null }));
  });
});

function requireReason() {
  const box = reasonBox();
  if (!box) throw new Error('No reason box');
  return box;
}

describe('SignatureDialog signing sessions', { timeout: 15_000 }, () => {
  it.each([
    ['another signer', { userName: 'Blair Quinn' }],
    ['other credentials', { credentials: 'username-password' }],
  ] as const)(
    'UIC-SIGNATURE-DIALOG-2.3 asks for the credentials again for %s',
    async (_, change) => {
      const user = userEvent.setup();
      const onSign = vi.fn();
      const { rerender } = render(<Dialog onSign={onSign} />);
      await user.type(requireReason(), 'Release');
      await user.type(passwordInput(), 'pear-tree');
      rerender(<Dialog onSign={onSign} {...change} />);
      expect(passwordInput()).toHaveValue('');
      expect(requireReason()).toHaveValue('');
      await user.click(screen.getByRole('button', { name: 'Sign' }));
      expect(onSign).not.toHaveBeenCalled();
    },
  );

  it('UIC-SIGNATURE-DIALOG-2.3 starts a new opening empty even while the last one is still leaving', async () => {
    const user = userEvent.setup();
    const onSign = vi.fn();
    const { rerender } = render(<Dialog onSign={onSign} />);
    await user.type(requireReason(), 'Release');
    await user.type(passwordInput(), 'pear-tree');
    rerender(<Dialog onSign={onSign} isOpen={false} />);
    rerender(<Dialog onSign={onSign} userName="Blair Quinn" />);
    expect(await screen.findByLabelText(/^Password/, { selector: 'input' })).toHaveValue('');
    expect(requireReason()).toHaveValue('');
  });

  it('UIC-SIGNATURE-DIALOG-2.3 clears the entries of a dialog its trigger opens, at each close', async () => {
    const user = userEvent.setup();
    render(
      <ModalTrigger>
        <Button>Approve change</Button>
        <SignatureDialog
          title="Sign the change"
          userName="Ada Lovelace"
          meanings={approve}
          onSign={() => undefined}
        />
      </ModalTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Approve change' }));
    await user.type(await screen.findByLabelText(/^Password/, { selector: 'input' }), 'plum');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Approve change' }));
    expect(await screen.findByLabelText(/^Password/, { selector: 'input' })).toHaveValue('');
  });

  it('UIC-SIGNATURE-DIALOG-2.3 lets a signing that settles after its session ended close or fail nothing', async () => {
    const user = userEvent.setup();
    const first = deferred();
    const second = deferred();
    const onSign = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const onOpenChange = vi.fn();
    const props = { onSign, onOpenChange };
    const { rerender } = render(<Dialog {...props} />);
    await user.type(passwordInput(), 'pear-tree');
    await user.click(screen.getByRole('button', { name: 'Sign' }));
    rerender(<Dialog {...props} userName="Blair Quinn" />);
    await act(async () => first.resolve());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.type(passwordInput(), 'fig-tree');
    await user.click(screen.getByRole('button', { name: 'Sign' }));
    rerender(<Dialog {...props} />);
    await user.type(passwordInput(), 'plum-tree');
    await act(async () => second.reject(new Error('The password is not right.')));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(passwordInput()).toHaveValue('plum-tree');
  });
});
