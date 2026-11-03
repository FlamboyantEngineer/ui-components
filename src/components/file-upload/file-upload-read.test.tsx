import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { UiProvider } from '../../core/provider.js';
import { FileUpload } from './file-upload.js';

function chooser(container: HTMLElement) {
  return requireDefined(container.querySelector<HTMLInputElement>('input[type="file"]'));
}

/** A native directory whose entries fail before any file can be obtained. */
function unreadableDirectory(error: unknown) {
  return {
    types: ['Files'],
    items: [
      {
        kind: 'file',
        type: '',
        webkitGetAsEntry: () => ({
          isDirectory: true,
          name: 'Documents',
          createReader: () => ({
            readEntries: (
              _resolve: (entries: object[]) => void,
              reject: (error: unknown) => void,
            ) => reject(error),
          }),
        }),
      },
    ],
    getData: () => '',
  };
}

describe('FileUpload asynchronous intake', () => {
  it('UIC-FILE-UPLOAD-1.5 UIC-FILE-UPLOAD-2.7 handles a queued read rejection while an earlier validator waits', async () => {
    const user = userEvent.setup();
    const report = vi.fn();
    let finishValidation: (value: null) => void = () => {};
    const validate = () =>
      new Promise<null>((resolve) => {
        finishValidation = resolve;
      });
    const { container } = render(
      <FileUpload
        label="Folder"
        variant="dropzone"
        acceptDirectory
        validate={validate}
        onSelect={(files) => report(files)}
        onError={() => report('read failure')}
      />,
    );
    const first = new File(['first'], 'First.txt');
    await user.upload(chooser(container), first);
    const zone = requireDefined(container.querySelector<HTMLElement>('.ui-file-upload__dropzone'));
    fireEvent.drop(zone, { dataTransfer: unreadableDirectory(new Error('Unreadable.')) });
    await act(async () => {
      await Promise.resolve();
    });
    expect(report).not.toHaveBeenCalled();
    await act(async () => {
      finishValidation(null);
    });
    await waitFor(() => expect(report).toHaveBeenCalledTimes(2));
    expect(report.mock.calls).toEqual([[[first]], ['read failure']]);
    expect(screen.getByRole('alert')).toHaveTextContent('Unreadable.');
  });
  it.each(['succeeds', 'fails'])(
    'UIC-FILE-UPLOAD-1.5 UIC-FILE-UPLOAD-2.7 processes a chooser offer after a pending directory read %s',
    async (outcome) => {
      const user = userEvent.setup();
      const report = vi.fn();
      let finishRead: (entries: object[]) => void = () => {};
      let failRead: (error: unknown) => void = () => {};
      let hasRead = false;
      const first = new File(['first'], 'First.txt');
      const second = new File(['second'], 'Second.txt');
      const transfer = unreadableDirectory(null);
      transfer.items[0] = {
        kind: 'file',
        type: '',
        webkitGetAsEntry: () => ({
          isDirectory: true,
          name: 'Documents',
          createReader: () => ({
            readEntries: (
              resolve: (entries: object[]) => void,
              reject: (error: unknown) => void,
            ) => {
              if (hasRead) return resolve([]);
              hasRead = true;
              finishRead = resolve;
              failRead = reject;
            },
          }),
        }),
      };
      const { container } = render(
        <FileUpload
          label="Folder"
          variant="dropzone"
          acceptDirectory
          onSelect={(files) => report(files)}
          onError={() => report('read failure')}
        />,
      );
      const zone = requireDefined(
        container.querySelector<HTMLElement>('.ui-file-upload__dropzone'),
      );
      fireEvent.drop(zone, { dataTransfer: transfer });
      await user.upload(chooser(container), second);
      expect(report).not.toHaveBeenCalled();
      await act(async () => {
        if (outcome === 'fails') failRead(new Error('Cannot read the first folder.'));
        else
          finishRead([{ isFile: true, file: (resolve: (file: File) => void) => resolve(first) }]);
      });
      await waitFor(() => expect(report).toHaveBeenCalledTimes(2));
      expect(report.mock.calls).toEqual(
        outcome === 'fails' ? [['read failure'], [[second]]] : [[[first]], [[second]]],
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );
  it('UIC-FILE-UPLOAD-2.7 accepts validators that return a promise from another window', async () => {
    const user = userEvent.setup();
    const frame = document.body.appendChild(document.createElement('iframe'));
    try {
      const owner = requireDefined(frame.contentWindow) as Window & typeof globalThis;
      const result = owner.Promise.resolve(null);
      expect(result).not.toBeInstanceOf(Promise);
      const onSelect = vi.fn();
      const { container } = render(
        <FileUpload label="Attach" validate={() => result} onSelect={onSelect} />,
      );
      const file = new File(['notes'], 'Notes.txt');
      await user.upload(chooser(container), file);
      await waitFor(() => expect(onSelect).toHaveBeenCalledWith([file]));
    } finally {
      frame.remove();
    }
  });

  it.each([true, false])(
    'UIC-FILE-UPLOAD-1.5 reports an unreadable folder and accepts the next offer (onError=%s)',
    async (withHandler) => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onReject = vi.fn();
      const onError = vi.fn();
      const failure = new Error('The folder could not be read.');
      const { container } = render(
        <FileUpload
          variant="dropzone"
          label="Folder"
          acceptDirectory
          onSelect={onSelect}
          onReject={onReject}
          onError={withHandler ? onError : undefined}
        />,
      );
      const zone = requireDefined(
        container.querySelector<HTMLElement>('.ui-file-upload__dropzone'),
      );

      fireEvent.drop(zone, { dataTransfer: unreadableDirectory(failure) });
      expect(await screen.findByRole('alert')).toHaveTextContent(failure.message);
      expect(onError).toHaveBeenCalledTimes(withHandler ? 1 : 0);
      if (withHandler) expect(onError).toHaveBeenCalledWith(failure);
      expect(onSelect).not.toHaveBeenCalled();
      expect(onReject).not.toHaveBeenCalled();
      const file = new File(['notes'], 'Notes.txt');
      await user.upload(chooser(container), file);
      await waitFor(() => expect(onSelect).toHaveBeenCalledWith([file]));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );

  it('UIC-FILE-UPLOAD-1.5 uses a localized fallback for a read failure without a message', async () => {
    const upload = (
      <FileUpload variant="dropzone" label="Folder" acceptDirectory onSelect={() => {}} />
    );
    const { container, rerender } = render(<UiProvider>{upload}</UiProvider>);
    const zone = requireDefined(container.querySelector<HTMLElement>('.ui-file-upload__dropzone'));

    fireEvent.drop(zone, { dataTransfer: unreadableDirectory(null) });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The action could not be completed.',
    );
    rerender(
      <UiProvider messages={{ actionFailed: 'Impossible de lire le dossier.' }}>
        {upload}
      </UiProvider>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de lire le dossier.');
  });

  it('UIC-FILE-UPLOAD-1.5 abandons a folder read when the upload locks, even after it unlocks', async () => {
    const onSelect = vi.fn();
    const onError = vi.fn();
    let rejectRead: (error: unknown) => void = () => {};
    const transfer = unreadableDirectory(null);
    transfer.items[0] = {
      kind: 'file',
      type: '',
      webkitGetAsEntry: () => ({
        isDirectory: true,
        name: 'Documents',
        createReader: () => ({
          readEntries: (_resolve: unknown, reject: (error: unknown) => void) => {
            rejectRead = reject;
          },
        }),
      }),
    };
    const props = {
      label: 'Folder',
      variant: 'dropzone' as const,
      acceptDirectory: true,
      onSelect,
      onError,
    };
    const { container, rerender } = render(<FileUpload {...props} />);
    const zone = requireDefined(container.querySelector<HTMLElement>('.ui-file-upload__dropzone'));

    fireEvent.drop(zone, { dataTransfer: transfer });
    rerender(<FileUpload {...props} isDisabled />);
    rerender(<FileUpload {...props} />);
    await act(async () => {
      rejectRead(new Error('Too late.'));
    });
    expect(onSelect).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
