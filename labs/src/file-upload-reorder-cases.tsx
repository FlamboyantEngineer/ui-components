import { type FormEvent, useState } from 'react';
import {
  FileUpload,
  type FileUploadItem,
  moveFileUploadItem,
} from '../../src/components/file-upload/file-upload.js';
import type { Key } from '../../src/core/props.js';

/** A small square thumbnail in one colour, as a data URL. */
function swatch(colour: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="${colour}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function textFile(name: string): File {
  return new File([`Contents of ${name}`], name, { type: 'text/plain' });
}

const documents: FileUploadItem[] = [
  { id: 1, name: 'Agenda.txt', size: 1_200, file: textFile('Agenda.txt') },
  { id: '1', name: 'Minutes.txt', size: 3_400, progress: 60, file: textFile('Minutes.txt') },
  {
    id: 'budget',
    name: 'Budget.txt',
    size: 2_100,
    error: 'The server refused the file.',
    file: textFile('Budget.txt'),
  },
  { id: 'notes', name: 'Notes.txt', size: 900, progress: 100, file: textFile('Notes.txt') },
];

const images: FileUploadItem[] = [
  { id: 'harbour', name: 'Harbour.svg', size: 24_000, previewUrl: swatch('#3b82f6') },
  { id: 'forest', name: 'Forest.svg', size: 31_000, previewUrl: swatch('#16a34a') },
  { id: 'sunset', name: 'Sunset.svg', size: 28_000, previewUrl: swatch('#f59e0b') },
];

/**
 * Documents the reader reorders by their handles or Alt+Arrow keys. The page applies each move to
 * its list; Send shows the order the form data carries them in.
 */
export function ReorderDocuments() {
  const [files, setFiles] = useState(documents);
  const [isDisabled, setDisabled] = useState(false);
  const [sent, setSent] = useState('nothing');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget).getAll('documents') as File[];
    setSent(data.map((file) => file.name).join(', ') || 'no files');
  };
  return (
    <form aria-label="Reorder documents" onSubmit={submit} data-lab-demo="reorder-documents">
      <FileUpload
        label="Documents"
        name="documents"
        allowsMultiple
        isDisabled={isDisabled}
        files={files}
        onSelect={() => {}}
        onRemove={(id: Key) => setFiles((current) => current.filter((file) => file.id !== id))}
        onMove={(move) => setFiles((current) => moveFileUploadItem(current, move))}
      />
      <button type="submit">Send</button>{' '}
      <button type="button" onClick={() => setFiles(documents)}>
        Restore the list
      </button>{' '}
      <label>
        <input
          type="checkbox"
          checked={isDisabled}
          onChange={(event) => setDisabled(event.target.checked)}
        />{' '}
        Disabled
      </label>
      <p>
        Order:{' '}
        <output data-lab-output="reorder-order">{files.map(({ id }) => id).join(', ')}</output>
      </p>
      <p>
        Sent: <output data-lab-output="reorder-sent">{sent}</output>
      </p>
    </form>
  );
}

/** Image thumbnails in a drop zone, reordered as a gallery's order would be. */
export function ReorderImages() {
  const [files, setFiles] = useState(images);
  return (
    <div data-lab-demo="reorder-images">
      <FileUpload
        variant="dropzone"
        label="Gallery images"
        acceptedFileTypes={['image/*']}
        files={files}
        onSelect={() => {}}
        onMove={(move) => setFiles((current) => moveFileUploadItem(current, move))}
      />
    </div>
  );
}
