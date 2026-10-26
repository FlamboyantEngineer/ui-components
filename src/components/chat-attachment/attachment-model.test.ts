import { describe, expect, it } from 'vitest';
import {
  getAttachmentGlyph,
  getAttachmentImage,
  getAttachmentKind,
  resolveAttachmentStatus,
  toAttachmentUrl,
} from './attachment-model.js';

describe('attachment model', () => {
  it('UIC-CHAT-ATTACHMENT-1.1 reads the kind from the media type', () => {
    expect(getAttachmentKind('image/png', 'a')).toBe('image');
    expect(getAttachmentKind('Application/PDF', 'a')).toBe('pdf');
    expect(getAttachmentKind('application/zip', 'a')).toBe('archive');
    expect(getAttachmentKind('application/x-7z-compressed', 'a')).toBe('archive');
    expect(getAttachmentKind('text/markdown', 'a')).toBe('text');
    expect(getAttachmentKind('application/json', 'a')).toBe('text');
    expect(getAttachmentKind('video/mp4', 'a.png')).toBe('file');
  });

  it('UIC-CHAT-ATTACHMENT-1.1 reads the kind from the extension when the type says nothing', () => {
    expect(getAttachmentKind('', 'Notes.MD')).toBe('text');
    expect(getAttachmentKind('application/octet-stream', 'backup.tar')).toBe('archive');
    expect(getAttachmentKind('', 'scan.pdf')).toBe('pdf');
    expect(getAttachmentKind('', 'photo.jpeg')).toBe('image');
    expect(getAttachmentKind('', 'README')).toBe('file');
  });

  it('UIC-CHAT-ATTACHMENT-1.1 defaults the status to error with an error, else complete', () => {
    expect(resolveAttachmentStatus({})).toBe('complete');
    expect(resolveAttachmentStatus({ error: 'Too large' })).toBe('error');
    expect(resolveAttachmentStatus({ status: 'uploading', error: 'Too large' })).toBe('uploading');
  });

  it('UIC-CHAT-ATTACHMENT-1.3 picks the glyph of the kind, else of the media family', () => {
    expect(getAttachmentGlyph('pdf', 'application/pdf')).toBe('file-pdf');
    expect(getAttachmentGlyph('archive', 'application/zip')).toBe('file-archive');
    expect(getAttachmentGlyph('text', 'text/plain')).toBe('file-text');
    expect(getAttachmentGlyph('image', '')).toBe('image');
    expect(getAttachmentGlyph('file', 'audio/ogg')).toBe('audio');
    expect(getAttachmentGlyph('file', 'application/x-unknown')).toBe('file');
  });

  it('UIC-CHAT-ATTACHMENT-1.8 keeps relative URLs and the http, https, blob and data schemes only', () => {
    expect(toAttachmentUrl('/files/a.png')).toBe('/files/a.png');
    expect(toAttachmentUrl('https://example.com/a.png')).toBe('https://example.com/a.png');
    expect(toAttachmentUrl('blob:https://example.com/1')).toBe('blob:https://example.com/1');
    expect(toAttachmentUrl('data:image/png;base64,AA==')).toBe('data:image/png;base64,AA==');
    expect(toAttachmentUrl('javascript:alert(1)')).toBeUndefined();
    expect(toAttachmentUrl(undefined)).toBeUndefined();
    expect(
      getAttachmentImage({
        name: 'a.png',
        mediaType: 'image/png',
        thumbnailUrl: 'javascript:alert(1)',
        url: '/a.png',
      }),
    ).toBe('/a.png');
    expect(getAttachmentImage({ name: 'a.pdf', mediaType: 'application/pdf', url: '/a.pdf' })).toBe(
      undefined,
    );
  });
});
