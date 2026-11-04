import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { Modal, type ModalProps, ModalTrigger } from './modal.js';

/** A field that cancels its draft on the first Escape, handling it, and lets later ones pass. */
function DraftField({ label = 'Note' }: { label?: string }) {
  const hasDraft = useRef(true);
  return (
    <input
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !hasDraft.current) return;
        hasDraft.current = false;
        event.preventDefault();
      }}
    />
  );
}

/** A controlled modal holding a draft field, reporting closes through `onOpenChange`. */
function Page(props: Partial<ModalProps>) {
  const [isOpen, setOpen] = useState(true);
  return (
    <Modal
      title="Edit"
      {...props}
      isOpen={isOpen}
      onOpenChange={(next) => {
        props.onOpenChange?.(next);
        setOpen(next);
      }}
    >
      <DraftField />
    </Modal>
  );
}

const note = () => screen.getByRole('textbox', { name: 'Note' });

describe('Modal and an Escape its content handled', () => {
  it.each([
    ['blocking', {}],
    ['floating', { isNonModal: true }],
  ])(
    'UIC-MODAL-2.1 keeps a %s modal open on a handled Escape and closes it on the next',
    async (_, props) => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<Page {...props} onOpenChange={onOpenChange} />);
      note().focus();
      await user.keyboard('{Escape}');
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: 'Edit' })).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: 'Edit' })).not.toBeInTheDocument(),
      );
    },
  );

  it('UIC-MODAL-2.1 keeps an anchored modal open on a handled Escape', async () => {
    const user = userEvent.setup();
    render(
      <ModalTrigger>
        <Button>Rename</Button>
        <Modal title="Rename" placement="bottom">
          <DraftField />
        </Modal>
      </ModalTrigger>,
    );
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await screen.findByRole('dialog', { name: 'Rename' });
    note().focus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Rename' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Rename' })).not.toBeInTheDocument(),
    );
  });

  it('UIC-MODAL-2.1 UIC-MODAL-2.4 asks no veto for a handled Escape and keeps vetoes and refusals', async () => {
    const user = userEvent.setup();
    const shouldCloseOnEscape = vi.fn(() => false);
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <Page shouldCloseOnEscape={shouldCloseOnEscape} onOpenChange={onOpenChange} />,
    );
    note().focus();
    await user.keyboard('{Escape}');
    expect(shouldCloseOnEscape).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(shouldCloseOnEscape).toHaveBeenCalledOnce();
    expect(onOpenChange).not.toHaveBeenCalled();
    unmount();

    render(<Page isKeyboardDismissDisabled onOpenChange={onOpenChange} />);
    note().focus();
    await user.keyboard('{Escape}');
    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('UIC-MODAL-2.1 leaves an Escape pressed while composing text to the input method', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Page isNonModal onOpenChange={onOpenChange} />);
    note().focus();
    // The draft takes the first Escape, so the next would close the dialog if it were not composed.
    await user.keyboard('{Escape}');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set isComposing on a keydown
    fireEvent.keyDown(note(), { key: 'Escape', isComposing: true });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('UIC-MODAL-2.1 UIC-POPOVER-2.1 keeps nested overlays open on a handled Escape and closes the topmost next', async () => {
    const user = userEvent.setup();
    const outerChange = vi.fn();
    render(
      <Modal title="Outer" isOpen onOpenChange={outerChange}>
        <PopoverTrigger>
          <Button>Filters</Button>
          <Popover title="Filters">
            <DraftField label="City" />
          </Popover>
        </PopoverTrigger>
      </Modal>,
    );
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await screen.findByRole('dialog', { name: 'Filters' });
    screen.getByRole('textbox', { name: 'City' }).focus();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument(),
    );
    expect(outerChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Outer' })).toBeInTheDocument();
  });
});
