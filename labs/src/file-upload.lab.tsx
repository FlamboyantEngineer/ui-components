import { useEffect, useState, type FormEvent } from 'react';
import type { Key } from '../../src/core/props.js';
import {
  FileUpload,
  type FileRejection,
  type FileUploadItem,
  type FileUploadProps,
  type FileUploadVariant,
} from '../../src/components/file-upload/file-upload.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const variants = ['button', 'dropzone'] as const;
const states = ['resting', 'described', 'disabled', 'listed', 'invalid'] as const;

/** A small square thumbnail in one colour, as a data URL. */
function swatch(colour: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="${colour}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const listed: FileUploadItem[] = [
  { id: 1, name: 'Report.pdf', size: 482_000 },
  {
    id: '1',
    name: 'Harbour.png',
    size: 2_400_000,
    progress: 45,
    previewUrl: swatch('#3b82f6'),
  },
  { id: 'notes', name: 'Notes.txt', size: 1_200, progress: 100 },
  {
    id: 'map',
    name: 'City map.svg',
    size: 96_000,
    error: 'The server refused the file.',
    previewUrl: swatch('#16a34a'),
  },
];

const stateProps: Record<(typeof states)[number], Partial<FileUploadProps>> = {
  resting: {},
  described: { acceptedFileTypes: ['.pdf', 'image/*'], maxSize: 5 * 1024 * 1024 },
  disabled: { isDisabled: true },
  listed: { files: listed, onRemove: () => {} },
  invalid: { isInvalid: true, errorMessage: 'Attach the signed form.' },
};

/** Refuses a second file with the same name as one listed or chosen in the same offer. */
function refuseDuplicates(listedFiles: readonly FileUploadItem[]) {
  return (file: File, accepted: readonly File[]) =>
    [...listedFiles.map(({ name }) => name), ...accepted.map(({ name }) => name)].includes(
      file.name,
    )
      ? 'A file with this name is already chosen.'
      : null;
}

let nextId = 0;

/** Simulates the host's upload: progress advances every tick, and a file named "fail…" fails. */
function useSimulatedUpload() {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const uploading = files.some(
    (file) => file.progress !== undefined && file.progress < 100 && !file.error,
  );
  useEffect(() => {
    if (!uploading) return undefined;
    const timer = setInterval(() => {
      setFiles((current) =>
        current.map((file) => {
          if (file.error || file.progress === undefined || file.progress >= 100) return file;
          const progress = Math.min(100, file.progress + 25);
          return file.name.startsWith('fail') && progress >= 50
            ? { ...file, progress, error: 'The upload was interrupted.' }
            : { ...file, progress };
        }),
      );
    }, 150);
    return () => clearInterval(timer);
  }, [uploading]);
  return {
    files,
    add: (chosen: File[]) =>
      setFiles((current) => [
        ...current,
        ...chosen.map((file) => ({
          id: `file-${(nextId += 1)}`,
          name: file.webkitRelativePath || file.name,
          size: file.size,
          progress: 0,
          file,
        })),
      ]),
    remove: (id: Key) => setFiles((current) => current.filter((file) => file.id !== id)),
  };
}

function describeRefusals(rejections: FileRejection[]) {
  return rejections.map(({ file, reason }) => `${file.name} (${reason})`).join(', ');
}

function Uploads({ variant }: { variant: FileUploadVariant | 'rules' }) {
  const upload = useSimulatedUpload();
  const [refused, setRefused] = useState('none');
  const labels = { button: 'Attach files', dropzone: 'Drop images here', rules: 'Attach photos' };
  return (
    <>
      <FileUpload
        variant={variant === 'dropzone' ? 'dropzone' : 'button'}
        label={labels[variant]}
        acceptedFileTypes={variant === 'dropzone' ? ['image/*'] : undefined}
        maxSize={variant === 'dropzone' ? 1024 * 1024 : undefined}
        maxFiles={{ button: undefined, dropzone: 3, rules: 4 }[variant]}
        minSize={variant === 'rules' ? 1 : undefined}
        validate={variant === 'rules' ? refuseDuplicates(upload.files) : undefined}
        allowsMultiple
        files={upload.files}
        onSelect={upload.add}
        onReject={(rejections: FileRejection[]) => setRefused(describeRefusals(rejections))}
        onRemove={upload.remove}
        data-lab-upload={variant}
      />
      <p>
        Refused: <output data-lab-output={`${variant}-refused`}>{refused}</output>
      </p>
    </>
  );
}

