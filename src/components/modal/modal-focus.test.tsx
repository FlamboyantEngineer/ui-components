import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Modal, type ModalProps } from './modal.js';

type PageProps = Pick<ModalProps, 'initialFocus' | 'finalFocus' | 'isNonModal'>;

/** A page with a target button, an opener and a modal with two fields and a primary action. */
function Page({ initialFocus, finalFocus, isNonModal, refs }: PageProps & { refs?: boolean }) {
  const [open, setOpen] = useState(false);
  const cityRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <button type="button" ref={afterRef}>
        After
      </button>
      <Modal
        title="Address"
        isOpen={open}
        onOpenChange={setOpen}
        isNonModal={isNonModal}
        initialFocus={refs ? cityRef : initialFocus}
        finalFocus={refs ? afterRef : finalFocus}
        primaryAction={{ label: 'Save', autoFocus: true, onPress: (close) => close() }}
      >
        <input aria-label="Street" />
        <input aria-label="City" ref={cityRef} />
      </Modal>
    </>
  );
}

describe('Modal focus targets', () => {
  it('UIC-MODAL-3.4 focuses the chosen elements on open and on close, given as refs', async () => {
    const user = userEvent.setup();
    render(<Page refs />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('textbox', { name: 'City' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('button', { name: 'After' })).toHaveFocus());
  });

  it('UIC-MODAL-3.4 asks function targets when focus moves, and the floating dialog honours them', async () => {
    const user = userEvent.setup();
    const byName = (name: string) => () => screen.queryByRole<HTMLElement>('textbox', { name });
    const after = () => screen.getByRole('button', { name: 'After' });
    render(<Page isNonModal initialFocus={byName('Street')} finalFocus={after} />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('textbox', { name: 'Street' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(after()).toHaveFocus();
  });

  it('UIC-MODAL-3.4 falls back to the default focus when a target names no element', async () => {
    const user = userEvent.setup();
    render(<Page initialFocus={() => null} finalFocus={() => undefined} />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await user.click(opener);
    // The primary action's `autoFocus` applies again once the chosen element is missing.
    expect(await screen.findByRole('button', { name: 'Save' })).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
