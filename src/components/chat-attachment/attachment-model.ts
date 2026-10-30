import {
  FileArchiveGlyph,
  FilePdfGlyph,
  FileTextGlyph,
  type GlyphComponent,
} from '../../core/glyphs.js';
// The attachment data contract and what is derived from it: the kind of file (from its media type
// or, for a generic type, its name), its glyph, its status and the URLs it may show.

import { getFileGlyph } from '../../utils/file-glyph.js';
import { isSafeUrl } from '../../utils/safe-url.js';

/** The kinds an attachment can be: `file` is any other or unknown type. */
export type ChatAttachmentKind = 'image' | 'pdf' | 'archive' | 'text' | 'file';

/** Where an attachment's upload stands: still `uploading`, `complete`, or failed with an `error`. */
export type ChatAttachmentStatus = 'uploading' | 'complete' | 'error';

/** One file attached to a message or to the composer. The host uploads it and reports its status. */
export interface ChatAttachmentData {
  /** Unique among the attachments shown together. */
  id: string;
  /** The file name, with its extension. */
  name: string;
  /** The MIME type, such as `image/png`; empty when unknown. */
  mediaType: string;
  /** In bytes. */
  size?: number | undefined;
  /** Where the file is: an image shows from it, and a complete attachment offers it for download. */
  url?: string | undefined;
  /** A smaller image to show in place of `url`. */
  thumbnailUrl?: string | undefined;
  /** Defaults to `error` when there is an `error`, else `complete`. */
  status?: ChatAttachmentStatus | undefined;
  /** The uploaded share, from 0 to 1, while uploading; without it the progress is indeterminate. */
  progress?: number | undefined;
  /** Why the upload failed. */
  error?: string | undefined;
}

const archiveTypes = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/gzip',
  'application/x-gzip',
  'application/x-tar',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-bzip2',
  'application/x-xz',
]);

const textTypes = new Set(['application/json', 'application/xml', 'application/yaml']);

/** Media types that say nothing about the file, so its name decides. */
const genericTypes = new Set(['', 'application/octet-stream']);

const extensionKinds: Readonly<Record<string, ChatAttachmentKind>> = {
  avif: 'image',
  gif: 'image',
  jpeg: 'image',
  jpg: 'image',
  png: 'image',
  svg: 'image',
  webp: 'image',
  pdf: 'pdf',
  '7z': 'archive',
  bz2: 'archive',
  gz: 'archive',
  rar: 'archive',
  tar: 'archive',
  tgz: 'archive',
  xz: 'archive',
  zip: 'archive',
  csv: 'text',
  json: 'text',
  log: 'text',
  md: 'text',
  txt: 'text',
  xml: 'text',
  yaml: 'text',
  yml: 'text',
};

const kindGlyphs: Readonly<Partial<Record<ChatAttachmentKind, GlyphComponent>>> = {
  pdf: FilePdfGlyph,
  archive: FileArchiveGlyph,
  text: FileTextGlyph,
};

/** The schemes an attachment's thumbnail and download URLs may use, besides relative URLs. */
const urlSchemes = ['http', 'https', 'blob', 'data'];

function kindOfType(type: string): ChatAttachmentKind {
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'pdf';
  if (archiveTypes.has(type)) return 'archive';
  if (type.startsWith('text/') || textTypes.has(type)) return 'text';
  return 'file';
}

/**
 * The attachment's kind from its media type (`image/*`, `application/pdf`, archive types, `text/*`
 * and structured text), or from its name's extension when the type is empty or
 * `application/octet-stream`.
 */
export function getAttachmentKind(mediaType: string, name: string): ChatAttachmentKind {
  const type = mediaType.trim().toLowerCase();
  if (!genericTypes.has(type)) return kindOfType(type);
  const extension = /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase() ?? '';
  return extensionKinds[extension] ?? 'file';
}

/** The glyph of a kind; other files take the glyph of their media family (video, audio, file). */
export function getAttachmentGlyph(kind: ChatAttachmentKind, mediaType: string): GlyphComponent {
  return kindGlyphs[kind] ?? getFileGlyph(kind === 'image' ? 'image/' : mediaType);
}

/** The attachment's status: as given, else `error` with an error, else `complete`. */
export function resolveAttachmentStatus(
  data: Pick<ChatAttachmentData, 'status' | 'error'>,
): ChatAttachmentStatus {
  return data.status ?? (data.error ? 'error' : 'complete');
}

/** The image an attachment shows, from its thumbnail or its URL, when it is an image. */
export function getAttachmentImage(
  data: Pick<ChatAttachmentData, 'mediaType' | 'name' | 'url' | 'thumbnailUrl'>,
): string | undefined {
  if (getAttachmentKind(data.mediaType, data.name) !== 'image') return undefined;
  return toAttachmentUrl(data.thumbnailUrl) ?? toAttachmentUrl(data.url);
}

/** The URL when it is relative or uses a scheme an attachment may show, else `undefined`. */
export function toAttachmentUrl(url: string | undefined): string | undefined {
  return url && isSafeUrl(url, urlSchemes) ? url : undefined;
}
