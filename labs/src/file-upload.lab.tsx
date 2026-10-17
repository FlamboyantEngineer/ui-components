import { useEffect, useState } from 'react';
import type { Key } from 'react-aria-components';
import {
  FileUpload,
  type FileRejection,
  type FileUploadItem,
  type FileUploadProps,
  type FileUploadVariant,
} from '../../src/components/file-upload/file-upload.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const variants = ['button', 'dropzone'] as const;
const states = ['resting', 'described', 'disabled', 'listed'] as const;

const listed: FileUploadItem[] = [
  { id: 'report', name: 'Report.pdf', size: 482_000 },
  { id: 'photo', name: 'Harbour.png', size: 2_400_000, progress: 45 },
  { id: 'notes', name: 'Notes.txt', size: 1_200, progress: 100 },
  { id: 'map', name: 'City map.svg', size: 96_000, error: 'The server refused the file.' },
];

const stateProps: Record<(typeof states)[number], Partial<FileUploadProps>> = {
  resting: {},
  described: { acceptedFileTypes: ['.pdf', 'image/*'], maxSize: 5 * 1024 * 1024 },
  disabled: { isDisabled: true },
  listed: { files: listed, onRemove: () => {} },
};

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
          name: file.name,
          size: file.size,
          progress: 0,
        })),
      ]),
    remove: (id: Key) => setFiles((current) => current.filter((file) => file.id !== id)),
  };
}

function Uploads({ variant }: { variant: FileUploadVariant }) {
  const upload = useSimulatedUpload();
  const [refused, setRefused] = useState('none');
  return (
    <>
      <FileUpload
        variant={variant}
        label={variant === 'button' ? 'Attach files' : 'Drop images here'}
        acceptedFileTypes={variant === 'button' ? undefined : ['image/*']}
        maxSize={variant === 'button' ? undefined : 1024 * 1024}
        allowsMultiple
        files={upload.files}
        onSelect={upload.add}
        onReject={(rejections: FileRejection[]) =>
          setRefused(rejections.map(({ file, reason }) => `${file.name} (${reason})`).join(', '))
        }
        onRemove={upload.remove}
        data-lab-upload={variant}
      />
      <p>
        Refused: <output data-lab-output={`${variant}-refused`}>{refused}</output>
      </p>
    </>
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
      description='Choose files: the lab plays the host and uploads them. A file whose name starts with "fail" fails halfway.'
    >
      <Uploads variant="button" />
    </LabSection>
    <LabSection
      title="Drop zone"
      description="Drop or browse for images up to 1 MB; other files are refused and reported."
    >
      <Uploads variant="dropzone" />
    </LabSection>
  </>,
);
