import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { createEngine, renderViewer } from '../../../test/pdf-fixtures.js';

describe('PdfViewer document', () => {
  it('UIC-PDF-VIEWER-1.5 opens the document with the loader options', async () => {
    const documentOptions = {
      httpHeaders: { Authorization: 'Bearer sample' },
      withCredentials: true,
      cMapUrl: '/vendor/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/vendor/fonts/',
    };
    const { engine, update } = renderViewer({ documentOptions });
    await waitFor(() => expect(engine.getDocument).toHaveBeenCalledTimes(1));
    expect(engine.getDocument).toHaveBeenCalledWith({
      ...documentOptions,
      url: '/files/Report.pdf',
    });
    update({ documentOptions: { ...documentOptions } });
    await screen.findAllByRole('presentation');
    expect(engine.getDocument).toHaveBeenCalledTimes(1);
  });

  it('UIC-PDF-VIEWER-1.6 asks for the password, marks a wrong one and opens with the right one', async () => {
    const engine = createEngine({ password: 'orchard' });
    const { root, container } = renderViewer({}, engine);
    const field = await screen.findByLabelText('Password');
    expect(root).toHaveAttribute('data-locked', 'true');
    expect(root).not.toHaveAttribute('data-loading');
    expect(root).not.toHaveAttribute('aria-busy');
    expect(container.querySelector('.ui-loading-overlay')).toBeNull();
    expect(field).toHaveAttribute('type', 'password');
    expect(field).toHaveAccessibleDescription(
      'This document is protected. Enter its password to open it.',
    );
    expect(field.closest('form')).toHaveClass('ui-pdf-viewer__password');
    expectHooksMatchSpec(container, 'PDF-VIEWER', { slots: ['password', 'stage'] });

    await userEvent.type(field, 'apple{Enter}');
    await screen.findByText('The password is incorrect. Try again.');
    expect(field).toHaveValue('apple');
    expect(screen.queryByRole('button', { name: 'Restore Password' })).toBeNull();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(field, 's');
    expect(screen.queryByText('The password is incorrect. Try again.')).toBeNull();

    await userEvent.clear(field);
    await userEvent.type(field, 'orchard');
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(root).not.toHaveAttribute('data-locked'));
    expect(screen.queryByLabelText('Password')).toBeNull();
    await waitFor(() =>
      expect(container.querySelectorAll('[role="presentation"]')).toHaveLength(7),
    );
  });

  it('UIC-PDF-VIEWER-1.6 marks the open button pending while the password is checked', async () => {
    const engine = createEngine({ password: 'orchard' });
    renderViewer({}, engine);
    const field = await screen.findByLabelText('Password');
    await userEvent.type(field, 'pear');
    // The engine answers on a later task, so the check is still running right after submitting.
    act(() => void fireEvent.submit(field.closest('form')!));
    expect(screen.getByRole('button', { name: /Open/ })).toHaveAttribute('aria-disabled', 'true');
    await screen.findByText('The password is incorrect. Try again.');
    expect(screen.getByRole('button', { name: 'Open' })).not.toHaveAttribute('aria-disabled');
  });
});
