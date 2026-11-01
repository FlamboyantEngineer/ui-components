import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UiProvider } from '../../core/provider.js';
import { ModalHost, createModalController } from '../modal-controller/modal-controller.js';
import { alert, prompt } from './modal-prompts.js';

function mountHost() {
  const controller = createModalController();
  render(<ModalHost controller={controller} />);
  return controller;
}

describe('imperative dialogs', () => {
  it('UIC-MODAL-22.2 opens an acknowledgement and resolves once it closes', async () => {
    const user = userEvent.setup();
    const controller = mountHost();
    const onConfirm = vi.fn();
    let done!: Promise<void>;
    act(() => {
      done = alert(controller, {
        title: 'Export finished',
        message: 'Report.pdf is ready.',
        onConfirm,
      });
    });
    const dialog = await screen.findByRole('alertdialog', { name: 'Export finished' });
    expect(dialog).toHaveAccessibleDescription('Report.pdf is ready.');
    expect(document.querySelector('.ui-modal')).toHaveAttribute('data-tone', 'info');
    expect(document.querySelector('.ui-modal__confirmation-icon')).toHaveAttribute(
      'data-glyph',
      'info',
    );
    expect(
      within(dialog)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['OK']);
    expect(screen.getByRole('button', { name: 'OK' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'OK' }));
    await expect(done).resolves.toBeUndefined();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).toEqual([]);

    act(() => {
      done = alert(controller, {
        title: 'Disk almost full',
        tone: 'warning',
        confirmLabel: 'Noted',
      });
    });
    await screen.findByRole('button', { name: 'Noted' });
    expect(document.querySelector('.ui-modal')).toHaveAttribute('data-tone', 'warning');
    await user.keyboard('{Escape}');
    await expect(done).resolves.toBeUndefined();
  });

  it('UIC-MODAL-22.2 labels the action from the provider', async () => {
    const controller = createModalController();
    render(
      <UiProvider messages={{ ok: 'Entendu' }}>
        <ModalHost controller={controller} />
      </UiProvider>,
    );
    act(() => {
      void alert(controller, { title: 'Saved' });
    });
    expect(await screen.findByRole('button', { name: 'Entendu' })).toBeInTheDocument();
  });

  it('UIC-MODAL-22.3 asks for text and resolves to it, or to null when cancelled', async () => {
    const user = userEvent.setup();
    const controller = mountHost();
    let answer!: Promise<string | null>;
    act(() => {
      answer = prompt(controller, {
        title: 'Rename file',
        message: 'Pick a name for the copy.',
        label: 'File name',
        defaultValue: 'Report.pdf',
        confirmLabel: 'Rename',
      });
    });
    const dialog = await screen.findByRole('dialog', { name: 'Rename file' });
    expect(dialog).toHaveAccessibleDescription('Pick a name for the copy.');
    const field = screen.getByRole('textbox', { name: 'File name' });
    expect(field).toHaveValue('Report.pdf');
    expect(field).toHaveFocus();
    expect(field.closest('.ui-text-field')).not.toBeNull();
    await user.clear(field);
    await user.type(field, 'Summary.pdf');
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await expect(answer).resolves.toBe('Summary.pdf');
    expect(controller.getSnapshot()).toEqual([]);
  });

  it('UIC-MODAL-22.3 leaves the Enter that confirms an input method candidate unanswered', async () => {
    const user = userEvent.setup();
    const controller = mountHost();
    let answer!: Promise<string | null>;
    let settled = false;
    act(() => {
      answer = prompt(controller, { title: 'Add city', label: 'City' });
    });
    void answer.then(() => (settled = true));
    const field = await screen.findByRole('textbox', { name: 'City' });
    await user.type(field, 'Lima');
    // eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot set keyCode on a keydown
    fireEvent.keyDown(field, { key: 'Enter', keyCode: 229 });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(settled).toBe(false);
    await user.type(field, '{Enter}');
    await expect(answer).resolves.toBe('Lima');
  });

  it('UIC-MODAL-22.3 answers on Enter and resolves null when cancelled or closed', async () => {
    const user = userEvent.setup();
    const controller = mountHost();
    let answer!: Promise<string | null>;

    act(() => {
      answer = prompt(controller, { title: 'Add city', label: 'City' });
    });
    await user.type(await screen.findByRole('textbox', { name: 'City' }), 'Lima{Enter}');
    await expect(answer).resolves.toBe('Lima');

    act(() => {
      answer = prompt(controller, { title: 'Add city', label: 'City', cancelLabel: 'Skip' });
    });
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Skip' }));
    await expect(answer).resolves.toBeNull();

    act(() => {
      answer = prompt(controller, { title: 'Add city', label: 'City' });
    });
    await screen.findByRole('textbox', { name: 'City' });
    act(() => controller.closeAll());
    await expect(answer).resolves.toBeNull();
  });
});
