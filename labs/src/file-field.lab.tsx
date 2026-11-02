import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Form, type FormBlocker } from '../../src/components/form/form.js';
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

type SimulatedUpload = FileUploadItem & { stored: FileFieldItem };

interface SimulatedStorage {
  value: FileFieldItem[];
  uploads: SimulatedUpload[];
}

/** One tick of the storage: each running upload moves on, and finished ones join the value. */
function advanceStorage({ value, uploads }: SimulatedStorage): SimulatedStorage {
  const moved = uploads.map((upload) => {
    if (upload.error || (upload.progress ?? 0) >= 100) return upload;
    const progress = Math.min(100, (upload.progress ?? 0) + 25);
    return upload.name.startsWith('fail') && progress >= 50
      ? { ...upload, progress, error: 'The upload was interrupted.' }
      : { ...upload, progress };
  });
  const done = moved.filter((upload) => !upload.error && upload.progress === 100);
  return {
    value: [...value, ...done.map((upload) => upload.stored)],
    uploads: moved.filter((upload) => !done.includes(upload)),
  };
}

/** A chosen file as an upload that starts, holding the stored file it becomes. */
function toUpload(file: File): SimulatedUpload {
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
}

/**
 * Plays the owner's storage: chosen files upload over a few ticks, a file named "fail…" fails
 * halfway, and finished uploads join the field's value as stored files with download links.
 */
function useSimulatedStorage(initial: FileFieldItem[], isPaused = false) {
  const [storage, setStorage] = useState<SimulatedStorage>({ value: initial, uploads: [] });
  const { value, uploads } = storage;
  const running =
    !isPaused && uploads.some((upload) => !upload.error && (upload.progress ?? 0) < 100);
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setStorage(advanceStorage), 150);
    return () => clearInterval(timer);
  }, [running]);
  return {
    value,
    uploads,
    setValue: (next: FileFieldItem[]) => setStorage((current) => ({ ...current, value: next })),
    select: (files: File[]) => {
      const added = files.map(toUpload);
      setStorage((current) => ({ ...current, uploads: [...current.uploads, ...added] }));
    },
    removeUpload: (id: Key) =>
      setStorage((current) => ({
        ...current,
        uploads: current.uploads.filter((upload) => upload.id !== id),
      })),
  };
}

