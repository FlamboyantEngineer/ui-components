import { useEffect, useRef, useState } from 'react';
import {
  Attachment,
  type AttachmentData,
  AttachmentList,
} from '../../src/components/attachment/attachment.js';
import { Button } from '../../src/components/button/button.js';
import { MessageComposer } from '../../src/components/message-composer/message-composer.js';
import { PlusGlyph } from '../../src/core/glyphs.js';
import { ComposedAttachments } from './attachment-composed.js';
import {
  attachmentKinds,
  composerAttachments,
  kindSamples,
  shapeAttachments,
  thumbnailAttachments,
  tripAttachments,
} from './attachment-samples.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const statuses = [
  'complete',
  'uploading-20',
  'uploading-75',
  'uploading-unknown',
  'error',
] as const;

type MatrixStatus = (typeof statuses)[number];

/** Each column's status; the failed uploads give no reason, so they read the default message. */
const statusData: Record<MatrixStatus, Partial<AttachmentData>> = {
  complete: { status: 'complete' },
  'uploading-20': { status: 'uploading', progress: 0.2 },
  'uploading-75': { status: 'uploading', progress: 0.75 },
  'uploading-unknown': { status: 'uploading' },
  error: { status: 'error' },
};

/** Each step of a simulated upload adds this share. */
const uploadStep = 0.25;

/** Every kind in every status, removable or not; Retry and Remove report what they would do. */
function Matrix() {
  const [last, setLast] = useState('none');
  return (
    <>
      <StateMatrix
        axes={{ status: statuses, removable: ['no', 'yes'], kind: attachmentKinds }}
        render={({ status, removable, kind }) => {
          const data = { ...kindSamples[kind], ...statusData[status] };
          return (
            <Attachment
              {...data}
              onRetry={() => setLast(`retry ${data.name}`)}
              onRemove={removable === 'yes' ? () => setLast(`remove ${data.name}`) : undefined}
            />
          );
        }}
      />
      <LabOutput name="action">{last}</LabOutput>
    </>
  );
}

/** Moves each uploading attachment on by one step, completing it at the end. */
function advanceUpload(attachment: AttachmentData): AttachmentData {
  if (attachment.status !== 'uploading') return attachment;
  const progress = Math.min(1, (attachment.progress ?? 0) + uploadStep);
  return progress < 1
    ? { ...attachment, progress }
    : { ...attachment, status: 'complete', progress: undefined };
}

/** Simulates the host's uploads: progress advances every tick, and Retry starts a failed one again. */
function useSimulatedUploads(initial: readonly AttachmentData[]) {
  const [attachments, setAttachments] = useState<AttachmentData[]>([...initial]);
  const isUploading = attachments.some((attachment) => attachment.status === 'uploading');
  useEffect(() => {
    if (!isUploading) return undefined;
    const timer = setInterval(() => setAttachments((list) => list.map(advanceUpload)), 300);
    return () => clearInterval(timer);
  }, [isUploading]);
  const added = useRef(0);
  return {
    attachments,
    add() {
      added.current += 1;
      const name = `Notes ${added.current}.txt`;
      setAttachments((list) => [
        ...list,
        {
          id: `added-${added.current}`,
          name,
          mediaType: 'text/plain',
          size: 640,
          status: 'uploading',
          progress: 0,
        },
      ]);
    },
    remove: (id: string) => setAttachments((list) => list.filter((item) => item.id !== id)),
    retry: (id: string) =>
      setAttachments((list) =>
        list.map((item) =>
          item.id === id ? { ...item, status: 'uploading', progress: 0, error: undefined } : item,
        ),
      ),
    clear: () => setAttachments([]),
  };
}

/** A composer with attached files: remove them, retry the failed one, attach more and send. */
function ComposerStrip() {
  const uploads = useSimulatedUploads(composerAttachments);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [sent, setSent] = useState('nothing');
  return (
    <div data-lab-demo="composer">
      <MessageComposer
        ref={inputRef}
        aria-label="Message"
        allowsEmptySubmit
        attachments={
          uploads.attachments.length > 0 ? (
            <AttachmentList
              aria-label="Files to send"
              attachments={uploads.attachments}
              onRemove={uploads.remove}
              onRetry={uploads.retry}
              finalFocus={inputRef}
            />
          ) : undefined
        }
        startControls={
          <Button size="sm" startIcon={PlusGlyph} onPress={uploads.add}>
            Attach a file
          </Button>
        }
        onSubmit={(text) => {
          setSent(`${text || '(no text)'} with ${uploads.attachments.length} files`);
          uploads.clear();
        }}
      />
      <LabOutput name="sent">{sent}</LabOutput>
    </div>
  );
}

/** A shared set of photos and files: each photo opens the media viewer on the others. */
function Gallery() {
  return (
    <div data-lab-demo="gallery">
      <h3 id="trip-files">Trip photos and plans</h3>
      <AttachmentList aria-labelledby="trip-files" attachments={tripAttachments} />
    </div>
  );
}

