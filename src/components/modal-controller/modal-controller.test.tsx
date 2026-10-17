import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { Modal } from '../modal/modal.js';
import { ModalHost, createModalController, type ModalController } from './modal-controller.js';

function renderHost(controller: ModalController = createModalController()) {
  const view = render(<ModalHost controller={controller} />);
  return { ...view, controller };
}

const titles = () =>
  [...document.querySelectorAll('body > .ui-modal .ui-modal__title')].map(
    (node) => node.textContent,
  );

describe('Modal controller', () => {
  it('UIC-MODAL-CONTROLLER-1.1 creates independent controllers', () => {
    const first = createModalController();
    const second = createModalController();
    first.open({ title: 'Lemon' });
    expect(first.getSnapshot()).toHaveLength(1);
    expect(second.getSnapshot()).toHaveLength(0);
    render(
      <>
        <ModalHost controller={first} />
        <ModalHost controller={second} />
      </>,
    );
    expect(titles()).toEqual(['Lemon']);
  });

  it('UIC-MODAL-CONTROLLER-1.2 opens a Modal with its options and content', async () => {
    const { controller } = renderHost();
    let handle!: ReturnType<typeof controller.open>;
    act(() => {
      handle = controller.open({
        title: 'Rename',
        size: 'lg',
        'data-purpose': 'rename',
        content: <input aria-label="Name" />,
        primaryAction: { label: 'Save' },
      });
    });
    expect(handle.id).toMatch(/^modal-\d+$/);
    expect(handle.isOpen).toBe(true);
    const dialog = screen.getByRole('dialog', { name: 'Rename' });
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveFocus();
    const overlay = document.querySelector('.ui-modal');
    expect(overlay).toHaveAttribute('data-size', 'lg');
    expect(overlay).toHaveAttribute('data-purpose', 'rename');
    expectHooksMatchSpec(document.body, 'MODAL', {
      slots: ['dialog', 'body', 'footer'],
      callerAttributes: ['data-purpose'],
    });
  });

  it('UIC-MODAL-CONTROLLER-1.2 passes the handle to content and render functions', async () => {
    const { controller } = renderHost();
    let colour!: Promise<string | undefined>;
    act(() => {
      colour = controller.open<string>({
        title: 'Pick a colour',
        content: (handle) => (
          <button type="button" onClick={() => handle.close('Teal')}>
            Teal
          </button>
        ),
      }).result;
    });
    await userEvent.click(screen.getByRole('button', { name: 'Teal' }));
    await expect(colour).resolves.toBe('Teal');

    let custom!: Promise<boolean | undefined>;
    act(() => {
      custom = controller.open<boolean>({
        render: ({ isOpen, onOpenChange, close }) => (
          <Modal
            title="Custom"
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            primaryAction={{ label: 'Keep', onPress: () => close(true) }}
          />
        ),
      }).result;
    });
    await userEvent.click(screen.getByRole('button', { name: 'Keep' }));
    await expect(custom).resolves.toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('UIC-MODAL-CONTROLLER-1.3 settles each result once, with undefined when dismissed', async () => {
    const { controller } = renderHost();
    let first!: ReturnType<typeof controller.open<string>>;
    act(() => {
      first = controller.open<string>({ title: 'First', cancelAction: {} });
    });
    const settled = vi.fn();
    void first.result.then(settled);
    act(() => {
      first.close('chosen');
      first.close('ignored');
    });
    await expect(first.result).resolves.toBe('chosen');
    expect(settled).toHaveBeenCalledTimes(1);
    expect(first.isOpen).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();

    let escaped!: Promise<unknown>;
    act(() => {
      escaped = controller.open({ title: 'Escape me' }).result;
    });
    await userEvent.keyboard('{Escape}');
    await expect(escaped).resolves.toBeUndefined();

    let cancelled!: Promise<unknown>;
    act(() => {
      cancelled = controller.open({ title: 'Cancel me', cancelAction: {} }).result;
    });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expect(cancelled).resolves.toBeUndefined();
  });

  it('UIC-MODAL-CONTROLLER-1.3 closes every modal, topmost first', async () => {
    const { controller } = renderHost();
    const order: string[] = [];
    act(() => {
      void controller.open({ title: 'Lower' }).result.then(() => order.push('lower'));
      void controller.open({ title: 'Upper' }).result.then(() => order.push('upper'));
    });
    expect(titles()).toEqual(['Lower', 'Upper']);
    act(() => controller.closeAll());
    await waitFor(() => expect(order).toEqual(['upper', 'lower']));
    expect(controller.getSnapshot()).toEqual([]);
    expect(titles()).toEqual([]);
  });

  it('UIC-MODAL-CONTROLLER-1.4 merges updates into the open modal and ignores them after close', () => {
    const { controller } = renderHost();
    let handle!: ReturnType<typeof controller.open>;
    act(() => {
      handle = controller.open({
        title: 'Initial',
        content: <p>First body</p>,
        primaryAction: { label: 'Apply', isDisabled: true },
      });
    });
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    act(() =>
      handle.update({
        title: 'Updated',
        content: <p>Second body</p>,
        status: 'Ready.',
        primaryAction: { label: 'Apply' },
      }),
    );
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Updated');
    expect(screen.getByText('Second body')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Ready.');
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
    act(() => handle.close());
    const listener = vi.fn();
    controller.subscribe(listener);
    act(() => handle.update({ title: 'Too late' }));
    expect(listener).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('UIC-MODAL-CONTROLLER-1.5 publishes a new snapshot per change to subscribers', () => {
    const controller = createModalController();
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);
    const empty = controller.getSnapshot();
    expect(controller.getSnapshot()).toBe(empty);
    const handle = controller.open({ title: 'Lemon' });
    const opened = controller.getSnapshot();
    expect(opened).not.toBe(empty);
    expect(opened.map((entry) => entry.id)).toEqual([handle.id]);
    handle.update({ title: 'Lime' });
    expect(controller.getSnapshot()).not.toBe(opened);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    handle.close();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot()).toEqual([]);
  });

  it('UIC-MODAL-CONTROLLER-2.1 shows modals opened before the host mounts, in opening order', async () => {
    const controller = createModalController();
    const first = controller.open({ title: 'First', content: <button type="button">One</button> });
    controller.open({ title: 'Second', content: <button type="button">Two</button> });
    expect(titles()).toEqual([]);
    renderHost(controller);
    expect(titles()).toEqual(['First', 'Second']);
    const [lower, upper] = [...document.querySelectorAll('body > .ui-modal')];
    expect(lower).toHaveAttribute('aria-hidden', 'true');
    expect(upper).not.toHaveAttribute('aria-hidden');
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Second');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus());
    act(() => first.close());
    expect(titles()).toEqual(['Second']);
  });

  it('UIC-MODAL-CONTROLLER-2.2 stacks the newest on top, keeps the one beneath and returns focus', async () => {
    const controller = createModalController();
    function Field() {
      const [text, setText] = useState('');
      return (
        <input aria-label="Note" value={text} onChange={(event) => setText(event.target.value)} />
      );
    }
    render(
      <>
        <button
          type="button"
          onClick={() => controller.open({ title: 'Lower', content: <Field /> })}
        >
          Open
        </button>
        <ModalHost controller={controller} />
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(trigger);
    const note = await screen.findByRole('textbox', { name: 'Note' });
    await userEvent.type(note, 'Plum');
    let upper!: Promise<unknown>;
    act(() => {
      upper = controller.open({
        title: 'Upper',
        isDismissable: true,
        content: <button type="button">Upper field</button>,
      }).result;
    });
    const overlays = [...document.querySelectorAll<HTMLElement>('body > .ui-modal')];
    expect(overlays).toHaveLength(2);
    expect(within(overlays[1] as HTMLElement).getByRole('dialog')).toHaveAccessibleName('Upper');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Upper field' })).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await expect(upper).resolves.toBeUndefined();
    expect(titles()).toEqual(['Lower']);
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Note' })).toHaveFocus());
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('Plum');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
