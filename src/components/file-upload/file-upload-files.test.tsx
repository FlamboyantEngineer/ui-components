import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { expectHooksMatchSpec } from '../../../test/hooks.js';
import { FileUpload, type FileUploadItem } from './file-upload.js';

const listed: FileUploadItem[] = [
  { id: 'report', name: 'Report.pdf', size: 2048, type: 'application/pdf' },
  { id: 'song', name: 'Song.ogg', size: 4096, type: 'audio/ogg', change: 'added' },
  { id: 'photo', name: 'Photo.png', previewUrl: 'data:image/png;base64,AA==' },
];

function rows(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('.ui-file-upload__file'));
}

describe('FileUpload rows', () => {
  it('UIC-FILE-UPLOAD-3.7 shows the glyph of the type of a file without a thumbnail', () => {
    const chosen = new File(['x'], 'Clip.mp4', { type: 'video/mp4' });
    const { container } = render(
      <FileUpload
        label="Attach"
        files={[...listed, { id: 'clip', name: 'Clip.mp4', file: chosen }]}
        onSelect={() => {}}
      />,
    );
    const glyphs = rows(container).map(
      (row) =>
        row.querySelector('.ui-file-upload__file-icon [data-glyph]')?.getAttribute('data-glyph') ??
        null,
    );
    expect(glyphs).toEqual(['file', 'audio', null, 'video']);
    expect(rows(container)[2]?.querySelector('.ui-file-upload__file-preview')).not.toBeNull();
    expectHooksMatchSpec(container, 'FILE-UPLOAD', { slots: ['file-icon', 'file-preview'] });
  });

  it('UIC-FILE-UPLOAD-3.6 replaces the built-in preview with the caller preview, unless it returns nothing', () => {
    const { container } = render(
      <FileUpload
        label="Attach"
        files={listed}
        onSelect={() => {}}
        renderFilePreview={(file) =>
          file.type?.startsWith('audio/') ? <audio aria-label={file.name} /> : null
        }
      />,
    );
    const [report, song, photo] = rows(container);
    expect(song?.querySelector('.ui-file-upload__file-media audio')).not.toBeNull();
    expect(song?.querySelector('.ui-file-upload__file-icon')).toBeNull();
    expect(report?.querySelector('.ui-file-upload__file-icon')).not.toBeNull();
    expect(photo?.querySelector('.ui-file-upload__file-preview')).not.toBeNull();
    expectHooksMatchSpec(container, 'FILE-UPLOAD', { slots: ['file-media'] });
  });

  it('UIC-FILE-UPLOAD-3.8 renders the caller actions before the remove button', () => {
    const { container } = render(
      <FileUpload
        label="Attach"
        files={listed}
        onSelect={() => {}}
        onRemove={() => {}}
        renderFileActions={(file) =>
          file.id === 'photo' ? null : <a href={`/files/${file.id}`}>Open {file.name}</a>
        }
      />,
    );
    const [report, , photo] = rows(container);
    const actions = report?.querySelector('.ui-file-upload__file-actions');
    expect(actions).toContainElement(screen.getByRole('link', { name: 'Open Report.pdf' }));
    expect(actions?.nextElementSibling).toHaveClass('ui-file-upload__file-remove');
    expect(photo?.querySelector('.ui-file-upload__file-actions')).toBeNull();
    expectHooksMatchSpec(container, 'FILE-UPLOAD', { slots: ['file-actions', 'file-remove'] });
  });

  it('UIC-FILE-UPLOAD-3.9 marks a file an edit added', () => {
    const { container } = render(<FileUpload label="Attach" files={listed} onSelect={() => {}} />);
    expect(rows(container).map((row) => row.getAttribute('data-change'))).toEqual([
      null,
      'added',
      null,
    ]);
    expectHooksMatchSpec(container, 'FILE-UPLOAD');
  });

  it('UIC-FILE-UPLOAD-1.6 lists files read-only without the command or removal', () => {
    const { container } = render(
      <FileUpload
        label="Attach"
        files={listed}
        isReadOnly
        onSelect={() => {}}
        onRemove={() => {}}
        renderFileActions={(file) => <a href={`/files/${file.id}`}>Open {file.name}</a>}
      />,
    );
    expect(container.querySelector('.ui-file-upload')).toHaveAttribute('data-readonly', 'true');
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('.ui-file-upload__file-remove')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expectHooksMatchSpec(container, 'FILE-UPLOAD');
  });

  it('UIC-FILE-UPLOAD-1.7 names the command after the owner labels, then its own text', () => {
    const commandRef = createRef<HTMLButtonElement>();
    const { rerender } = render(
      <>
        <span id="field-label">Attachments</span>
        <span id="field-help">Signed copies only</span>
        <FileUpload
          label="Add files"
          aria-labelledby="field-label"
          aria-describedby="field-help"
          commandRef={commandRef}
          onSelect={() => {}}
        />
      </>,
    );
    const button = screen.getByRole('button', { name: 'Attachments Add files' });
    expect(button).toHaveAccessibleDescription('Signed copies only');
    expect(commandRef.current).toBe(button);
    rerender(
      <FileUpload
        variant="dropzone"
        label="Drop files"
        aria-label="Photos"
        commandRef={commandRef}
        onSelect={() => {}}
      />,
    );
    expect(commandRef.current).toBe(screen.getByRole('button', { name: 'Photos Browse' }));
  });
});
