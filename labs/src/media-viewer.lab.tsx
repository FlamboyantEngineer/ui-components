import { type CSSProperties, type ReactNode, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  MediaViewer,
  type MediaViewerItem,
} from '../../src/components/media-viewer/media-viewer.js';
import { PdfViewer } from '../../src/components/pdf-viewer/pdf-viewer.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import {
  ArrivingItems,
  FailingImages,
  LargeSet,
  NoteDrafts,
  RefreshingList,
  WheelZoom,
} from './media-viewer-cases.js';
import { loadEngine, sampleUrl, workerSrc } from './pdf-viewer-cases.js';
import { requireDefined } from './require-defined.js';

/** A drawn landscape of the given size, as an SVG data URL. */
function scene(width: number, height: number, sky: string, ground: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${sky}"/><circle cx="${width * 0.75}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.1}" fill="#fde68a"/><path d="M0 ${height * 0.7} L${width * 0.35} ${height * 0.4} L${width * 0.6} ${height * 0.65} L${width} ${height * 0.45} V${height} H0 Z" fill="${ground}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const harbour = scene(1600, 900, '#93c5fd', '#1e3a8a');
const tower = scene(700, 1200, '#fecaca', '#7f1d1d');
const meadow = scene(1200, 1200, '#bbf7d0', '#166534');

const photos: MediaViewerItem[] = [
  {
    id: 'harbour',
    src: harbour,
    name: 'Harbour.svg',
    type: 'image/svg+xml',
    alt: 'Blue hills under a pale sky with a low sun',
    caption: 'The harbour at dawn, from the lighthouse path.',
    downloadUrl: harbour,
  },
  {
    id: 'tower',
    src: tower,
    name: 'Tower.svg',
    type: 'image/svg+xml',
    alt: 'Red hills under a pink sky, in portrait',
    caption: 'The old tower in the evening.',
    downloadUrl: tower,
  },
  {
    id: 'meadow',
    src: meadow,
    name: 'Meadow.svg',
    type: 'image/svg+xml',
    alt: 'Green hills under a mint sky',
  },
];

const brokenThumbnail = 'data:image/png;base64,bm90IGFuIGltYWdl';

const mixed: MediaViewerItem[] = [
  photos[0] as MediaViewerItem,
  {
    id: 'report',
    src: sampleUrl,
    name: 'Seasonal report.pdf',
    type: 'application/pdf',
    caption: 'Rendered by the PDF viewer.',
    downloadUrl: sampleUrl,
  },
  { id: 'notes', src: 'notes.txt', name: 'Notes.txt', type: 'text/plain' },
  { id: 'archive', src: 'files.zip', name: 'Files.zip', type: 'application/zip' },
  // The thumbnail is not an image and fails to decode, so the strip shows the image glyph instead.
  { ...requireDefined(photos[1]), id: 'no-thumbnail', thumbnailUrl: brokenThumbnail },
];

const typed: MediaViewerItem[] = [
  { ...requireDefined(photos[0]), id: 1 },
  { ...requireDefined(photos[1]), id: '1' },
];
const sets = { photos, mixed, single: [photos[2] as MediaViewerItem], typed } as const;
type SetName = keyof typeof sets;

/** Renders the PDF of a mixed set in the library's PDF viewer; other files fall back. */
function renderFile(item: MediaViewerItem): ReactNode {
  if (item.type !== 'application/pdf') return null;
  return (
    <PdfViewer
      source={item.src}
      loadEngine={loadEngine}
      workerSrc={workerSrc}
      aria-label={item.name}
    />
  );
}

/** A button that opens the viewer on a set at its first or last item. */
function Opener({ set, opens }: { set: SetName; opens: 'first' | 'last' }) {
  const [isOpen, setOpen] = useState(false);
  const items = sets[set];
  const start = opens === 'first' ? items[0] : items.at(-1);
  return (
    <>
      <Button onPress={() => setOpen(true)} data-lab-open={`${set}-${opens}`}>
        Open {start?.name}
      </Button>
      <MediaViewer
        items={items}
        defaultSelectedKey={start?.id}
        isOpen={isOpen}
        onOpenChange={setOpen}
        renderItem={renderFile}
      />
    </>
  );
}

