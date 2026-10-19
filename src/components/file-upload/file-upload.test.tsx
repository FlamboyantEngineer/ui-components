import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { UiProvider } from '../../core/provider.js';
import {
  readDroppedFiles,
  type DroppedDirectory,
  type DroppedFile,
  type DroppedItem,
} from './file-upload-drop.js';
import { FileUpload, type FileUploadItem } from './file-upload.js';

function file(name: string, type: string, size = 10): File {
  return new File(['x'.repeat(size)], name, { type });
}

function chooser(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('no chooser');
  return input;
}

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.ui-file-upload');
}

/** A drag carrying files, in the shape React Aria reads from a native data transfer. */
function filesTransfer(files: File[], text?: string) {
  const items = files.map((entry) => ({ kind: 'file', type: entry.type, getAsFile: () => entry }));
  return {
    types: text === undefined ? ['Files'] : ['Files', 'text/plain'],
    items: text === undefined ? items : [...items, { kind: 'string', type: 'text/plain' }],
    effectAllowed: 'all',
    dropEffect: 'none',
    getData: () => text ?? '',
  };
}

const items: FileUploadItem[] = [
  { id: 'a', name: 'Report.pdf', size: 2048 },
  { id: 'b', name: 'Photo.png', size: 1536, progress: 40 },
  { id: 'c', name: 'Notes.txt', size: 12, progress: 100 },
  { id: 'd', name: 'Map.svg', error: 'The server refused the file.' },
];

