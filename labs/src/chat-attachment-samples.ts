import type {
  ChatAttachmentData,
  ChatAttachmentKind,
} from '../../src/components/chat-attachment/chat-attachment.js';

/** A drawn landscape of the given size, as an SVG data URL. */
function scene(width: number, height: number, sky: string, ground: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${sky}"/><circle cx="${width * 0.75}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.1}" fill="#fde68a"/><path d="M0 ${height * 0.7} L${width * 0.35} ${height * 0.4} L${width * 0.6} ${height * 0.65} L${width} ${height * 0.45} V${height} H0 Z" fill="${ground}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A small text file, as a data URL to download. */
function textFile(text: string): string {
  return `data:text/plain,${encodeURIComponent(text)}`;
}

export const harbour = scene(1600, 900, '#93c5fd', '#1e3a8a');
const tower = scene(700, 1200, '#fecaca', '#7f1d1d');
const meadow = scene(1200, 1200, '#bbf7d0', '#166534');
const dunes = scene(1400, 800, '#fde68a', '#92400e');

export const attachmentKinds = [
  'image',
  'pdf',
  'archive',
  'text',
  'file',
] as const satisfies readonly ChatAttachmentKind[];

/** One complete attachment of each kind; `file` is a type the library does not know. */
export const kindSamples: Record<ChatAttachmentKind, ChatAttachmentData> = {
  image: {
    id: 'image',
    name: 'Harbour.svg',
    mediaType: 'image/svg+xml',
    size: 1_840_000,
    url: harbour,
  },
  pdf: {
    id: 'pdf',
    name: 'Trip itinerary.pdf',
    mediaType: 'application/pdf',
    size: 482_000,
    url: textFile('Day one: the harbour. Day two: the old tower.'),
  },
  archive: {
    id: 'archive',
    name: 'Photos from the coast.zip',
    mediaType: 'application/zip',
    size: 24_600_000,
    url: textFile('An archive of photos.'),
  },
  text: {
    id: 'text',
    name: 'Packing list.txt',
    mediaType: 'text/plain',
    size: 1_200,
    url: textFile('Boots, map, water bottle.'),
  },
  file: {
    id: 'file',
    name: 'Saved session.dat',
    mediaType: 'application/x-session',
    size: 96_000,
    url: textFile('A file of a type the library does not know.'),
  },
};

/** The photos and files of a trip, shared in one message. */
export const tripAttachments: ChatAttachmentData[] = [
  { id: 'harbour', name: 'Harbour.svg', mediaType: 'image/svg+xml', url: harbour },
  { id: 'tower', name: 'Tower.svg', mediaType: 'image/svg+xml', url: tower },
  { id: 'meadow', name: 'Meadow.svg', mediaType: 'image/svg+xml', url: meadow },
  { id: 'dunes', name: 'Dunes.svg', mediaType: 'image/svg+xml', url: dunes },
  kindSamples.pdf,
  kindSamples.text,
];

/** Files waiting in the composer: sent, uploading, failed and one more photo. */
export const composerAttachments: ChatAttachmentData[] = [
  { ...kindSamples.image, id: 'draft-photo' },
  { ...kindSamples.pdf, id: 'draft-plan', status: 'uploading', progress: 0.3 },
  {
    ...kindSamples.archive,
    id: 'draft-archive',
    status: 'error',
    error: 'The connection dropped.',
  },
  { ...kindSamples.text, id: 'draft-list' },
  { id: 'draft-dunes', name: 'Dunes.svg', mediaType: 'image/svg+xml', size: 920_000, url: dunes },
];
