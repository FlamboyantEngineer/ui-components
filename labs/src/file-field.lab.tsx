import { useEffect, useState } from 'react';
import {
  FileField,
  type FileFieldItem,
  type FileFieldProps,
} from '../../src/components/file-field/file-field.js';
import type { FileUploadItem } from '../../src/components/file-upload/file-upload.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import {
  fieldLayouts,
  fieldStates,
  useLabFieldState,
  type FieldStateName,
  type SampleValues,
} from './field-states.js';

/** A small square thumbnail in one colour, as a data URL. */
function swatch(colour: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="${colour}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A text file's contents as a data URL, so the lab's download links work offline. */
function textUrl(text: string): string {
  return `data:text/plain,${encodeURIComponent(text)}`;
}

const report: FileFieldItem = {
  id: 1,
  name: 'Report.pdf',
  size: 482_000,
  type: 'application/pdf',
  downloadUrl: textUrl('Quarterly report'),
};
const harbour: FileFieldItem = {
  id: '1',
  name: 'Harbour.png',
  size: 2_400_000,
  type: 'image/png',
  previewUrl: swatch('#3b82f6'),
  downloadUrl: swatch('#3b82f6'),
};
const notes: FileFieldItem = {
  id: 'notes',
  name: 'Notes.txt',
  size: 1_200,
  type: 'text/plain',
  downloadUrl: textUrl('Meeting notes'),
};
const song: FileFieldItem = {
  id: 'song',
  name: 'Morning song.ogg',
  size: 3_100_000,
  type: 'audio/ogg',
};
const stone: FileFieldItem = { id: 'stone', name: 'Stone.exe', size: 40_000 };
const draft: FileFieldItem = { id: 'draft', name: 'Draft.txt', size: 300, type: 'text/plain' };

const samples: SampleValues<FileFieldItem[]> = {
  value: [report, harbour],
  edited: [report, notes],
  invalid: [stone],
  warning: [draft],
  empty: [],
};

function formatFiles(files: readonly FileFieldItem[]): string {
  return files.length > 0 ? files.map((file) => file.name).join(' | ') : 'none';
}

function Sample({
  state,
  layout,
}: {
  state: FieldStateName;
  layout: (typeof fieldLayouts)[number];
}) {
  const props = useLabFieldState(state, samples);
  return (
    <div style={{ width: 380 }}>
      <FileField
        label="Attachments"
        labelLayout={layout}
        allowsMultiple
        onSelect={() => {}}
        uploads={state === 'pending' ? [{ id: 'up', name: 'Map.svg', progress: 45 }] : undefined}
        {...props}
      />
    </div>
  );
}

let nextId = 0;

/**
 * Plays the owner's storage: chosen files upload over a few ticks, a file named "fail…" fails
 * halfway, and finished uploads join the field's value as stored files with download links.
 */
function useSimulatedStorage(initial: FileFieldItem[]) {
  const [value, setValue] = useState<FileFieldItem[]>(initial);
  const [uploads, setUploads] = useState<Array<FileUploadItem & { stored: FileFieldItem }>>([]);
  const running = uploads.some((upload) => !upload.error && (upload.progress ?? 0) < 100);
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => {
      setUploads((current) =>
        current.map((upload) => {
          if (upload.error || (upload.progress ?? 0) >= 100) return upload;
          const progress = Math.min(100, (upload.progress ?? 0) + 25);
          return upload.name.startsWith('fail') && progress >= 50
            ? { ...upload, progress, error: 'The upload was interrupted.' }
            : { ...upload, progress };
        }),
      );
    }, 150);
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    const done = uploads.filter((upload) => !upload.error && upload.progress === 100);
    if (done.length === 0) return;
    setValue((current) => [...current, ...done.map((upload) => upload.stored)]);
    setUploads((current) => current.filter((upload) => !done.includes(upload)));
  }, [uploads]);
  return {
    value,
    setValue,
    uploads,
    select: (files: File[]) =>
      setUploads((current) => [
        ...current,
        ...files.map((file) => {
          const id = `file-${(nextId += 1)}`;
          const url = URL.createObjectURL(file);
          const isImage = file.type.startsWith('image/');
          const stored: FileFieldItem = {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            previewUrl: isImage ? url : undefined,
            downloadUrl: url,
          };
          return { id, name: file.name, size: file.size, type: file.type, progress: 0, stored };
        }),
      ]),
    removeUpload: (id: Key) =>
      setUploads((current) => current.filter((upload) => upload.id !== id)),
  };
}

function Uploading(props: Partial<FileFieldProps> & { lab: string; initial: FileFieldItem[] }) {
  const { lab, initial, ...rest } = props;
  const storage = useSimulatedStorage(initial);
  return (
    <div style={{ width: 420 }}>
      <FileField
        label="Attachments"
        value={storage.value}
        onChange={storage.setValue}
        uploads={storage.uploads}
        onSelect={storage.select}
        onUploadRemove={storage.removeUpload}
        data-lab-field={lab}
        {...rest}
      />
      <LabOutput name={`${lab}-value`}>{formatFiles(storage.value)}</LabOutput>
    </div>
  );
}

/** Media files with their own previews and an Open action beside the download link. */
function MediaFiles() {
  const [opened, setOpened] = useState('nothing');
  const clip: FileFieldItem = {
    id: 'clip',
    name: 'Harbour tour.mp4',
    size: 12_400_000,
    type: 'video/mp4',
    previewUrl: swatch('#0f766e'),
  };
  return (
    <div style={{ width: 420 }}>
      <FileField
        label="Recordings"
        allowsMultiple
        defaultValue={[clip, song, harbour]}
        onSelect={() => {}}
        renderFilePreview={(file) =>
          file.type?.startsWith('video/') ? (
            <video aria-label={file.name} poster={file.previewUrl} width={48} height={32} />
          ) : null
        }
        renderFileActions={(file) => (
          <button type="button" onClick={() => setOpened(file.name)}>
            Open
          </button>
        )}
        data-lab-field="media"
      />
      <LabOutput name="opened">{opened}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States and label layouts"
      description="Every field state in every label layout. The dirty state added Notes.txt and removed Harbour.png, which can be put back; the pending state has an upload running."
    >
      <StateMatrix
        axes={{ state: fieldStates, layout: fieldLayouts }}
        render={({ state, layout }) => <Sample state={state} layout={layout} />}
      />
    </LabSection>
    <LabSection
      title="Uploading"
      description='Choose files: the lab plays the owner, uploads them and adds them to the value. A file whose name starts with "fail" fails halfway; dismiss it with its remove button.'
    >
      <Uploading lab="uploads" initial={[report]} allowsMultiple maxSize={5 * 1024 * 1024} />
    </LabSection>
    <LabSection
      title="One image, dropped"
      description="A drop zone that takes one image of up to 1 MB; remove the image to choose another."
    >
      <Uploading
        lab="single"
        initial={[]}
        variant="dropzone"
        acceptedFileTypes={['image/*']}
        maxSize={1024 * 1024}
        isRequired
      />
    </LabSection>
    <LabSection
      title="Previews and actions"
      description="The owner draws a video's preview and adds an Open action to each file."
    >
      <MediaFiles />
    </LabSection>
  </>,
);