describe('FileUpload', () => {
  it('UIC-FILE-UPLOAD-1.1 opens the system chooser from a button labelled by the label', async () => {
    const user = userEvent.setup();
    const { container } = render(<FileUpload label="Attach files" onSelect={() => {}} />);
    expect(root(container)).toHaveAttribute('data-variant', 'button');
    const button = screen.getByRole('button', { name: 'Attach files' });
    expect(button.querySelector('[data-glyph="upload"]')).not.toBeNull();
    const input = chooser(container);
    const click = vi.spyOn(input, 'click');
    await user.click(button);
    expect(click).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'FILE-UPLOAD');
  });

  it('UIC-FILE-UPLOAD-1.1 draws a drop zone with a title, a glyph and a Browse button', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FileUpload variant="dropzone" label="Drop files here" onSelect={() => {}} />,
    );
    expect(root(container)).toHaveAttribute('data-variant', 'dropzone');
    const zone = container.querySelector('.ui-file-upload__dropzone');
    expect(zone?.querySelector('.ui-file-upload__icon [data-glyph="upload"]')).not.toBeNull();
    const title = container.querySelector('.ui-file-upload__label');
    expect(title).toHaveTextContent('Drop files here');
    const browse = screen.getByRole('button', { name: 'Browse' });
    expect(browse).toHaveClass('ui-file-upload__browse', 'ui-button');
    expect(browse).toHaveAccessibleDescription('Drop files here');
    const dropTarget = zone?.querySelector('button:not(.ui-button)');
    expect(dropTarget?.getAttribute('aria-labelledby')).toContain(title?.id);
    const click = vi.spyOn(chooser(container), 'click');
    await user.click(browse);
    expect(click).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'FILE-UPLOAD', {
      slots: ['dropzone', 'icon', 'label', 'browse'],
    });
  });

  it('UIC-FILE-UPLOAD-1.2 describes the command, by default with the accepted types and size limit', () => {
    const { container, rerender } = render(
      <FileUpload
        label="Attach"
        acceptedFileTypes={['.pdf', 'image/*']}
        maxSize={5 * 1024 * 1024}
        onSelect={() => {}}
      />,
    );
    const description = container.querySelector('.ui-file-upload__description');
    expect(description).toHaveTextContent('.pdf, image/* · Up to 5.0 MB');
    expect(screen.getByRole('button', { name: 'Attach' })).toHaveAccessibleDescription(
      '.pdf, image/* · Up to 5.0 MB',
    );
    rerender(
      <FileUpload label="Attach" description="CSV exports only" maxSize={10} onSelect={() => {}} />,
    );
    expect(container.querySelector('.ui-file-upload__description')).toHaveTextContent(
      'CSV exports only',
    );
    rerender(<FileUpload label="Attach" onSelect={() => {}} />);
    expect(container.querySelector('.ui-file-upload__description')).toBeNull();
    expect(screen.getByRole('button', { name: 'Attach' })).not.toHaveAttribute('aria-describedby');
    expectHooksMatchSpec(container, 'FILE-UPLOAD');
  });

  it('UIC-FILE-UPLOAD-1.2 writes the size limit in the locale', () => {
    const { container } = render(
      <UiProvider locale="de-DE">
        <FileUpload label="Anhängen" maxSize={1536} onSelect={() => {}} />
      </UiProvider>,
    );
    expect(container.querySelector('.ui-file-upload__description')).toHaveTextContent(
      'Up to 1,5 KB',
    );
  });

  it('UIC-FILE-UPLOAD-1.3 narrows the chooser and lets the same file be chosen again', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <FileUpload
        label="Attach"
        acceptedFileTypes={['.pdf', 'image/*']}
        allowsMultiple
        onSelect={onSelect}
      />,
    );
    const input = chooser(container);
    expect(input).toHaveAttribute('accept', '.pdf,image/*');
    expect(input).toHaveAttribute('multiple');
    const report = file('Report.pdf', 'application/pdf');
    const button = screen.getByRole('button', { name: 'Attach' });
    await user.click(button);
    await user.upload(input, report);
    await user.click(button);
    expect(input.files).toHaveLength(0);
    await user.upload(input, report);
    expect(onSelect).toHaveBeenNthCalledWith(1, [report]);
    expect(onSelect).toHaveBeenNthCalledWith(2, [report]);
  });

  it('UIC-FILE-UPLOAD-1.4 disables the buttons and the drop zone', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container, rerender } = render(
      <FileUpload label="Attach" isDisabled onSelect={onSelect} />,
    );
    expect(root(container)).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Attach' })).toBeDisabled();
    rerender(<FileUpload variant="dropzone" label="Attach" isDisabled onSelect={onSelect} />);
    const zone = container.querySelector<HTMLElement>('.ui-file-upload__dropzone');
    expect(zone).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Browse' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Browse' }));
    expect(onSelect).not.toHaveBeenCalled();
    rerender(
      <FileUpload
        label="Attach"
        isDisabled
        files={items}
        onRemove={() => {}}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole('button', { name: 'Remove Report.pdf' })).toBeDisabled();
    expectHooksMatchSpec(container, 'FILE-UPLOAD');
  });

  it('UIC-FILE-UPLOAD-2.1 hands on the accepted files and, without multiple, only the first', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onSelect = vi.fn();
    const { container, rerender } = render(
      <FileUpload
        label="Attach"
        acceptedFileTypes={['image/*']}
        allowsMultiple
        onSelect={onSelect}
      />,
    );
    const photo = file('photo.png', 'image/png');
    const notes = file('notes.txt', 'text/plain');
    const icon = file('icon.png', 'image/png');
    await user.upload(chooser(container), [photo, notes, icon]);
    expect(onSelect).toHaveBeenLastCalledWith([photo, icon]);
    rerender(<FileUpload label="Attach" acceptedFileTypes={['image/*']} onSelect={onSelect} />);
    onSelect.mockClear();
    // eslint-disable-next-line testing-library/prefer-user-event -- user.upload keeps only the first file on a single-file input; a browser may still deliver several
    fireEvent.change(chooser(container), { target: { files: [icon, photo] } });
    expect(onSelect).toHaveBeenCalledWith([icon]);
  });

  it('UIC-FILE-UPLOAD-2.2 UIC-FILE-UPLOAD-2.3 reports refused files and counts them by reason', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onSelect = vi.fn();
    const onReject = vi.fn();
    const { container } = render(
      <FileUpload
        label="Attach"
        acceptedFileTypes={['image/*']}
        maxSize={8}
        allowsMultiple
        onSelect={onSelect}
        onReject={onReject}
      />,
    );
    const small = file('small.png', 'image/png', 4);
    const large = file('large.png', 'image/png', 20);
    const huge = file('huge.png', 'image/png', 30);
    const notes = file('notes.txt', 'text/plain', 2);
    await user.upload(chooser(container), [small, large, huge, notes]);
    expect(onSelect).toHaveBeenCalledWith([small]);
    expect(onReject).toHaveBeenCalledWith([
      { file: large, reason: 'size' },
      { file: huge, reason: 'size' },
      { file: notes, reason: 'type' },
    ]);
    const message = screen.getByRole('alert');
    expect(message).toHaveClass('ui-file-upload__rejections', 'ui-inline-error');
    expect(message).toHaveTextContent('1 file is not an accepted type. 2 files are too large.');
    expectHooksMatchSpec(container, 'FILE-UPLOAD', { slots: ['rejections'] });
    await user.upload(chooser(container), [notes, notes]);
    expect(screen.getByRole('alert')).toHaveTextContent('2 files are not an accepted type.');
    await user.upload(chooser(container), [small]);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalledWith([]);
  });

  it('UIC-FILE-UPLOAD-2.4 checks dropped files and marks the drop zone while a drag is over it', async () => {
    const onSelect = vi.fn();
    const onReject = vi.fn();
    const { container } = render(
      <FileUpload
        variant="dropzone"
        label="Drop files"
        acceptedFileTypes={['.pdf']}
        allowsMultiple
        onSelect={onSelect}
        onReject={onReject}
      />,
    );
    const zone = container.querySelector<HTMLElement>('.ui-file-upload__dropzone');
    if (!zone) throw new Error('no drop zone');
    const report = file('Report.pdf', 'application/pdf');
    const photo = file('photo.png', 'image/png');
    const dataTransfer = filesTransfer([report, photo], 'Plain text');
    fireEvent.dragEnter(zone, { dataTransfer });
    expect(zone).toHaveAttribute('data-drop-target', 'true');
    expectHooksMatchSpec(container, 'FILE-UPLOAD');
    fireEvent.drop(zone, { dataTransfer });
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith([report]));
    expect(onReject).toHaveBeenCalledWith([{ file: photo, reason: 'type' }]);
    expect(zone).not.toHaveAttribute('data-drop-target');
  });

  it('UIC-FILE-UPLOAD-3.1 lists the files with their size and upload status', () => {
    const { container } = render(
      <FileUpload label="Attachments" files={items} onSelect={() => {}} />,
    );
    const list = screen.getByRole('list', { name: 'Attachments' });
    expect(list).toHaveClass('ui-file-upload__files');
    const rows = [...container.querySelectorAll('.ui-file-upload__file')];
    expect(rows.map((row) => row.getAttribute('data-status'))).toEqual([
      'selected',
      'uploading',
      'complete',
      'error',
    ]);
    expect(rows.map((row) => row.querySelector('.ui-file-upload__file-name')?.textContent)).toEqual(
      ['Report.pdf', 'Photo.png', 'Notes.txt', 'Map.svg'],
    );
    expect(
      rows.map((row) => row.querySelector('.ui-file-upload__file-size')?.textContent ?? null),
    ).toEqual(['2.0 KB', '1.5 KB', '12 B', null]);
    expectHooksMatchSpec(container, 'FILE-UPLOAD', {
      slots: ['files', 'file', 'file-name', 'file-size', 'file-progress', 'file-error'],
    });
  });

  it('UIC-FILE-UPLOAD-3.2 shows the progress of an uploading file', () => {
    render(<FileUpload label="Attachments" files={items} onSelect={() => {}} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(1);
    expect(bars[0]).toHaveAccessibleName('Photo.png');
    expect(bars[0]).toHaveAttribute('aria-valuenow', '40');
    expect(bars[0]).toHaveClass('ui-file-upload__file-progress', 'ui-progress-bar');
  });

  it('UIC-FILE-UPLOAD-3.3 shows an upload error as an alert in its row', () => {
    const { container } = render(
      <FileUpload label="Attachments" files={items} onSelect={() => {}} />,
    );
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('The server refused the file.');
    expect(error).toHaveClass('ui-file-upload__file-error');
    expect(error.closest('.ui-file-upload__file')).toHaveAttribute('data-status', 'error');
    expect(container.querySelector('.ui-file-upload__file-remove')).toBeNull();
  });

  it('UIC-FILE-UPLOAD-3.4 removes a listed file by its id', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { container } = render(
      <FileUpload label="Attachments" files={items} onRemove={onRemove} onSelect={() => {}} />,
    );
    const remove = screen.getByRole('button', { name: 'Remove Photo.png' });
    expect(remove).toHaveClass('ui-file-upload__file-remove', 'ui-icon-button');
    expect(remove.querySelector('[data-glyph="close"]')).not.toBeNull();
    await user.click(remove);
    expect(onRemove).toHaveBeenCalledWith('b');
    expectHooksMatchSpec(container, 'FILE-UPLOAD', { slots: ['file-remove'] });
  });

  it('UIC-FILE-UPLOAD-4.1 appends the caller class and forwards the id and data attributes', () => {
    const { container } = render(
      <FileUpload
        label="Attach"
        className="caller"
        id="upload"
        data-testid="probe"
        data-variant="other"
        onSelect={() => {}}
      />,
    );
    const element = root(container);
    expect(element).toHaveClass('ui-file-upload', 'caller');
    expect(element).toHaveAttribute('id', 'upload');
    expect(element).toHaveAttribute('data-testid', 'probe');
    expect(element).toHaveAttribute('data-variant', 'button');
    expectHooksMatchSpec(container, 'FILE-UPLOAD');
  });

  it('UIC-FILE-UPLOAD-1.2 lists the count limit in the default description', () => {
    const { container } = render(
      <FileUpload label="Attach" maxSize={1024} maxFiles={3} onSelect={() => {}} />,
    );
    expect(container.querySelector('.ui-file-upload__description')).toHaveTextContent(
      'Up to 1.0 KB · Up to 3 files',
    );
  });

  it('UIC-FILE-UPLOAD-1.5 picks a folder and offers every file in it', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(
      <FileUpload label="Attach folder" acceptDirectory onSelect={onSelect} />,
    );
    const input = chooser(container);
    expect(input).toHaveAttribute('webkitdirectory');
    const a = file('a.txt', 'text/plain');
    const b = file('b.txt', 'text/plain');
    await user.upload(input, [a, b]);
    expect(onSelect).toHaveBeenCalledWith([a, b]);
  });

  it('UIC-FILE-UPLOAD-1.5 reads dropped folders through their subfolders only when asked', async () => {
    const a = file('a.txt', 'text/plain');
    const b = file('b.txt', 'text/plain');
    const c = file('c.txt', 'text/plain');
    const fileItem = (entry: File): DroppedFile => ({
      kind: 'file',
      type: entry.type,
      name: entry.name,
      getFile: async () => entry,
    });
    async function* inner(): AsyncGenerator<DroppedFile | DroppedDirectory> {
      yield fileItem(c);
    }
    async function* outer(): AsyncGenerator<DroppedFile | DroppedDirectory> {
      yield fileItem(b);
      yield { kind: 'directory', name: 'inner', getEntries: inner };
    }
    const items: DroppedItem[] = [
      fileItem(a),
      { kind: 'text' },
      { kind: 'directory', name: 'outer', getEntries: outer },
    ];
    expect(await readDroppedFiles(items, true)).toEqual([a, b, c]);
    expect(await readDroppedFiles(items, false)).toEqual([a]);
  });

  it('UIC-FILE-UPLOAD-2.5 UIC-FILE-UPLOAD-2.6 refuses small files and files past the count limit', async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    const onSelect = vi.fn();
    const { container } = render(
      <FileUpload
        label="Attach"
        allowsMultiple
        minSize={2}
        maxFiles={3}
        files={[{ id: 'listed', name: 'Listed.txt' }]}
        onSelect={onSelect}
        onReject={onReject}
      />,
    );
    const tiny = file('tiny.txt', 'text/plain', 1);
    const [a, b, c] = ['a.txt', 'b.txt', 'c.txt'].map((name) => file(name, 'text/plain'));
    await user.upload(chooser(container), [tiny, a, b, c] as File[]);
    expect(onSelect).toHaveBeenCalledWith([a, b]);
    expect(onReject).toHaveBeenCalledWith([
      { file: tiny, reason: 'min-size' },
      { file: c, reason: 'count' },
    ]);
    expect(screen.getByRole('alert')).toHaveTextContent(
      '1 file is too small. 1 file is over the file limit.',
    );
  });

  it('UIC-FILE-UPLOAD-2.7 refuses files the owner check rejects, also later, with its message', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onSelect = vi.fn();
    const onReject = vi.fn();
    const validate = async (candidate: File) =>
      candidate.name.startsWith('wide') ? null : 'Images must be at least 200 pixels wide.';
    const { container } = render(
      <FileUpload
        label="Attach"
        allowsMultiple
        validate={validate}
        onSelect={onSelect}
        onReject={onReject}
      />,
    );
    const wide = file('wide.png', 'image/png');
    const narrow = file('narrow.png', 'image/png');
    await user.upload(chooser(container), [wide, narrow]);
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith([wide]));
    expect(onReject).toHaveBeenCalledWith([
      { file: narrow, reason: 'invalid', message: 'Images must be at least 200 pixels wide.' },
    ]);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'narrow.png: Images must be at least 200 pixels wide.',
    );
  });

  it('UIC-FILE-UPLOAD-2.8 says during a drag whether the dragged files would be accepted', () => {
    const { container } = render(
      <FileUpload
        variant="dropzone"
        label="Drop images"
        acceptedFileTypes={['image/*']}
        allowsMultiple
        maxFiles={2}
        onSelect={() => {}}
      />,
    );
    const zone = container.querySelector<HTMLElement>('.ui-file-upload__dropzone');
    if (!zone) throw new Error('no drop zone');
    const photo = file('photo.png', 'image/png');
    fireEvent.dragEnter(zone, { dataTransfer: filesTransfer([photo]) });
    expect(zone).toHaveAttribute('data-drop-accept', 'true');
    expect(zone).not.toHaveAttribute('data-drop-reject');
    expectHooksMatchSpec(container, 'FILE-UPLOAD');
    fireEvent.dragLeave(zone, { dataTransfer: filesTransfer([photo]) });
    expect(zone).not.toHaveAttribute('data-drop-accept');
    const notes = file('notes.txt', 'text/plain');
    fireEvent.dragEnter(zone, { dataTransfer: filesTransfer([photo, notes]) });
    expect(zone).toHaveAttribute('data-drop-reject', 'true');
    fireEvent.dragLeave(zone, { dataTransfer: filesTransfer([photo, notes]) });
    fireEvent.dragEnter(zone, { dataTransfer: filesTransfer([photo, photo, photo]) });
    expect(zone).toHaveAttribute('data-drop-reject', 'true');
    expectHooksMatchSpec(container, 'FILE-UPLOAD');
  });

  describe('previews', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('UIC-FILE-UPLOAD-3.5 shows image thumbnails and revokes their temporary URLs', () => {
      const createObjectURL = vi.fn(() => 'blob:photo');
      const revokeObjectURL = vi.fn();
      vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
      const photo = file('photo.png', 'image/png');
      const listed: FileUploadItem[] = [
        { id: 'photo', name: 'photo.png', file: photo },
        { id: 'notes', name: 'notes.txt', file: file('notes.txt', 'text/plain') },
        { id: 'old', name: 'old.png', previewUrl: '/thumbs/old.png' },
      ];
      const { container, unmount } = render(
        <FileUpload label="Attachments" files={listed} onSelect={() => {}} />,
      );
      const previews = [
        ...container.querySelectorAll<HTMLImageElement>('.ui-file-upload__file-preview'),
      ];
      expect(previews.map((image) => image.getAttribute('src'))).toEqual([
        'blob:photo',
        '/thumbs/old.png',
      ]);
      expect(previews[0]).toHaveAttribute('alt', '');
      expect(createObjectURL).toHaveBeenCalledWith(photo);
      expectHooksMatchSpec(container, 'FILE-UPLOAD', { slots: ['file-preview'] });
      unmount();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:photo');
    });
  });

  it('UIC-FILE-UPLOAD-4.2 takes part in a form: named, required and invalid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const { container, rerender } = render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <FileUpload label="Attach" name="attachments" isRequired onSelect={() => {}} />
        <button type="submit">Send</button>
      </form>,
    );
    const root = container.querySelector('.ui-file-upload');
    expect(root).toHaveAttribute('data-required', 'true');
    const hidden = container.querySelector<HTMLInputElement>('input[name="attachments"]');
    expect(hidden).toHaveAttribute('type', 'file');
    expect(hidden).toHaveAttribute('hidden');
    expect(hidden).toBeRequired();
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).not.toHaveBeenCalled();
    const error = container.querySelector('.ui-file-upload__error');
    expect(error).toHaveTextContent('A value is required.');
    expect(root).toHaveAttribute('data-invalid', 'true');
    const command = screen.getByRole('button', { name: 'Attach' });
    expect(command).toHaveFocus();
    expect(command).toHaveAccessibleDescription('A value is required.');
    expectHooksMatchSpec(container, 'FILE-UPLOAD', { slots: ['error'] });
    rerender(
      <form>
        <FileUpload
          label="Attach"
          name="attachments"
          isRequired
          files={[{ id: 'a', name: 'a.txt' }]}
          onSelect={() => {}}
        />
      </form>,
    );
    expect(container.querySelector('.ui-file-upload__error')).toBeNull();
    expect(container.querySelector('input[name="attachments"]')).not.toBeRequired();
    rerender(
      <FileUpload
        label="Attach"
        isInvalid
        errorMessage="Attach the signed form."
        onSelect={() => {}}
      />,
    );
    expect(container.querySelector('.ui-file-upload__error')).toHaveTextContent(
      'Attach the signed form.',
    );
    expect(container.querySelector('.ui-file-upload')).toHaveAttribute('data-invalid', 'true');
    expect(container.querySelector('input[type="file"][hidden]')).toBeNull();
  });
});