/** A viewer whose images open at twice their fit. */
function ZoomedAtFirst() {
  const [isOpen, setOpen] = useState(false);
  return (
    <div data-lab-demo="default-zoom">
      <Button onPress={() => setOpen(true)}>Open the photos zoomed in</Button>
      <MediaViewer items={photos} defaultZoom={200} isOpen={isOpen} onOpenChange={setOpen} />
    </div>
  );
}

/** A gallery of thumbnails, each opening the viewer at its photo. */
const thumbnailButton: CSSProperties = {
  padding: 3,
  border: '1px solid var(--ref-border, currentColor)',
  borderRadius: 'var(--ref-radius, 4px)',
  background: 'none',
  cursor: 'pointer',
};

function Gallery() {
  const [selected, setSelected] = useState<Key | null>(null);
  const [shown, setShown] = useState<Key>('none');
  return (
    <>
      <div style={{ display: 'flex', gap: 8 }} data-lab-gallery="photos">
        {photos.map((photo) => (
          // Lab-only thumbnail: a plain button that takes its image's size, unlike a control.
          <button
            key={photo.id}
            type="button"
            aria-label={`View ${photo.name}`}
            style={thumbnailButton}
            onClick={() => {
              setSelected(photo.id);
              setShown(photo.id);
            }}
          >
            <img
              src={photo.src}
              alt=""
              width={96}
              height={64}
              style={{ display: 'block', objectFit: 'cover' }}
            />
          </button>
        ))}
      </div>
      <MediaViewer
        items={photos}
        selectedKey={selected ?? undefined}
        isOpen={selected !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
        onSelectionChange={(key) => {
          setSelected(key);
          setShown(key);
        }}
      />
      <LabOutput name="shown">{String(shown)}</LabOutput>
    </>
  );
}

mountLab(
  <>
    <LabSection
      title="Sets"
      description="Photos of three shapes, a mixed set, a single photo, and two photos with distinct numeric and text keys of the same spelling. In the mixed set, focus the PDF pages to use Page Up and Page Down within the document. Focus the outer viewport to use those keys to move between files."
    >
      <StateMatrix
        axes={{ set: Object.keys(sets) as SetName[], opens: ['first', 'last'] }}
        render={({ set, opens }) => <Opener set={set} opens={opens} />}
      />
    </LabSection>
    <LabSection
      title="Gallery"
      description="Press a photo to open it. Arrow keys move through the set, + and - zoom, the header turns and downloads, and Escape closes."
    >
      <Gallery />
    </LabSection>
    <LabSection
      title="Wheel zoom"
      description="The page holds the zoom and opens the viewer at 100% or 200%. The wheel or a touchpad pinch over the image steps the zoom and keeps the point under the pointer in place once the image overflows; the zoom control has a reset button. Moving to the next photo asks for 100% again."
    >
      <WheelZoom items={photos} />
    </LabSection>
    <LabSection
      title="Large set"
      description="A hundred photos without thumbnail URLs: the shown photo loads at once, and the thumbnails load as the strip scrolls to them."
    >
      <LargeSet />
    </LabSection>
    <LabSection
      title="Loading and failure"
      description="An expired link and a missing file: each explains why it failed, and the page answers the expired link with a fresh URL. Press Retry to focus the viewport during loading. Move from the missing image to the text file and back to request the image again."
    >
      <FailingImages />
    </LabSection>
    <LabSection
      title="Drafts per file"
      description="Text files the page renders as drafts. Edit one and move to the next: each file starts its own draft."
    >
      <NoteDrafts />
    </LabSection>
    <LabSection
      title="Refreshing list"
      description="A viewer opened on mount. Close it, then refresh the list: it empties for a moment and fills again, and the viewer stays closed."
    >
      <RefreshingList />
    </LabSection>
    <LabSection
      title="Items that arrive"
      description="The viewer opens before its items load. Once they do, the first item shows; a moment later the list reverses and that item stays shown, by its id, with no selection reported."
    >
      <ArrivingItems />
    </LabSection>
    <LabSection
      title="Starting zoom"
      description="defaultZoom 200: each photo opens at twice its fit, and moving to the next photo starts it there again."
    >
      <ZoomedAtFirst />
    </LabSection>
  </>,
);