/**
 * A photo whose thumbnail and original differ: the list shows the thumbnail, the viewer the
 * original with its download; a photo with a thumbnail only shows it in both, with no download.
 */
function ThumbnailGallery() {
  return (
    <div data-lab-demo="thumbnails">
      <h3 id="thumbnail-files">Thumbnails and originals</h3>
      <AttachmentList aria-labelledby="thumbnail-files" attachments={thumbnailAttachments} />
    </div>
  );
}

/** Each image alone in its list, so each takes its single-image size, then all of them together. */
function Shapes() {
  return (
    <div data-lab-demo="shapes">
      {shapeAttachments.map((attachment) => (
        <AttachmentList
          key={attachment.id}
          aria-label={attachment.name}
          attachments={[attachment]}
        />
      ))}
      <h3 id="shape-row">Together</h3>
      <AttachmentList aria-labelledby="shape-row" attachments={shapeAttachments} />
    </div>
  );
}

/** How long the emptying gallery waits before its owner clears it. */
const clearDelay = 1500;

/**
 * A gallery its owner clears while the viewer may be open, then fills with another photo: the
 * viewer ends with the photos, focus goes to Add a photo, and the new photo opens only when pressed.
 */
function EmptyingGallery() {
  const [listed, setListed] = useState<AttachmentData[]>(tripAttachments.slice(0, 2));
  const addRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );
  return (
    <div data-lab-demo="emptying">
      <AttachmentList attachments={listed} finalFocus={addRef} />
      <Button
        size="sm"
        onPress={() => {
          timer.current = window.setTimeout(() => setListed([]), clearDelay);
        }}
      >
        Clear in a moment
      </Button>
      <Button
        ref={addRef}
        size="sm"
        onPress={() => setListed((current) => [...current, ...tripAttachments.slice(2, 3)])}
      >
        Add a photo
      </Button>
    </div>
  );
}

/** One attachment whose thumbnail asks its owner for a preview. */
function StandalonePreview() {
  const [previews, setPreviews] = useState(0);
  return (
    <div data-lab-demo="standalone">
      <Attachment {...kindSamples.image} onPreview={() => setPreviews((count) => count + 1)} />
      <LabOutput name="previews">{previews}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Kinds and statuses"
      description="An image, a PDF, an archive, a text file and a file of an unknown type: complete with a download link, uploading at 20%, at 75% and unmeasured, and failed with Retry (no reason given, so the default message names the file), each with and without a remove button."
    >
      <Matrix />
    </LabSection>
    <LabSection
      title="Right to left"
      description="In a right-to-left page a thumbnail's download link sits in its start corner, on the right, and its remove button in the end corner."
    >
      <div dir="rtl" data-lab-demo="rtl">
        <Attachment {...kindSamples.image} id="rtl-photo" onRemove={() => {}} />
      </div>
    </LabSection>
    <LabSection
      title="Gallery"
      description="A list named by its heading: the photos open the media viewer on the pressed one, with the other photos to page through; the PDF and the text file are chips."
    >
      <Gallery />
    </LabSection>
    <LabSection
      title="Image shapes"
      description="Each image keeps its own shape, from the size the host gives or the loaded image, within 320 by 240 alone and at a shared 160 row height together. A panorama wider than 3:1 and a screenshot taller than 1:2 are cropped, keeping the middle across and the top down. The host gives the screenshot's width and height, so its tile has its shape before the image loads."
    >
      <Shapes />
    </LabSection>
    <LabSection
      title="Thumbnail and original"
      description="thumbnailUrl is the small image the list shows; url is the original the media viewer opens and downloads. Lagoon's thumbnail and original carry different captions; Cove has a thumbnail only, which the viewer shows too, without a download."
    >
      <ThumbnailGallery />
    </LabSection>
    <LabSection
      title="Gallery that empties"
      description="Press Clear in a moment, then open a photo: when the owner clears the list the viewer ends with it and focus moves to Add a photo. Adding a photo then lists it without opening the viewer again. While other photos stay, a viewer whose photo leaves shows the photo now in its place."
    >
      <EmptyingGallery />
    </LabSection>
    <LabSection
      title="Composer strip"
      description="Files attached in the composer upload in the background. Removing one moves the focus to the next one's remove button, else the previous one's, else the message field; Retry starts the failed upload again."
    >
      <ComposerStrip />
    </LabSection>
    <LabSection
      title="Image without a URL and a standalone preview"
      description="An image still uploading without a preview shows as a chip with the image glyph. On its own, an attachment's thumbnail becomes a preview button when its owner offers one."
    >
      <Attachment
        id="pending-photo"
        name="Lighthouse.jpg"
        mediaType="image/jpeg"
        size={3_100_000}
        status="uploading"
        progress={0.4}
        data-lab-demo="no-url"
      />
      <StandalonePreview />
    </LabSection>
    <LabSection
      title="Composed from parts"
      description="An attachment composed from its media, content and actions, in each size and orientation, and a row of them that scrolls sideways when it does not fit."
    >
      <ComposedAttachments />
    </LabSection>
  </>,
);
