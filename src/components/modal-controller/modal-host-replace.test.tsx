import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type ReactNode, StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import { createModalController, type ModalController, ModalHost } from './modal-controller.js';

/** Opens a modal with a name field and a Save that waits for the returned release. */
function openNameModal(controller: ModalController, title: string, name: string) {
  let release = () => {};
  act(() => {
    controller.open({
      title,
      content: <input aria-label="Name" defaultValue={name} />,
      primaryAction: {
        label: 'Save',
        onPress: () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      },
    });
  });
  return () => release();
}

const save = () => screen.getByRole('button', { name: /Save/ });

function host(controller: ModalController, wrap?: (node: ReactNode) => ReactNode) {
  const node = <ModalHost controller={controller} />;
  return wrap ? wrap(node) : node;
}

describe('ModalHost given another controller', () => {
  it.each([
    ['as is', undefined],
    ['in StrictMode', (node: ReactNode) => <StrictMode>{node}</StrictMode>],
  ])(
    'UIC-MODAL-CONTROLLER-2.3 shows the new controller fresh even when modal IDs collide (%s)',
    async (_case, wrap) => {
      const user = userEvent.setup();
      const first = createModalController();
      const second = createModalController();
      const view = render(host(first, wrap));
      const releaseFirst = openNameModal(first, 'First', 'First default');
      openNameModal(second, 'Second', 'Second default');
      expect(first.getSnapshot()[0]?.id).toBe(second.getSnapshot()[0]?.id);
      await user.clear(screen.getByRole('textbox', { name: 'Name' }));
      await user.type(screen.getByRole('textbox', { name: 'Name' }), 'First unsaved draft');
      await user.click(save());
      expect(save()).toHaveAttribute('data-pending', 'true');
      view.rerender(host(second, wrap));
      expect(screen.getByRole('dialog', { name: 'Second' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Second default');
      expect(save()).not.toHaveAttribute('data-pending');
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
      // The first controller's save finishing later changes nothing shown.
      await act(async () => releaseFirst());
      expect(screen.getByRole('dialog', { name: 'Second' })).toBeInTheDocument();
      expect(save()).not.toHaveAttribute('data-pending');
    },
  );

  it('UIC-MODAL-CONTROLLER-2.3 shows the new stack whatever its size, and nothing for an empty one', () => {
    const first = createModalController();
    const second = createModalController();
    const empty = createModalController();
    const view = render(host(first));
    openNameModal(first, 'Lemon', 'a');
    openNameModal(first, 'Lime', 'b');
    openNameModal(second, 'Plum', 'c');
    expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(2);
    view.rerender(host(second));
    expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Plum' })).toBeInTheDocument();
    view.rerender(host(empty));
    expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument();
  });

  it('UIC-MODAL-CONTROLLER-2.3 keeps the draft through updates from the same controller', async () => {
    const user = userEvent.setup();
    const controller = createModalController();
    const view = render(host(controller));
    openNameModal(controller, 'Rename', 'Old');
    await user.type(screen.getByRole('textbox', { name: 'Name' }), ' draft');
    act(() => controller.getSnapshot()[0]?.handle.update({ title: 'Rename note' }));
    view.rerender(host(controller));
    expect(screen.getByRole('dialog', { name: 'Rename note' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Old draft');
  });
});
