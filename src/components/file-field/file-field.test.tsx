import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { FileUploadItem } from '../file-upload/file-upload.js';
import { FileField, type FileFieldItem, type FileFieldProps } from './file-field.js';

const report: FileFieldItem = {
  id: 'report',
  name: 'Report.pdf',
  size: 2048,
  type: 'application/pdf',
  downloadUrl: '/files/report',
};
const photo: FileFieldItem = {
  id: 'photo',
  name: 'Harbour.png',
  size: 4096,
  type: 'image/png',
  previewUrl: 'data:image/png;base64,AA==',
};
const song: FileFieldItem = { id: 'song', name: 'Song.ogg', type: 'audio/ogg' };

function chooser(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('no chooser');
  return input;
}

function rows(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('.ui-file-upload__file'));
}

function Attachments(props: Partial<FileFieldProps>) {
  return <FileField label="Attachments" onSelect={() => {}} {...props} />;
}

describe('FileField', () => {
  it('UIC-FILE-FIELD-1.6 preserves distinct numeric and text hidden inputs when reordered', () => {
    const value = [
      { id: 1, name: 'Numeric.txt' },
      { id: '1', name: 'Textual.txt' },
    ];
    const { container, rerender } = render(<Attachments name="files" value={value} />);
    const [numeric, textual] = container.querySelectorAll('input[type="hidden"][name="files"]');
    rerender(<Attachments name="files" value={[value[1]!, value[0]!]} />);
    expect([...container.querySelectorAll('input[type="hidden"][name="files"]')]).toEqual([
      textual,
      numeric,
    ]);
  });

  it('UIC-FILE-FIELD-1.1 makes the upload command the field control, named by the label', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Attachments
        allowsMultiple
        description="Signed copies only"
        maxSize={1024 * 1024}
        defaultValue={[report]}
        data-test="attachments"
        className="extra"
      />,
    );
    const root = container.querySelector('.ui-field');
    expect(root).toHaveClass('ui-file-field', 'extra');
    expect(root).toHaveAttribute('data-test', 'attachments');
    const upload = container.querySelector('.ui-file-field__upload');
    expect(upload).toHaveClass('ui-file-upload');
    const command = screen.getByRole('button', { name: 'Attachments Add files' });
    expect(command).toHaveAccessibleDescription('Up to 1.0 MB Signed copies only');
    const click = vi.spyOn(chooser(container), 'click');
    await user.click(command);
    expect(click).toHaveBeenCalledTimes(1);
    expectHooksMatchSpec(container, 'FILE-FIELD', { callerAttributes: ['data-test'] });
  });

  it('UIC-FILE-FIELD-1.1 draws the drop zone variant and names it in the control-only layout', () => {
    render(<Attachments variant="dropzone" labelLayout="control-only" />);
    expect(screen.getByRole('button', { name: 'Attachments Browse' })).toHaveClass(
      'ui-file-upload__browse',
    );
  });

  it('UIC-FILE-FIELD-1.2 holds one file unless it allows several', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container, rerender } = render(<Attachments value={[report]} onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: 'Attachments Add a file' })).toBeInTheDocument();
    expect(chooser(container)).not.toHaveAttribute('multiple');
    await user.upload(chooser(container), new File(['x'], 'Notes.txt', { type: 'text/plain' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('1 file is over the file limit.');
    rerender(<Attachments value={[report]} onSelect={onSelect} allowsMultiple />);
    expect(chooser(container)).toHaveAttribute('multiple');
    await user.upload(chooser(container), new File(['x'], 'Notes.txt', { type: 'text/plain' }));
    expect(onSelect).toHaveBeenCalledWith([expect.objectContaining({ name: 'Notes.txt' })]);
  });

  it('UIC-FILE-FIELD-1.3 checks types, sizes and the count of held files and uploads', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onSelect = vi.fn();
    const uploads: FileUploadItem[] = [{ id: 'up', name: 'Map.svg', progress: 20 }];
    const { container } = render(
      <Attachments
        allowsMultiple
        acceptedFileTypes={['image/*']}
        maxSize={10}
        maxFiles={3}
        value={[photo]}
        uploads={uploads}
        onSelect={onSelect}
      />,
    );
    await user.upload(chooser(container), [
      new File(['x'], 'a.png', { type: 'image/png' }),
      new File(['x'], 'b.txt', { type: 'text/plain' }),
      new File(['x'.repeat(20)], 'c.png', { type: 'image/png' }),
      new File(['x'], 'd.png', { type: 'image/png' }),
    ]);
    expect(onSelect).toHaveBeenCalledWith([expect.objectContaining({ name: 'a.png' })]);
    expect(screen.getByRole('alert')).toHaveTextContent(
      '1 file is not an accepted type. 1 file is too large. 1 file is over the file limit.',
    );
  });

  it('UIC-FILE-FIELD-1.4 shows the required message and marks the upload invalid', () => {
    const { container } = render(<Attachments isRequired />);
    expect(container.querySelector('.ui-field__message')).toHaveTextContent('A value is required.');
    expect(container.querySelector('.ui-file-upload')).toHaveAttribute('data-invalid', 'true');
    expectHooksMatchSpec(container, 'FILE-FIELD');
  });

  it('UIC-FILE-FIELD-1.5 lists a read-only field without command or removal, and disables a disabled one', () => {
    const { container, rerender } = render(
      <Attachments
        isReadOnly
        defaultValue={[report]}
        renderFileActions={(file) => <a href={`/view/${file.id}`}>Open {file.name}</a>}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download Report.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Report.pdf' })).toBeInTheDocument();
    rerender(<Attachments isDisabled defaultValue={[report]} />);
    expect(screen.getByRole('button', { name: 'Attachments Add a file' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove Report.pdf' })).toBeDisabled();
    expectHooksMatchSpec(container, 'FILE-FIELD');
  });

  it('UIC-FILE-FIELD-1.6 submits each held file id under the form name', () => {
    const { container, rerender } = render(
      <form>
        <Attachments name="files" defaultValue={[report, photo]} allowsMultiple />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).getAll('files')).toEqual(['report', 'photo']);
    rerender(
      <form>
        <Attachments name="files" defaultValue={[report, photo]} allowsMultiple isDisabled />
      </form>,
    );
    expect(new FormData(form).getAll('files')).toEqual([]);
  });

  it('UIC-FILE-FIELD-2.1 lists held files with their preview, glyph, size and download link', () => {
    const { container } = render(
      <Attachments allowsMultiple defaultValue={[report, photo, song]} />,
    );
    const [first, second, third] = rows(container);
    expect(first?.querySelector('[data-glyph="file"]')).not.toBeNull();
    expect(first?.querySelector('.ui-file-upload__file-size')).toHaveTextContent('2.0 KB');
    const link = within(first as HTMLElement).getByRole('link', { name: 'Download Report.pdf' });
    expect(link).toHaveClass('ui-file-field__download', 'ui-link');
    expect(link).toHaveAttribute('href', '/files/report');
    expect(link).toHaveAttribute('download', 'Report.pdf');
    expect(link.querySelector('[data-glyph="download"]')).not.toBeNull();
    expect(second?.querySelector('.ui-file-upload__file-preview')).toHaveAttribute(
      'src',
      photo.previewUrl,
    );
    expect(third?.querySelector('[data-glyph="audio"]')).not.toBeNull();
    expect(third?.querySelector('.ui-file-upload__file-actions')).toBeNull();
    expectHooksMatchSpec(container, 'FILE-FIELD', { slots: ['upload', 'download'] });
  });

  it('UIC-FILE-FIELD-2.2 adds caller actions and previews to held files only', () => {
    const uploads: FileUploadItem[] = [
      { id: 'up', name: 'Clip.mp4', type: 'video/mp4', progress: 10 },
    ];
    const { container } = render(
      <Attachments
        allowsMultiple
        defaultValue={[report, song]}
        uploads={uploads}
        renderFileActions={(file) => <a href={`/view/${file.id}`}>Open {file.name}</a>}
        renderFilePreview={(file) =>
          file.type?.startsWith('audio/') ? <audio aria-label={file.name} /> : null
        }
      />,
    );
    const [first, second, third] = rows(container);
    const actions = first?.querySelector('.ui-file-upload__file-actions');
    expect(actions?.firstElementChild).toHaveAccessibleName('Download Report.pdf');
    expect(actions?.lastElementChild).toHaveAccessibleName('Open Report.pdf');
    expect(second?.querySelector('.ui-file-upload__file-media audio')).not.toBeNull();
    expect(third?.querySelector('.ui-file-upload__file-actions')).toBeNull();
    expect(third?.querySelector('[data-glyph="video"]')).not.toBeNull();
  });

  it('UIC-FILE-FIELD-2.3 commits the value without a removed file and hands upload removals on', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const onUploadRemove = vi.fn();
    render(
      <Attachments
        allowsMultiple
        defaultValue={[report, photo]}
        uploads={[{ id: 'up', name: 'Map.svg', error: 'The server refused the file.' }]}
        onChange={onChange}
        onCommit={onCommit}
        onUploadRemove={onUploadRemove}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Remove Report.pdf' }));
    expect(onChange).toHaveBeenLastCalledWith([photo]);
    expect(onCommit).toHaveBeenLastCalledWith([photo]);
    await user.click(screen.getByRole('button', { name: 'Remove Map.svg' }));
    expect(onUploadRemove).toHaveBeenCalledWith('up');
  });

  it('UIC-FILE-FIELD-2.4 lists uploads after the held files and stays pending while one runs', () => {
    const { container, rerender } = render(
      <Attachments
        allowsMultiple
        defaultValue={[report]}
        uploads={[{ id: 'up', name: 'Map.svg', progress: 40 }]}
      />,
    );
    expect(rows(container).map((row) => row.getAttribute('data-status'))).toEqual([
      'selected',
      'uploading',
    ]);
    const root = container.querySelector('.ui-file-field');
    expect(root).toHaveAttribute('data-validation', 'pending');
    rerender(
      <Attachments
        allowsMultiple
        defaultValue={[report]}
        uploads={[{ id: 'up', name: 'Map.svg', progress: 40, error: 'Interrupted.' }]}
      />,
    );
    expect(root).toHaveAttribute('data-validation', 'valid');
  });

  it('UIC-FILE-FIELD-3.1 UIC-FILE-FIELD-3.2 marks added files and puts a removed one back', async () => {
    const user = userEvent.setup();
    function Edited() {
      const [value, setValue] = useState<FileFieldItem[]>([report, song]);
      return (
        <Attachments
          allowsMultiple
          maxFiles={2}
          value={value}
          committedValue={[report, photo]}
          onChange={setValue}
        />
      );
    }
    const { container } = render(<Edited />);
    expect(rows(container).map((row) => row.getAttribute('data-change'))).toEqual([null, 'added']);
    const removed = container.querySelector('.ui-file-field__removed');
    expect(removed).toHaveClass('ui-field-previous-value');
    expect(removed).toHaveTextContent('Harbour.png');
    const restore = screen.getByRole('button', { name: 'Restore Harbour.png' });
    expect(restore).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Remove Song.ogg' }));
    await user.click(screen.getByRole('button', { name: 'Restore Harbour.png' }));
    expect(rows(container).map((row) => row.textContent)).toEqual([
      expect.stringContaining('Report.pdf'),
      expect.stringContaining('Harbour.png'),
    ]);
    expect(container.querySelector('.ui-file-field__removed')).toBeNull();
    expectHooksMatchSpec(container, 'FILE-FIELD');
  });

  it('UIC-FILE-FIELD-4.1 names every control in words and keeps glyphs decorative', () => {
    const { container } = render(
      <Attachments
        allowsMultiple
        value={[report]}
        committedValue={[report, photo]}
        uploads={[{ id: 'up', name: 'Map.svg', error: 'The server refused the file.' }]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Attachments Add files' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download Report.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Report.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore Harbour.png' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('The server refused the file.');
    for (const glyph of container.querySelectorAll('.ui-file-upload__file-icon')) {
      expect(glyph).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('UIC-FILE-FIELD-4.2 carries its hooks', () => {
    const { container } = render(
      <Attachments allowsMultiple value={[report]} committedValue={[photo]} />,
    );
    expectHooksMatchSpec(container, 'FILE-FIELD', { slots: ['upload', 'download', 'removed'] });
  });
});
