import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { createEngine, renderViewer } from '../../../test/pdf-fixtures.js';
import { requireDefined } from '../../utils/require-defined.js';

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

  it('UIC-PDF-VIEWER-1.1 keeps the document open across new URL objects for the same address', async () => {
    const address = () => new URL('/files/Report.pdf', 'https://example.test/');
    const { engine, update } = renderViewer({ source: address() });
    await screen.findAllByRole('presentation');
    expect(engine.getDocument).toHaveBeenCalledExactlyOnceWith({
      url: 'https://example.test/files/Report.pdf',
    });
    update({ source: address() });
    update({ source: address() });
    await screen.findAllByRole('presentation');
    expect(engine.getDocument).toHaveBeenCalledOnce();
    update({ source: new URL('/files/Other.pdf', 'https://example.test/') });
    await waitFor(() => expect(engine.getDocument).toHaveBeenCalledTimes(2));
  });

  it('UIC-PDF-VIEWER-1.1 opens URLs made in a same-origin frame as the same document', async () => {
    const frame = document.body.appendChild(document.createElement('iframe'));
    const view = frame.contentWindow as Window & typeof globalThis;
    const address = () => new view.URL('/files/Report.pdf', 'https://example.test/');
    const { engine, update } = renderViewer({ source: address() });
    await screen.findAllByRole('presentation');
    expect(engine.getDocument).toHaveBeenCalledExactlyOnceWith({
      url: 'https://example.test/files/Report.pdf',
    });
    update({ source: address() });
    update({ source: new URL('/files/Report.pdf', 'https://example.test/') });
    update({ source: 'https://example.test/files/Report.pdf' });
    await screen.findAllByRole('presentation');
    expect(engine.getDocument).toHaveBeenCalledOnce();
    update({ source: new view.URL('/files/Other.pdf', 'https://example.test/') });
    await waitFor(() => expect(engine.getDocument).toHaveBeenCalledTimes(2));
    frame.remove();
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
    expect(screen.queryByRole('button', { name: 'Restore Password' })).not.toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(field, 's');
    expect(screen.queryByText('The password is incorrect. Try again.')).not.toBeInTheDocument();

    await userEvent.clear(field);
    await userEvent.type(field, 'orchard');
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await waitFor(() => expect(root).not.toHaveAttribute('data-locked'));
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(container.querySelectorAll('span[role="presentation"]')).toHaveLength(7),
    );
  });

  it('UIC-PDF-VIEWER-1.6 marks the open button pending while the password is checked', async () => {
    const engine = createEngine({ password: 'orchard' });
    renderViewer({}, engine);
    const field = await screen.findByLabelText('Password');
    await userEvent.type(field, 'pear');
    // The engine answers on a later task, so the check is still running right after submitting.
    act(() => void fireEvent.submit(requireDefined(field.closest('form'))));
    expect(screen.getByRole('button', { name: /Open/ })).toHaveAttribute('aria-disabled', 'true');
    await screen.findByText('The password is incorrect. Try again.');
    expect(screen.getByRole('button', { name: 'Open' })).not.toHaveAttribute('aria-disabled');
  });

  it('UIC-PDF-VIEWER-1.1 loads a document again when the viewer returns to it, never reusing a destroyed one', async () => {
    const engine = createEngine();
    const open = engine.getDocument.getMockImplementation();
    engine.getDocument.mockImplementation((params) => {
      const task = requireDefined(open)(params);
      if (!('url' in params) || params.url !== '/files/Other.pdf') return task;
      return { ...task, promise: new Promise<never>(() => undefined) };
    });
    const { root, update, unmount, container } = renderViewer({}, engine);
    const pageCount = () => container.querySelectorAll('span[role="presentation"]').length;
    await waitFor(() => expect(pageCount()).toBe(7));
    update({ source: '/files/Other.pdf' });
    await waitFor(() => expect(engine.destroy).toHaveBeenCalledTimes(1));
    expect(root).toHaveAttribute('data-loading');
    update({ source: '/files/Report.pdf' });
    expect(root).toHaveAttribute('data-loading');
    expect(pageCount()).toBe(0);
    await waitFor(() => expect(engine.getDocument).toHaveBeenCalledTimes(3));
    expect(engine.destroy).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(pageCount()).toBe(7));
    expect(root).not.toHaveAttribute('data-loading');
    update({ source: null });
    expect(root).toHaveAttribute('data-loading');
    update({ source: '/files/Report.pdf' });
    expect(root).toHaveAttribute('data-loading');
    await waitFor(() => expect(pageCount()).toBe(7));
    expect(engine.getDocument).toHaveBeenCalledTimes(4);
    unmount();
    expect(engine.destroy).toHaveBeenCalledTimes(4);
  });

  it('UIC-PDF-VIEWER-1.6 drops the password request of a document the viewer left', async () => {
    const engine = createEngine({ password: 'orchard' });
    const { root, update } = renderViewer({}, engine);
    await screen.findByLabelText('Password');
    update({ source: '/files/Other.pdf' });
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    expect(root).toHaveAttribute('data-loading');
    update({ source: '/files/Report.pdf' });
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    await screen.findByLabelText('Password');
    expect(engine.getDocument).toHaveBeenLastCalledWith({ url: '/files/Report.pdf' });
  });

  it('UIC-PDF-VIEWER-1.7 opens a 250-page document with at most 8 page requests in flight', async () => {
    const engine = createEngine({
      lines: Array.from({ length: 250 }, (_, index) => [`Page ${index + 1}`]),
    });
    const getPage = engine.pdf.getPage;
    let inFlight = 0;
    let peak = 0;
    engine.pdf.getPage = async (pageNumber: number) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 0));
      inFlight -= 1;
      return getPage(pageNumber);
    };
    const { root } = renderViewer({}, engine);
    await waitFor(() => expect(root).not.toHaveAttribute('data-loading'), { timeout: 5000 });
    expect(peak).toBe(8);
    expect(root.querySelectorAll('.ui-pdf-viewer__page')).toHaveLength(250);
  });
});
