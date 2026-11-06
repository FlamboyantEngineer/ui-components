import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import type { Key } from '../../core/props.js';
import {
  FileUpload,
  type FileUploadItem,
  type FileUploadMove,
  type FileUploadProps,
  moveFileUploadItem,
} from './file-upload.js';

function list(): FileUploadItem[] {
  return [
    { id: 1, name: 'One.txt', file: new File(['1'], 'One.txt', { type: 'text/plain' }) },
    { id: '1', name: 'Text one.txt', progress: 40, previewUrl: 'data:image/png;base64,AA==' },
    {
      id: 'three',
      name: 'Three.txt',
      error: 'Refused by the server.',
      file: new File(['3'], 'Three.txt', { type: 'text/plain' }),
    },
  ];
}

/** An owner that applies each move it is told about, as hosts do. */
function Reorderable(
  props: Partial<FileUploadProps> & { onMoved?: (move: FileUploadMove) => void },
) {
  const { onMoved, ...rest } = props;
  const [files, setFiles] = useState(list);
  return (
    <form aria-label="Documents">
      <FileUpload
        label="Attachments"
        name="docs"
        onSelect={() => {}}
        onRemove={(id: Key) => setFiles((current) => current.filter((file) => file.id !== id))}
        {...rest}
        files={files}
        onMove={(move) => {
          onMoved?.(move);
          setFiles((current) => moveFileUploadItem(current, move));
        }}
      />
    </form>
  );
}

function names() {
  const files = screen.getByRole('list', { name: 'Attachments' });
  return within(files)
    .getAllByRole('listitem')
    .map((row) => row.querySelector('.ui-file-upload__file-name')?.textContent);
}

describe('FileUpload reordering', () => {
  beforeEach(() => vi.stubGlobal('DataTransfer', undefined));

  it('UIC-FILE-UPLOAD-3.10 moves a file one place by Alt+Arrow keys and announces it', async () => {
    const user = userEvent.setup();
    const moves: FileUploadMove[] = [];
    const { container } = render(<Reorderable onMoved={(move) => moves.push(move)} />);
    const handle = screen.getByRole('button', { name: 'Move One.txt' });
    await user.click(screen.getByRole('button', { name: 'Remove Text one.txt' }));
    expect(names()).toEqual(['One.txt', 'Three.txt']);
    handle.focus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(moves).toEqual([{ id: 1, targetId: 'three', position: 'after' }]);
    expect(names()).toEqual(['Three.txt', 'One.txt']);
    expect(handle).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('One.txt moved to position 2 of 2');
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(moves).toHaveLength(1);
    expectHooksMatchSpec(container, 'FILE-UPLOAD', { slots: ['file-handle'] });
  });

  it('UIC-FILE-UPLOAD-3.10 keeps each file, by its numeric or text id, with its state and focus', async () => {
    const user = userEvent.setup();
    render(<Reorderable />);
    const remove = screen.getByRole('button', { name: 'Remove Three.txt' });
    remove.focus();
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
    await user.keyboard('{Alt>}{ArrowUp}{/Alt}');
    expect(names()).toEqual(['Three.txt', 'One.txt', 'Text one.txt']);
    expect(remove).toHaveFocus();
    const [three, one, textOne] = within(
      screen.getByRole('list', { name: 'Attachments' }),
    ).getAllByRole('listitem');
    expect(three).toHaveAttribute('data-status', 'error');
    expect(within(three as HTMLElement).getByRole('alert')).toHaveTextContent('Refused');
    expect(one).toHaveAttribute('data-status', 'selected');
    expect(textOne).toHaveAttribute('data-status', 'uploading');
    expect(textOne?.querySelector('.ui-file-upload__file-preview')).not.toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Three.txt moved to position 1 of 3');
  });

  it('UIC-FILE-UPLOAD-3.10 submits the files in the order the owner lists them', async () => {
    const user = userEvent.setup();
    render(<Reorderable />);
    screen.getByRole('button', { name: 'Move One.txt' }).focus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    const form = screen.getByRole('form', { name: 'Documents' }) as HTMLFormElement;
    const formData = new FormData(form);
    // jsdom never fires the browser's formdata event.
    form.dispatchEvent(Object.assign(new Event('formdata'), { formData }));
    expect(formData.getAll('docs').map((file) => (file as File).name)).toEqual([
      'Three.txt',
      'One.txt',
    ]);
    expect(names()).toEqual(['Text one.txt', 'Three.txt', 'One.txt']);
  });

  it('UIC-FILE-UPLOAD-3.10 disables the handles and keyboard moves while disabled, and draws none read-only', async () => {
    const user = userEvent.setup();
    const onMoved = vi.fn();
    const { rerender } = render(<Reorderable isDisabled onMoved={onMoved} />);
    const handle = screen.getByRole('button', { name: 'Move One.txt' });
    expect(handle).toBeDisabled();
    const row = handle.closest('li');
    row?.setAttribute('tabindex', '-1');
    row?.focus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(onMoved).not.toHaveBeenCalled();
    rerender(<Reorderable isReadOnly onMoved={onMoved} />);
    expect(screen.queryByRole('button', { name: /^Move / })).not.toBeInTheDocument();
  });

  it('UIC-FILE-UPLOAD-3.10 draws no handles or status without onMove', () => {
    render(<FileUpload label="Attachments" files={list()} onSelect={() => {}} />);
    expect(screen.queryByRole('button', { name: /^Move / })).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('UIC-FILE-UPLOAD-3.10 applies a move to a list, leaving it unchanged for unknown files', () => {
    const files = list();
    const ids = (moved: FileUploadItem[]) => moved.map(({ id }) => id);
    expect(
      ids(moveFileUploadItem(files, { id: 'three', targetId: 1, position: 'before' })),
    ).toEqual(['three', 1, '1']);
    expect(ids(moveFileUploadItem(files, { id: 1, targetId: '1', position: 'after' }))).toEqual([
      '1',
      1,
      'three',
    ]);
    expect(ids(moveFileUploadItem(files, { id: 'gone', targetId: 1, position: 'after' }))).toEqual([
      1,
      '1',
      'three',
    ]);
    expect(ids(moveFileUploadItem(files, { id: 1, targetId: 1, position: 'after' }))).toEqual([
      1,
      '1',
      'three',
    ]);
  });
});
