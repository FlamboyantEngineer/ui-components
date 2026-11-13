import { useState } from 'react';
import {
  AssetPicker,
  type AssetPickerItem,
  type AssetPlacement,
} from '../../src/components/asset-picker/index.js';
import { LabSection, mountLab } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

/** A flat swatch as an SVG data address, standing in for a thumbnail. */
function swatch(color: string, width: number, height: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${color}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const library: AssetPickerItem[] = [
  {
    id: 'loaf',
    name: 'Round loaf',
    alt: 'A round loaf on a board',
    width: 800,
    height: 600,
    color: '#c8874a',
  },
  {
    id: 'rolls',
    name: 'Bread rolls',
    alt: 'Six rolls in a basket',
    width: 600,
    height: 600,
    color: '#d9a066',
  },
  {
    id: 'wheat',
    name: 'Wheat field',
    alt: 'A wheat field at dusk',
    width: 1200,
    height: 500,
    color: '#e1c16e',
  },
  { id: 'flour', name: 'Flour sack', width: 400, height: 640, color: '#efe7da' },
  {
    id: 'oven',
    name: 'Stone oven',
    alt: 'A stone oven with a fire',
    width: 900,
    height: 600,
    color: '#8a5a44',
  },
  { id: 'jam', name: 'Plum jam', color: '#6b2d5c' },
].map(({ color, ...asset }) => ({
  ...asset,
  thumbnailSrc: swatch(color, 120, 90),
}));

/** Answers after a short wait, as a server would, and stops when the search moves on. */
function searchLibrary(query: string, signal: AbortSignal): Promise<AssetPickerItem[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const words = query.toLowerCase();
      resolve(library.filter((asset) => asset.name.toLowerCase().includes(words)));
    }, 300);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

function failingSearch(): Promise<AssetPickerItem[]> {
  return Promise.reject(new Error('The library is offline.'));
}

function describePlacement(item: AssetPickerItem, placement: AssetPlacement) {
  const size = `${placement.width ?? '?'} × ${placement.height ?? '?'}`;
  return `${item.name}, ${size}, ${placement.align}, alt "${placement.alt}"`;
}

function InsertDemo() {
  const [inserted, setInserted] = useState('nothing');
  return (
    <div data-lab-demo="insert" style={{ maxWidth: 520 }}>
      <AssetPicker
        aria-label="Insert an image"
        search={searchLibrary}
        onSelect={(item, placement) => setInserted(describePlacement(item, placement))}
        onCancel={() => setInserted('cancelled')}
      />
      <p>
        Inserted: <output data-lab-inserted>{inserted}</output>
      </p>
    </div>
  );
}

function AlignedDemo() {
  const [inserted, setInserted] = useState('nothing');
  return (
    <div data-lab-demo="aligned" style={{ maxWidth: 520 }}>
      <AssetPicker
        aria-label="Insert a centred image"
        search={searchLibrary}
        defaultAlign="center"
        searchDelay={1000}
        onSelect={(item, placement) => setInserted(describePlacement(item, placement))}
      />
      <LabOutput name="aligned">{inserted}</LabOutput>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Browse, search and place"
      description="The picker browses the library as it opens and searches as you type. Choose an image, set its alternative text, size (kept in proportion until you turn that off) and alignment, then insert it."
    >
      <InsertDemo />
    </LabSection>
    <LabSection
      title="Failed search"
      description="A search that fails says so in the grid; nothing can be inserted."
    >
      <div data-lab-demo="failed" style={{ maxWidth: 520 }}>
        <AssetPicker
          aria-label="Insert from an offline library"
          search={failingSearch}
          onSelect={() => {}}
        />
      </div>
    </LabSection>
    <LabSection
      title="Alignment and search delay"
      description="A chosen image starts centred instead of at the start, and the search waits a full second after the last keystroke."
    >
      <AlignedDemo />
    </LabSection>
  </>,
);
