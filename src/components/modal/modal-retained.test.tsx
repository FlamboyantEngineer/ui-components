import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useEffect, useState, type Ref } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Button } from '../button/button.js';
import { Modal, ModalTrigger, type ModalProps } from './modal.js';

/** A body with its own draft and an element ref, counting its mounts and unmounts. */
function DraftBody({
  lifecycle,
  noteRef,
}: {
  lifecycle: string[];
  noteRef?: Ref<HTMLTextAreaElement> | undefined;
}) {
  const [draft, setDraft] = useState('');
  useEffect(() => {
    lifecycle.push('mount');
    return () => {
      lifecycle.push('unmount');
    };
  }, [lifecycle]);
  return (
    <label>
      Note
      <textarea ref={noteRef} value={draft} onChange={(event) => setDraft(event.target.value)} />
    </label>
  );
}

/** A page whose button opens a retained modal, with a field outside it. */
function RetainedPage({
  lifecycle,
  noteRef,
  ...props
}: Partial<ModalProps> & { lifecycle: string[]; noteRef?: Ref<HTMLTextAreaElement> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <input aria-label="Page field" />
      <button type="button" onClick={() => setOpen(true)}>
        Write
      </button>
      <Modal title="Draft" keepMounted {...props} isOpen={open} onOpenChange={setOpen}>
        <DraftBody lifecycle={lifecycle} noteRef={noteRef} />
      </Modal>
    </>
  );
}

const overlay = () => document.querySelector<HTMLElement>('.ui-modal');