/** A form that needs one file: submitting reads the form data the upload contributes. */
function UploadForm() {
  const upload = useSimulatedUpload();
  const [sent, setSent] = useState('nothing');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const files = new FormData(event.currentTarget).getAll('attachments') as File[];
    setSent(files.map((file) => file.name).join(', ') || 'no files');
  };
  return (
    <form onSubmit={submit} data-lab-form="upload">
      <FileUpload
        label="Attach the signed form"
        name="attachments"
        isRequired
        files={upload.files}
        onSelect={upload.add}
        onRemove={upload.remove}
      />
      <button type="submit">Send</button> <button type="reset">Reset</button>
      <p>
        Sent: <output data-lab-output="form-sent">{sent}</output>
      </p>
    </form>
  );
}

/**
 * A server check that answers after 1.5 s; a file named "offline…" makes the check fail, and one
 * named "broken…" makes it throw at once.
 */
function checkSlowly(file: File): Promise<string | null> {
  if (file.name.startsWith('broken')) throw new Error('The check is broken.');
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (file.name.startsWith('offline')) reject(new Error('The check is offline.'));
      else resolve(null);
    }, 1500);
  });
}

/** The upload can be disabled or closed while its check runs; an abandoned offer lists nothing. */
function SlowCheck() {
  const upload = useSimulatedUpload();
  const [refused, setRefused] = useState('none');
  const [isDisabled, setDisabled] = useState(false);
  const [isOpen, setOpen] = useState(true);
  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={isDisabled}
          onChange={(event) => setDisabled(event.target.checked)}
        />{' '}
        Disable the upload
      </label>{' '}
      <button type="button" onClick={() => setOpen((open) => !open)}>
        {isOpen ? 'Close the editor' : 'Open the editor'}
      </button>
      {isOpen ? (
        <FileUpload
          label="Attach checked files"
          allowsMultiple
          validate={checkSlowly}
          isDisabled={isDisabled}
          files={upload.files}
          onSelect={upload.add}
          onReject={(rejections: FileRejection[]) => setRefused(describeRefusals(rejections))}
          onRemove={upload.remove}
          data-lab-upload="slow"
        />
      ) : null}
      <p>
        Listed: <output data-lab-output="slow-listed">{upload.files.length}</output>; refused:{' '}
        <output data-lab-output="slow-refused">{refused}</output>
      </p>
    </>
  );
}

function FolderUpload() {
  const upload = useSimulatedUpload();
  return (
    <FileUpload
      variant="dropzone"
      label="Drop or choose a folder"
      acceptDirectory
      files={upload.files}
      onSelect={upload.add}
      onRemove={upload.remove}
      data-lab-upload="folder"
    />
  );
}

mountLab(
  <>
    <LabSection
      title="Variants and states"
      description="The button and the drop zone, resting, with the default description of types and size, disabled, and with listed files."
    >
      <StateMatrix
        axes={{ state: states, variant: variants }}
        render={({ state, variant }) => (
          <FileUpload
            variant={variant as FileUploadVariant}
            label={variant === 'button' ? 'Attach files' : 'Drop files here'}
            onSelect={() => {}}
            {...stateProps[state]}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Uploading"
      description='Choose files: the lab plays the host and uploads them. A file whose name starts with "fail" fails halfway; images show a thumbnail.'
    >
      <Uploads variant="button" />
    </LabSection>
    <LabSection
      title="Count limit and the host's check"
      description="The upload holds four files, refuses empty files, and the host refuses a name already chosen."
    >
      <Uploads variant="rules" />
    </LabSection>
    <LabSection
      title="Slow check"
      description='The host checks each file for 1.5 s; a file named "offline…" fails its check and one named "broken…" makes the check throw, and either is refused as unchecked. Disabling the upload or closing the editor while a check runs abandons the offer: nothing is listed or refused.'
    >
      <SlowCheck />
    </LabSection>
    <LabSection
      title="Drop zone"
      description="Drop or browse for up to three images of 1 MB; other files are refused and reported. While dragging, the zone shows whether the files would be accepted."
    >
      <Uploads variant="dropzone" />
    </LabSection>
    <LabSection
      title="Folders"
      description="Choose or drop a folder: every file in it, through its subfolders, is listed in entry order."
    >
      <FolderUpload />
    </LabSection>
    <LabSection
      title="In a form"
      description="The upload is required: Send refuses an empty upload and moves focus to it; the form data carries the chosen files. Reset leaves the listed files, which the page holds, and the next Send still carries them."
    >
      <UploadForm />
    </LabSection>
  </>,
);