function Uploading(props: Partial<FileFieldProps> & { lab: string; initial: FileFieldItem[] }) {
  const { lab, initial, ...rest } = props;
  const storage = useSimulatedStorage(initial);
  const [received, setReceived] = useState<string[]>([]);
  return (
    <div style={{ width: 420 }}>
      <FileField
        label="Attachments"
        value={storage.value}
        onChange={storage.setValue}
        uploads={storage.uploads}
        onSelect={(files) => {
          setReceived((names) => [...names, ...files.map((file) => file.name)]);
          storage.select(files);
        }}
        onUploadRemove={storage.removeUpload}
        data-lab-field={lab}
        {...rest}
      />
      <LabOutput name={`${lab}-value`}>{formatFiles(storage.value)}</LabOutput>
      <LabOutput name={`${lab}-received`}>{received.join(' | ') || 'none'}</LabOutput>
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

/**
 * An owner that takes 2 s to arrange its upload rows: a second file chosen meanwhile is refused,
 * since the first one already fills the field.
 */
function SlowOwner() {
  const storage = useSimulatedStorage([]);
  const [received, setReceived] = useState(0);
  return (
    <div style={{ width: 420 }}>
      <FileField
        label="Cover letter"
        value={storage.value}
        onChange={storage.setValue}
        uploads={storage.uploads}
        onSelect={(files) => {
          setReceived((count) => count + files.length);
          window.setTimeout(() => storage.select(files), 2000);
        }}
        onUploadRemove={storage.removeUpload}
        data-lab-field="slow"
      />
      <LabOutput name="slow-received">{received}</LabOutput>
    </div>
  );
}

/** The form's entries as `name=value` pairs, in order. */
function describeEntries(form: HTMLFormElement): string {
  const entries = [...new FormData(form)].map(
    ([name, value]) => `${name}=${typeof value === 'string' ? value : value.name}`,
  );
  return entries.join(', ') || 'nothing';
}

/**
 * Named file fields in a library `Form`: each held file submits its id, never its bytes or an
 * upload row; a disabled field submits nothing. An empty required field, or an upload still
 * running (pause them to keep one running), keeps the form from submitting.
 */
function FilesForm() {
  const [isPaused, setPaused] = useState(false);
  const attachments = useSimulatedStorage([report, notes], isPaused);
  const signed = useSimulatedStorage([], isPaused);
  const [submitted, setSubmitted] = useState('not yet');
  const [blockers, setBlockers] = useState<readonly FormBlocker[]>([]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(describeEntries(event.currentTarget));
  };
  return (
    <div style={{ width: 420 }}>
      <Form aria-label="Files form" onSubmit={submit} onValidityChange={setBlockers}>
        <FileField
          label="Form attachments"
          name="attachments"
          allowsMultiple
          value={attachments.value}
          onChange={attachments.setValue}
          uploads={attachments.uploads}
          onSelect={attachments.select}
          onUploadRemove={attachments.removeUpload}
          data-lab-field="form-attachments"
        />
        <FileField
          label="Signed copy"
          name="signed"
          isRequired
          value={signed.value}
          onChange={signed.setValue}
          uploads={signed.uploads}
          onSelect={signed.select}
          onUploadRemove={signed.removeUpload}
          data-lab-field="form-signed"
        />
        <FileField
          label="Archived files"
          name="archived"
          isDisabled
          defaultValue={[harbour]}
          onSelect={() => {}}
        />
        <Button type="submit" variant="primary">
          Submit files
        </Button>{' '}
        <Button type="reset">Reset files</Button>
      </Form>
      <Button onPress={() => setPaused(!isPaused)}>
        {isPaused ? 'Resume uploads' : 'Pause uploads'}
      </Button>
      <LabOutput name="Files submitted">{submitted}</LabOutput>
      <LabOutput name="Files blockers">
        {blockers.map((blocker) => `${blocker.label} ${blocker.status}`).join(', ') || 'none'}
      </LabOutput>
    </div>
  );
}

const longName: FileFieldItem = {
  id: 'long',
  name: 'Harbour survey photographs, north pier, spring tide, full resolution.zip',
  size: 48_000_000,
  type: 'application/zip',
};
const committedFiles = [report, harbour, notes, longName];
const widths = { narrow: 260, wide: 420 } as const;

/**
 * Committed files with three removed, or all four, in a narrow and a wide column, under a title or
 * without one, each put back by its button.
 */
function RemovedFiles({
  width,
  title,
  kept,
}: {
  width: keyof typeof widths;
  title: 'shown' | 'hidden';
  kept: 'one' | 'none';
}) {
  const [value, setValue] = useState<FileFieldItem[]>(kept === 'one' ? [report] : []);
  return (
    <div style={{ width: widths[width] }}>
      <FileField
        label="Attachments"
        allowsMultiple
        value={value}
        onChange={setValue}
        committedValue={committedFiles}
        hideRemovedLabel={title === 'hidden'}
        onSelect={() => {}}
        data-lab-field={`removed-${width}${title === 'hidden' ? '-untitled' : ''}${kept === 'none' ? '-all' : ''}`}
      />
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
      title="Removed files"
      description="Three committed files removed, one with a long name: they follow the held files under a Removed files title, laid out like the file rows with their size and, where they have one, a download link. Each restore button puts its file back. The title is optional: without it the removed files stack right below the held ones. With none kept, every file is removed and only the removed files show."
    >
      <StateMatrix
        axes={{
          width: ['narrow', 'wide'] as const,
          title: ['shown', 'hidden'] as const,
          kept: ['one', 'none'] as const,
        }}
        render={({ width, title, kept }) => (
          <RemovedFiles width={width} title={title} kept={kept} />
        )}
      />
    </LabSection>
    <LabSection
      title="Uploading"
      description='Choose files: the lab plays the owner, uploads them and adds them to the value. A file whose name starts with "fail" fails halfway; dismiss it with its remove button.'
    >
      <Uploading lab="uploads" initial={[report]} allowsMultiple maxSize={5 * 1024 * 1024} />
    </LabSection>
    <LabSection
      title="At most three files"
      description='The field holds two committed files and takes at most three, counting held files and uploads: choose two files at once and the second is refused. A failed upload (a name starting with "fail") still takes a slot until dismissed. Remove a held file to free a slot; while the field is full again, the removed file cannot be put back. Received lists the files the owner was handed.'
    >
      <Uploading
        lab="capped"
        initial={[report, harbour]}
        committedValue={[report, harbour]}
        allowsMultiple
        maxFiles={3}
      />
    </LabSection>
    <LabSection
      title="Named in a form"
      description="Submit sends each held file's id under the field's name, and nothing for the disabled field. The empty required field blocks the submit until it holds a file. Pause uploads, then choose a file: the running upload makes the field pending and blocks the submit until it finishes or is removed. Reset puts the first files back."
    >
      <FilesForm />
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
      title="Slow owner"
      description="The owner takes 2 s to start the upload. Choose a file, then another before its row appears: the second is refused as over the limit."
    >
      <SlowOwner />
    </LabSection>
    <LabSection
      title="Previews and actions"
      description="The owner draws a video's preview and adds an Open action to each file."
    >
      <MediaFiles />
    </LabSection>
  </>,
);
