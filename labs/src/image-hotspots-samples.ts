// Offline sample images for the Image Hotspots lab: two generic equipment panels drawn as SVG, and
// the hotspot rectangles over their parts, in percent of each drawing's size.

import type { ImageHotspotsItem } from '../../src/components/image-hotspots/index.js';

/** A drawn panel: its address, size and the parts its hotspots cover. */
export interface SamplePanel {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const frontSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
<rect width="800" height="400" rx="16" fill="#3d4450"/>
<rect x="16" y="16" width="768" height="368" rx="10" fill="#525b69"/>
<g font-family="sans-serif" font-size="18" fill="#e8ecf2">
<text x="80" y="76">Power</text><text x="240" y="76">Output A</text><text x="400" y="76">Output B</text>
<text x="560" y="76">Fuse</text><text x="80" y="246">Range</text><text x="400" y="246">Status</text>
</g>
<rect x="80" y="100" width="80" height="60" rx="8" fill="#20252c"/><rect x="88" y="108" width="32" height="44" rx="4" fill="#c7ced8"/>
<rect x="240" y="100" width="80" height="60" rx="8" fill="#20252c"/><rect x="248" y="108" width="64" height="44" rx="4" fill="#6f7a89"/>
<rect x="400" y="100" width="80" height="60" rx="8" fill="#20252c"/><rect x="408" y="108" width="64" height="44" rx="4" fill="#6f7a89"/>
<rect x="560" y="96" width="64" height="88" rx="6" fill="#20252c"/><rect x="576" y="112" width="32" height="56" rx="4" fill="#3d4450" stroke="#e0b341" stroke-width="3" stroke-dasharray="6 4"/>
<circle cx="140" cy="310" r="44" fill="#20252c"/><circle cx="140" cy="310" r="32" fill="#8d97a5"/><rect x="137" y="276" width="6" height="22" fill="#20252c"/>
<circle cx="420" cy="300" r="14" fill="#5ec27a"/><circle cx="470" cy="300" r="14" fill="#e0b341"/><circle cx="520" cy="300" r="14" fill="#6f7a89"/>
<rect x="640" y="260" width="96" height="88" rx="8" fill="#20252c"/>
<g font-family="sans-serif" font-size="14" fill="#e8ecf2"><text x="652" y="284">Inset</text></g>
<rect x="652" y="296" width="32" height="32" rx="4" fill="#6f7a89"/><rect x="692" y="296" width="32" height="32" rx="4" fill="#6f7a89"/>
</svg>`;

const rearSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
<rect width="600" height="600" rx="16" fill="#3d4450"/>
<rect x="16" y="16" width="568" height="568" rx="10" fill="#525b69"/>
<g font-family="sans-serif" font-size="18" fill="#e8ecf2">
<text x="60" y="80">Input 1</text><text x="240" y="80">Input 2</text><text x="420" y="80">Input 3</text>
<text x="60" y="330">Supply</text><text x="360" y="330">Vent</text>
</g>
<circle cx="100" cy="150" r="40" fill="#20252c"/><circle cx="100" cy="150" r="14" fill="#c7ced8"/>
<circle cx="280" cy="150" r="40" fill="#20252c"/><circle cx="280" cy="150" r="14" fill="#c7ced8"/>
<circle cx="460" cy="150" r="40" fill="#20252c"/><circle cx="460" cy="150" r="14" fill="#c7ced8"/>
<rect x="60" y="360" width="200" height="140" rx="10" fill="#20252c"/><rect x="100" y="400" width="120" height="60" rx="6" fill="#8d97a5"/>
<g fill="#20252c"><rect x="360" y="360" width="180" height="16" rx="4"/><rect x="360" y="392" width="180" height="16" rx="4"/><rect x="360" y="424" width="180" height="16" rx="4"/><rect x="360" y="456" width="180" height="16" rx="4"/></g>
</svg>`;

export const frontPanel: SamplePanel = {
  id: 'front',
  name: 'Front panel',
  src: toDataUri(frontSvg),
  width: 800,
  height: 400,
};

export const rearPanel: SamplePanel = {
  id: 'rear',
  name: 'Rear panel',
  src: toDataUri(rearSvg),
  width: 600,
  height: 600,
};

/** An address that fails at once, offline: a PNG with no image data. */
export const brokenImageSrc = 'data:image/png;base64,AAAA';

/** The caller's state for the front panel: what is on, and which parts need attention. */
export interface FrontPanelState {
  power: boolean;
  outputA: boolean;
  outputB: boolean;
  /** The fuse is missing, so the fuse holder refuses presses and warns. */
  isFuseMissing: boolean;
}

/**
 * The front panel's hotspots for a state. Output A and its inset copy share one state, so both show
 * it; outputs refuse presses while the power is off.
 */
export function frontHotspots(state: FrontPanelState): ImageHotspotsItem[] {
  const off = !state.power;
  return [
    { id: 'power', label: 'Power', x: 10, y: 25, width: 10, height: 15, isPressed: state.power },
    {
      id: 'output-a',
      label: 'Output A',
      x: 30,
      y: 25,
      width: 10,
      height: 15,
      isPressed: state.outputA,
      isDisabled: off,
    },
    {
      id: 'output-b',
      label: 'Output B',
      x: 50,
      y: 25,
      width: 10,
      height: 15,
      isPressed: state.outputB,
      isDisabled: off,
    },
    {
      id: 'fuse',
      label: 'Fuse holder',
      x: 70,
      y: 24,
      width: 8,
      height: 22,
      isDisabled: state.isFuseMissing,
      tone: state.isFuseMissing ? 'warning' : undefined,
      message: state.isFuseMissing ? 'Fuse missing' : undefined,
    },
    { id: 'range', label: 'Range dial', x: 12, y: 66.5, width: 11, height: 22 },
    {
      id: 'status',
      label: 'Status lamps',
      x: 50.5,
      y: 71.5,
      width: 16.5,
      height: 7,
      tone: 'info',
      message: 'Lamps show the last check',
    },
    {
      id: 'inset-a',
      label: 'Output A, inset',
      x: 81.5,
      y: 74,
      width: 4,
      height: 8,
      isPressed: state.outputA,
      isDisabled: off,
    },
  ];
}

/** The rear panel's hotspots: plain buttons, one per part. */
export const rearHotspots: readonly ImageHotspotsItem[] = [
  { id: 'input-1', label: 'Input 1', x: 10, y: 18.3, width: 13.3, height: 13.3 },
  { id: 'input-2', label: 'Input 2', x: 40, y: 18.3, width: 13.3, height: 13.3 },
  { id: 'input-3', label: 'Input 3', x: 70, y: 18.3, width: 13.3, height: 13.3 },
  { id: 'supply', label: 'Supply', x: 10, y: 60, width: 33.3, height: 23.3 },
  {
    id: 'vent',
    label: 'Vent',
    x: 60,
    y: 60,
    width: 30,
    height: 18.7,
    tone: 'danger',
    message: 'Keep clear',
  },
];
