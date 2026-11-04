import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createModalController, type ModalController, ModalHost } from './modal-controller.js';

type Close = (controller: ModalController, user: ReturnType<typeof userEvent.setup>) => unknown;

function openNote(controller: ModalController, onExitComplete: () => void, title = 'Note') {
  let handle!: ReturnType<typeof controller.open<string>>;
  act(() => {
    handle = controller.open<string>({
      title,
      isDismissable: true,
      onExitComplete,
      content: <p>Plums are ripe.</p>,
      primaryAction: { label: 'Done', onPress: (close) => close() },
    });
  });
  return handle;
}

const closes: Array<[string, Close]> = [
  ['the handle', (controller) => act(() => controller.getSnapshot()[0]?.handle.close())],
  ['Cancel', (_c, user) => user.click(screen.getByRole('button', { name: 'Cancel' }))],
  ['Escape', (_c, user) => user.keyboard('{Escape}')],
  ['the primary action', (_c, user) => user.click(screen.getByRole('button', { name: 'Done' }))],
  ['closeAll', (controller) => act(() => controller.closeAll())],
];

describe('ModalHost closing a controller modal', () => {
  it.each(closes)(
    'UIC-MODAL-CONTROLLER-2.4 runs the exit and onExitComplete once when closed by %s',
    async (_case, close) => {
      const user = userEvent.setup();
      const controller = createModalController();
      render(<ModalHost controller={controller} />);
      const onExitComplete = vi.fn();
      const handle = openNote(controller, onExitComplete);
      await close(controller, user);
      expect(handle.isOpen).toBe(false);
      expect(controller.getSnapshot()).toEqual([]);
      await expect(handle.result).resolves.toBeUndefined();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(onExitComplete).toHaveBeenCalledTimes(1);
    },
  );

  it('UIC-MODAL-CONTROLLER-2.4 runs no exit when the host goes away with the modal open', () => {
    const controller = createModalController();
    const view = render(<ModalHost controller={controller} />);
    const onExitComplete = vi.fn();
    openNote(controller, onExitComplete);
    view.unmount();
    expect(onExitComplete).not.toHaveBeenCalled();
  });

  it('UIC-MODAL-CONTROLLER-2.4 returns focus to the modal beneath once the top one closes', async () => {
    const user = userEvent.setup();
    const controller = createModalController();
    render(<ModalHost controller={controller} />);
    const lower = vi.fn();
    const upper = vi.fn();
    openNote(controller, lower, 'Lower');
    const top = openNote(controller, upper, 'Upper');
    expect(await screen.findByRole('dialog', { name: 'Upper' })).toBeInTheDocument();
    act(() => top.close());
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Upper' })).not.toBeInTheDocument(),
    );
    expect(upper).toHaveBeenCalledTimes(1);
    expect(lower).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'Lower' }).contains(document.activeElement)).toBe(
        true,
      ),
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(lower).toHaveBeenCalledTimes(1));
  });
});