describe('Modal retention', () => {
  it('UIC-MODAL-9.1 keeps the same body, draft and refs across closing and reopening', async () => {
    const user = userEvent.setup();
    const lifecycle: string[] = [];
    const refs: Array<HTMLTextAreaElement | null> = [];
    render(<RetainedPage lifecycle={lifecycle} noteRef={(node) => void refs.push(node)} />);
    expect(overlay()).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Write' }));
    const note = await screen.findByRole('textbox', { name: 'Note' });
    await user.type(note, 'Pack boots');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Write' }));
    const again = await screen.findByRole('textbox', { name: 'Note' });
    expect(again).toBe(note);
    expect(again).toHaveValue('Pack boots');
    expect(lifecycle).toEqual(['mount']);
    expect(refs).toEqual([note]);
    expectHooksMatchSpec(document.body, 'MODAL', { slots: ['panel', 'dialog', 'body'] });
  });

  it('UIC-MODAL-9.2 hides a closed body from readers, focus and pointers without blocking the page', async () => {
    const user = userEvent.setup();
    render(<RetainedPage lifecycle={[]} isDismissable />);
    await user.click(screen.getByRole('button', { name: 'Write' }));
    await screen.findByRole('dialog', { name: 'Draft' });
    const field = screen.getByRole('textbox', { name: 'Page field', hidden: true });
    expect(field.closest('[inert], [aria-hidden="true"]')).not.toBeNull();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const closed = overlay();
    expect(closed).toHaveAttribute('inert');
    expect(closed?.style.visibility).toBe('hidden');
    expect(closed?.style.pointerEvents).toBe('none');
    expect(closed).not.toHaveAttribute('data-open');
    expect(field.closest('[inert], [aria-hidden="true"]')).toBeNull();
    expect(document.documentElement.style.overflow).not.toBe('hidden');
    await user.click(field);
    await user.keyboard('Lima');
    expect(field).toHaveValue('Lima');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Write' })).toHaveFocus();
    await user.tab();
    expect(document.activeElement?.closest('.ui-modal')).toBeNull();
  });

  it('UIC-MODAL-9.3 moves focus in and back once at each opening and closing', async () => {
    const user = userEvent.setup();
    const onExitComplete = vi.fn();
    render(<RetainedPage lifecycle={[]} onExitComplete={onExitComplete} />);
    const opener = screen.getByRole('button', { name: 'Write' });
    for (const round of [1, 2, 3]) {
      await user.click(opener);
      await waitFor(() => expect(screen.getByRole('textbox', { name: 'Note' })).toHaveFocus());
      await user.tab();
      await user.tab();
      await user.tab();
      expect(document.activeElement?.closest('.ui-modal__dialog')).not.toBeNull();
      await user.keyboard('{Escape}');
      await waitFor(() => expect(opener).toHaveFocus());
      expect(onExitComplete).toHaveBeenCalledTimes(round);
    }
  });

  it('UIC-MODAL-9.3 keeps focus in the leaving dialog until its exit ends, then returns it', async () => {
    const user = userEvent.setup();
    let finish = () => {};
    const exit = new Promise<void>((resolve) => {
      finish = resolve;
    });
    let animations: Array<{ finished: Promise<void> }> = [];
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      value: () => animations,
    });
    try {
      render(<RetainedPage lifecycle={[]} />);
      const opener = screen.getByRole('button', { name: 'Write' });
      await user.click(opener);
      const note = screen.getByRole('textbox', { name: 'Note' });
      await waitFor(() => expect(note).toHaveFocus());
      animations = [{ finished: exit }];
      await user.keyboard('{Escape}');
      await waitFor(() => expect(overlay()).toHaveAttribute('data-exiting', 'true'));
      // Through the exit, focus stays in the dialog, never on the body.
      expect(overlay()).not.toHaveAttribute('inert');
      expect(document.body).not.toHaveFocus();
      expect(overlay()?.contains(document.activeElement)).toBe(true);
      animations = [];
      await act(async () => {
        finish();
        await exit;
      });
      await waitFor(() => expect(opener).toHaveFocus());
      expect(overlay()).toHaveAttribute('inert');
    } finally {
      delete (Element.prototype as Partial<Element>).getAnimations;
    }
  });

  it('UIC-MODAL-9.4 lets another modal open, dismiss and lock the page while one is retained', async () => {
    const user = userEvent.setup();
    render(
      <>
        <RetainedPage lifecycle={[]} />
        <ModalTrigger>
          <Button>Settings</Button>
          <Modal title="Settings" isDismissable>
            <input aria-label="Theme" />
          </Modal>
        </ModalTrigger>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Write' }));
    await screen.findByRole('dialog', { name: 'Draft' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(await screen.findByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Theme' })).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Settings' })).toHaveFocus());
  });

  it('UIC-MODAL-9.4 closes a reopened retained modal on an outside press when dismissable', async () => {
    const user = userEvent.setup();
    render(<RetainedPage lifecycle={[]} isDismissable />);
    await user.click(screen.getByRole('button', { name: 'Write' }));
    await screen.findByRole('dialog', { name: 'Draft' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Write' }));
    await screen.findByRole('dialog', { name: 'Draft' });
    const backdrop = overlay();
    if (!backdrop) throw new Error('overlay not rendered');
    await user.click(backdrop);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('UIC-MODAL-9.5 retains a trigger-driven modal and releases the body once on unmount', async () => {
    const user = userEvent.setup();
    const lifecycle: string[] = [];
    const refs: Array<HTMLTextAreaElement | null> = [];
    const { unmount } = render(
      <ModalTrigger>
        <Button>Compose</Button>
        <Modal title="Compose" keepMounted showCloseButton>
          <DraftBody lifecycle={lifecycle} noteRef={(node) => void refs.push(node)} />
        </Modal>
      </ModalTrigger>,
    );
    const trigger = screen.getByRole('button', { name: 'Compose' });
    for (const text of ['One', ' two']) {
      await user.click(trigger);
      const note = await screen.findByRole('textbox', { name: 'Note' });
      await user.type(note, text);
      await user.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(trigger).toHaveFocus());
    }
    await user.click(trigger);
    expect(await screen.findByRole('textbox', { name: 'Note' })).toHaveValue('One two');
    unmount();
    expect(lifecycle).toEqual(['mount', 'unmount']);
    expect(refs.filter((node) => node === null)).toHaveLength(1);
  });

  it('UIC-MODAL-9.5 retains a floating dialog and ignores retention when anchored', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ModalTrigger>
          <Button>Notes</Button>
          <Modal title="Notes" keepMounted isNonModal showCloseButton>
            <input aria-label="Note" />
          </Modal>
        </ModalTrigger>
        <ModalTrigger>
          <Button>Rename</Button>
          <Modal title="Rename" keepMounted placement="bottom start" showCloseButton>
            <input aria-label="Name" />
          </Modal>
        </ModalTrigger>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Notes' }));
    await user.type(await screen.findByRole('textbox', { name: 'Note' }), 'Kept');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.querySelector('.ui-modal__body input')).toHaveValue('Kept');
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.type(await screen.findByRole('textbox', { name: 'Name' }), 'Draft');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.querySelectorAll('.ui-modal__body input')).toHaveLength(1);
  });
});
