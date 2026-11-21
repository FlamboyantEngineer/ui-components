import { useState } from 'react';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '../../src/components/attachment/attachment.js';
import { Icon } from '../../src/components/icon/icon.js';
import { CloseGlyph, FilePdfGlyph, FileTextGlyph } from '../../src/core/glyphs.js';
import { StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const files = [
  { id: 'ferry', name: 'ferry-times.pdf', detail: '84 KB', glyph: FilePdfGlyph },
  { id: 'notes', name: 'packing-notes.txt', detail: '2 KB', glyph: FileTextGlyph },
  { id: 'route', name: 'coast-route.pdf', detail: '1.2 MB', glyph: FilePdfGlyph },
] as const;

/** Attachments composed from parts in each size and orientation, and a row of them. */
export function ComposedAttachments() {
  const [removed, setRemoved] = useState('none');
  return (
    <>
      <StateMatrix
        axes={{
          orientation: ['horizontal', 'vertical'],
          size: ['md', 'sm', 'xs'],
          status: ['complete', 'error'],
        }}
        render={({ orientation, size, status }) => (
          <Attachment
            role="group"
            aria-label={`${orientation} ${size} ${status} attachment`}
            orientation={orientation}
            size={size}
            status={status}
          >
            <AttachmentMedia>
              <Icon icon={FilePdfGlyph} size="inherit" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>ferry-times.pdf</AttachmentTitle>
              <AttachmentDescription>
                {status === 'error' ? 'Upload failed' : '84 KB'}
              </AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        )}
      />
      <div style={{ inlineSize: '22rem' }}>
        <AttachmentGroup role="list" aria-label="Composed files">
          {files.map((file) => (
            <Attachment key={file.id} role="listitem" size="sm">
              <AttachmentMedia>
                <Icon icon={file.glyph} size="inherit" />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{file.name}</AttachmentTitle>
                <AttachmentDescription>{file.detail}</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  label={`Remove ${file.name}`}
                  icon={CloseGlyph}
                  onPress={() => setRemoved(file.name)}
                />
              </AttachmentActions>
            </Attachment>
          ))}
        </AttachmentGroup>
      </div>
      <LabOutput name="Removed">{removed}</LabOutput>
    </>
  );
}
