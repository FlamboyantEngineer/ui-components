import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Modal } from './modal.js';

it('UIC-MODAL-5.2 UIC-MODAL-6.1 keeps the focus on a secondary action the running primary disables', async () => {
  const user = userEvent.setup();
  let finish!: () => void;
  const request = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const save = vi.fn(() => request);
  const discard = vi.fn();
  const close = vi.fn();
  render(
    <Modal
      title="Changes"
      isOpen
      onOpenChange={close}
      primaryAction={{ label: 'Save', onPress: save }}
      secondaryAction={{ label: 'Discard', onPress: discard }}
    />,
  );
  const secondary = screen.getByRole('button', { name: 'Discard' });
  await act(async () => secondary.focus());
  await user.keyboard('{Control>}{Enter}{/Control}');
  expect(secondary).toHaveFocus();
  expect(secondary).toHaveAttribute('aria-disabled', 'true');
  await user.keyboard('{Control>}{Enter}{/Control}{Enter}');
  expect(save).toHaveBeenCalledOnce();
  expect(discard).not.toHaveBeenCalled();
  await act(async () => {
    finish();
    await request;
  });
  expect(secondary).toHaveFocus();
  expect(secondary).not.toHaveAttribute('aria-disabled');
  await user.keyboard('{Escape}');
  expect(close).toHaveBeenCalledWith(false);
});
