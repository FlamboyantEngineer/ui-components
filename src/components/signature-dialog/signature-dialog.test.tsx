import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import { SignatureDialog, type SignatureDialogProps } from './signature-dialog.js';

const approve = [{ id: 'approve', label: 'Approved' }];
const meanings = [
  { id: 'approve', label: 'Approved', description: 'The change is ready to release.' },
  { id: 'review', label: 'Reviewed' },
  { id: 7, label: 'Authored' },
];

type HarnessProps = Partial<SignatureDialogProps>;

function Harness(props: HarnessProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Approve change
      </button>
      <SignatureDialog
        title="Sign the change"
        userName="Ada Lovelace"
        meanings={approve}
        onSign={() => undefined}
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

async function openHarness(props: HarnessProps = {}) {
  const user = userEvent.setup();
  render(<Harness {...props} />);
  await user.click(screen.getByRole('button', { name: 'Approve change' }));
  return { user, dialog: await screen.findByRole('dialog') };
}

function passwordInput() {
  return screen.getByLabelText(/^Password/, { selector: 'input' });
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe('SignatureDialog', { timeout: 15_000 }, () => {
  it('UIC-SIGNATURE-DIALOG-1.1 renders a modal with the summary, Cancel and Sign', async () => {
    const { dialog } = await openHarness({ children: <p>3 requirements change.</p> });
    expect(dialog).toHaveAccessibleName('Sign the change');
    expect(document.querySelector('.ui-modal')).toHaveClass('ui-signature-dialog');
    expect(screen.getByText('3 requirements change.').parentElement).toHaveClass(
      'ui-signature-dialog__summary',
    );
    const buttons = [...document.querySelectorAll('.ui-modal__actions button')];
    expect(buttons.map((button) => button.textContent)).toEqual(['Cancel', 'Sign']);
    expect(within(dialog).getByRole('textbox', { name: 'Reason' })).toHaveFocus();
    expectHooksMatchSpec(document.body, 'SIGNATURE-DIALOG', {
      slots: ['summary', 'form', 'meaning', 'signer'],
    });
  });

  it('UIC-SIGNATURE-DIALOG-1.1 takes the Sign label from props or the provider', () => {
    const { unmount } = render(
      <SignatureDialog
        title="Sign"
        userName="Ada"
        meanings={approve}
        onSign={vi.fn()}
        isOpen
        confirmLabel="Approve"
      />,
    );
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(document.querySelector('.ui-signature-dialog__summary')).toBeNull();
    unmount();
    render(
      <UiProvider strings={{ sign: 'Signer' }}>
        <SignatureDialog title="Sign" userName="Ada" meanings={approve} onSign={vi.fn()} isOpen />
      </UiProvider>,
    );
    expect(screen.getByRole('button', { name: 'Signer' })).toBeInTheDocument();
  });

  it('UIC-SIGNATURE-DIALOG-1.2 states one meaning and asks to choose among several', async () => {
    const { user } = await openHarness();
    expect(screen.getByText('Meaning of signature: Approved')).toHaveClass(
      'ui-signature-dialog__meaning',
    );
    expect(screen.queryByRole('radiogroup')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    render(
      <SignatureDialog title="Sign" userName="Ada" meanings={meanings} onSign={vi.fn()} isOpen />,
    );
    const group = screen.getByRole('radiogroup', { name: 'Meaning of signature' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual(['approve', 'review', '7']);
    expect(radios.some((radio) => (radio as HTMLInputElement).checked)).toBe(false);
    expect(within(group).getByRole('radio', { name: 'Approved' })).toHaveAccessibleDescription(
      'The change is ready to release.',
    );
    expect(document.querySelector('.ui-signature-dialog__meaning')).toBeNull();
  });

  it('UIC-SIGNATURE-DIALOG-1.3 asks for a reason and a drawing as configured', () => {
    const { unmount } = render(
      <SignatureDialog
        title="Sign"
        userName="Ada"
        meanings={approve}
        onSign={vi.fn()}
        isOpen
        reason="required"
        drawing="optional"
      />,
    );
    const reason = screen.getByRole('textbox', { name: 'Reason' });
    expect(reason.tagName).toBe('TEXTAREA');
    expect(reason).toHaveAttribute('aria-required', 'true');
    expect(screen.getByRole('img', { name: 'Signature' })).toBeInTheDocument();
    expect(document.querySelector('.ui-signature-pad')).not.toHaveAttribute('data-required');
    unmount();
    render(
      <SignatureDialog
        title="Sign"
        userName="Ada"
        meanings={approve}
        onSign={vi.fn()}
        isOpen
        reason="none"
        drawing="required"
      />,
    );
    expect(screen.queryByRole('textbox', { name: 'Reason' })).toBeNull();
    expect(document.querySelector('.ui-signature-pad')).toHaveAttribute('data-required', 'true');
  });

  it('UIC-SIGNATURE-DIALOG-1.4 shows the signer and asks for the password, or the user name too', async () => {
    const { user } = await openHarness();
    expect(screen.getByText('Signing as Ada Lovelace')).toHaveClass('ui-signature-dialog__signer');
    const password = passwordInput();
    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveAttribute('autocomplete', 'current-password');
    expect(password).toHaveAttribute('aria-required', 'true');
    expect(screen.queryByRole('textbox', { name: 'User name' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    render(
      <SignatureDialog
        title="Sign"
        userName="Ada"
        meanings={approve}
        onSign={vi.fn()}
        isOpen
        credentials="username-password"
      />,
    );
    const userName = screen.getByRole('textbox', { name: 'User name' });
    expect(userName).toHaveAttribute('autocomplete', 'username');
    expect(userName.compareDocumentPosition(passwordInput())).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('UIC-SIGNATURE-DIALOG-1.5 forwards the class, id and data attributes', () => {
    render(
      <SignatureDialog
        title="Sign"
        userName="Ada"
        meanings={approve}
        onSign={vi.fn()}
        isOpen
        className="caller"
        id="signing"
        data-testid="probe"
      />,
    );
    const overlay = document.querySelector('.ui-modal');
    expect(overlay).toHaveClass('ui-signature-dialog', 'caller');
    expect(overlay).toHaveAttribute('data-testid', 'probe');
    expect(screen.getByRole('dialog')).toHaveAttribute('id', 'signing');
    expect(document.querySelector('form')).toHaveClass('ui-form', 'ui-signature-dialog__form');
    expectHooksMatchSpec(document.body, 'SIGNATURE-DIALOG', { callerAttributes: ['data-testid'] });
  });

  it('UIC-SIGNATURE-DIALOG-2.1 validates every entry before signing and focuses the first missing one', async () => {
    const onSign = vi.fn();
    const { user } = await openHarness({ meanings, reason: 'required', onSign });
    await user.click(screen.getByRole('button', { name: 'Sign' }));
    expect(onSign).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Approved' })).toHaveFocus();
    const invalid = [...document.querySelectorAll('.ui-field[data-validation="invalid"]')];
    expect(invalid).toHaveLength(3);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Reviewed' }));
    await user.type(passwordInput(), 'plum');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSign).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Reason' })).toHaveFocus();
  });

  it('UIC-SIGNATURE-DIALOG-2.2 signs with the details, pending until onSign resolves, then closes', async () => {
    const signing = deferred();
    const onSign = vi.fn(() => signing.promise);
    const onOpenChange = vi.fn();
    const { user } = await openHarness({
      meanings,
      drawing: 'optional',
      credentials: 'username-password',
      onSign,
      onOpenChange,
    });
    await user.click(screen.getByRole('radio', { name: 'Authored' }));
    await user.click(screen.getByRole('radio', { name: 'Type' }));
    await user.type(screen.getByRole('textbox', { name: 'Signature' }), 'Ada L');
    await user.type(screen.getByRole('textbox', { name: 'User name' }), 'ada');
    await user.type(passwordInput(), 'pear-tree');
    await user.click(screen.getByRole('button', { name: 'Sign' }));
    expect(onSign).toHaveBeenCalledWith({
      userName: 'ada',
      password: 'pear-tree',
      meaning: 7,
      reason: '',
      signature: { kind: 'typed', text: 'Ada L' },
    });
    expect(screen.getByRole('button', { name: /Sign/ })).toHaveAttribute('data-pending', 'true');
    await act(async () => signing.resolve());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('UIC-SIGNATURE-DIALOG-2.2 shows a failure, clears the password and keeps the other entries', async () => {
    const onSign = vi
      .fn()
      .mockRejectedValueOnce(new Error('The password is not right.'))
      .mockImplementationOnce(() => {
        throw new Error('The service is unavailable.');
      });
    const { user } = await openHarness({ onSign });
    await user.type(screen.getByRole('textbox', { name: 'Reason' }), 'Release');
    const password = passwordInput();
    await user.type(password, 'plum');
    await user.click(screen.getByRole('button', { name: 'Sign' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The password is not right.');
    expect(password).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Reason' })).toHaveValue('Release');
    expect(onSign).toHaveBeenCalledWith({
      userName: 'Ada Lovelace',
      password: 'plum',
      meaning: 'approve',
      reason: 'Release',
      signature: null,
    });
    await user.type(password, 'fig');
    await user.click(screen.getByRole('button', { name: 'Sign' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The service is unavailable.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('UIC-SIGNATURE-DIALOG-2.2 cancels without signing and starts each opening empty', async () => {
    const onSign = vi.fn();
    const { user } = await openHarness({ onSign });
    await user.type(passwordInput(), 'plum');
    // The first Escape reverts the uncommitted password, as in any text field; the second closes.
    await user.keyboard('{Escape}');
    expect(passwordInput()).toHaveValue('');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await user.click(screen.getByRole('button', { name: 'Approve change' }));
    expect(await screen.findByLabelText(/^Password/, { selector: 'input' })).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onSign).not.toHaveBeenCalled();
  });
});
