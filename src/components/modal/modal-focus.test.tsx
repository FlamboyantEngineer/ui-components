import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PortalContainerProvider } from '../portal/portal.js';
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
  it.each([false, true])(
    'UIC-MODAL-3.1 UIC-MODAL-3.4 skips unavailable fields with an explicit target %s',
    (isChosen) => {
      const focus = HTMLElement.prototype.focus;
      // jsdom does not implement the browser's CSS visibility check when focus is requested.
      vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (
        this: HTMLElement,
        options,
      ) {
        if (this.style.display === 'none' || this.matches(':disabled')) return;
        focus.call(this, options);
      });
      render(
        <Modal
          isOpen
          title="Unavailable fields"
          showCloseButton
          initialFocus={isChosen ? () => screen.getByLabelText('Unavailable') : undefined}
        >
          <input aria-label="Unavailable" style={{ display: 'none' }} />
          <fieldset disabled>
            <input aria-label="Disabled field" />
          </fieldset>
          <input aria-label="Ready" readOnly />
        </Modal>,
      );
      expect(screen.getByRole('textbox', { name: 'Ready' })).toHaveFocus();
    },
  );

  it('UIC-MODAL-3.4 falls back when a connected chosen element cannot take focus', () => {
    render(
      <Modal
        isOpen
        title="Unavailable target"
        showCloseButton
        initialFocus={() => screen.getByText('Plain text')}
      >
        <span>Plain text</span>
        <input aria-label="Ready" />
      </Modal>,
    );
    expect(screen.getByRole('textbox', { name: 'Ready' })).toHaveFocus();
  });

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

  it('UIC-MODAL-3.4 UIC-PORTAL-1.7 returns focus from a floating dialog to the opener focused in its portal container document', async () => {
    // A frame stands in for a popup window the host renders into through a portal container: it
    // keeps its own focused element while the script's document reports another. jsdom moves
    // focus out of a frame when its parent focuses an element, so the parent's is stubbed.
    const frame = document.body.appendChild(document.createElement('iframe'));
    const owner = frame.contentDocument;
    if (!owner) throw new Error('The frame has no document');
    vi.spyOn(owner, 'hasFocus').mockReturnValue(true);
    const { body } = owner;
    const host = body.appendChild(owner.createElement('div'));
    const elsewhere = document.body.appendChild(document.createElement('button'));
    function Popup({ isOpen }: { isOpen: boolean }) {
      return (
        <PortalContainerProvider container={body}>
          <button type="button">Open</button>
          <Modal title="Rename" isNonModal isOpen={isOpen} onOpenChange={() => {}}>
            <p>Body</p>
          </Modal>
        </PortalContainerProvider>
      );
    }
    const view = render(<Popup isOpen={false} />, { container: host });
    const opener = within(host).getByRole('button', { name: 'Open' });
    act(() => opener.focus());
    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(elsewhere);
    view.rerender(<Popup isOpen />);
    await waitFor(() => expect(owner.querySelector('[role="dialog"]')).not.toBeNull());
    view.rerender(<Popup isOpen={false} />);
    await waitFor(() => expect(owner.activeElement).toBe(opener));
    view.unmount();
    frame.remove();
    elsewhere.remove();
  });
});
