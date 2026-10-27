import { useEffect, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ChatAttachment,
  ChatAttachmentList,
  type ChatAttachmentData,
} from '../../src/components/chat-attachment/chat-attachment.js';
import { MessageComposer } from '../../src/components/message-composer/message-composer.js';
import {
  attachmentKinds,
  composerAttachments,
  kindSamples,
  tripAttachments,
} from './chat-attachment-samples.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
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
const statusData: Record<MatrixStatus, Partial<ChatAttachmentData>> = {
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
            <ChatAttachment
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
function advanceUpload(attachment: ChatAttachmentData): ChatAttachmentData {
  if (attachment.status !== 'uploading') return attachment;
  const progress = Math.min(1, (attachment.progress ?? 0) + uploadStep);
  return progress < 1
    ? { ...attachment, progress }
    : { ...attachment, status: 'complete', progress: undefined };
}

/** Simulates the host's uploads: progress advances every tick, and Retry starts a failed one again. */
function useSimulatedUploads(initial: readonly ChatAttachmentData[]) {
  const [attachments, setAttachments] = useState<ChatAttachmentData[]>([...initial]);
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
            <ChatAttachmentList
              aria-label="Files to send"
              attachments={uploads.attachments}
              onRemove={uploads.remove}
              onRetry={uploads.retry}
              finalFocus={inputRef}
            />
          ) : undefined
        }
        startControls={
          <Button size="sm" startIcon="plus" onPress={uploads.add}>
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
      <ChatAttachmentList aria-labelledby="trip-files" attachments={tripAttachments} />
    </div>
  );
}

/** One attachment whose thumbnail asks its owner for a preview. */
function StandalonePreview() {
  const [previews, setPreviews] = useState(0);
  return (
    <div data-lab-demo="standalone">
      <ChatAttachment {...kindSamples.image} onPreview={() => setPreviews((count) => count + 1)} />
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
      title="Gallery"
      description="A list named by its heading: the photos open the media viewer on the pressed one, with the other photos to page through; the PDF and the text file are chips."
    >
      <Gallery />
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
      <ChatAttachment
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
  </>,
);
