// Cases of the annotation layer lab in which the layer's surroundings change how its anchors show:
// a zoomed surface around the layer, and sheets of different widths whose markers follow each
// sheet's edge.

import { useLayoutEffect, useRef, useState } from 'react';
import {
  AnnotationLayer,
  type AnnotationLayerHandle,
  AnnotationMargin,
} from '../../src/components/annotation-layer/annotation-layer.js';
import { Button } from '../../src/components/button/button.js';
import type { Key } from '../../src/core/props.js';

const zooms = {
  'Actual size': [1, 1],
  'Zoom 150%': [1.5, 1.5],
  'Stretch 150% by 200%': [1.5, 2],
} as const;

type Zoom = keyof typeof zooms;

/**
 * A review drawn on a surface the caller zooms with a CSS scale, the same or different across and
 * down. A transform moves nothing the layer can observe, so the caller asks it to measure again.
 */
export function ZoomedReview() {
  const [zoom, setZoom] = useState<Zoom>('Zoom 150%');
  const [currentKey, setCurrentKey] = useState<Key | null>(null);
  const handleRef = useRef<AnnotationLayerHandle>(null);
  useLayoutEffect(() => handleRef.current?.remeasure(), [zoom]);
  const [scaleX, scaleY] = zooms[zoom];
  return (
    <div data-lab-demo="zoomed">
      <p>
        {Object.keys(zooms).map((name) => (
          <Button
            key={name}
            size="sm"
            variant={name === zoom ? 'primary' : 'secondary'}
            onPress={() => setZoom(name as Zoom)}
          >
            {name}
          </Button>
        ))}{' '}
        <Button size="sm" variant="ghost" onPress={() => setCurrentKey(null)}>
          Clear
        </Button>{' '}
        Active: <output data-lab-active>{currentKey ?? 'none'}</output>
      </p>
      <div style={{ height: 320, overflow: 'auto' }}>
        <div
          data-lab-zoom={zoom}
          style={{ width: 560, transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: '0 0' }}
        >
          <AnnotationLayer
            annotations={[{ id: 'glaze', targetId: 'zoomed-glaze' }]}
            currentKey={currentKey}
            onCurrentKeyChange={setCurrentKey}
            handleRef={handleRef}
          >
            <p>
              Brush with milk, <span id="zoomed-glaze">dust with sugar</span> and bake.
            </p>
            <AnnotationMargin renderCard={() => 'Glaze note'} />
          </AnnotationLayer>
        </div>
      </div>
    </div>
  );
}

const sheetNotes = [
  { id: 'flour', targetId: 'sheet-flour', sheet: 'wide' },
  { id: 'rest', targetId: 'sheet-rest', sheet: 'narrow' },
] as const;

/** How far the narrow sheet's edge sits before the wide one's, in pixels. */
const narrowInset = 120;

/**
 * Two sheets, the second narrower, with a marker per note: each marker starts at its own sheet's
 * edge, so the margin follows the narrow sheet in by the difference.
 */
export function StaggeredSheets() {
  const sheetOf = (id: Key) => sheetNotes.find((note) => note.id === id)?.sheet;
  return (
    <div data-lab-demo="staggered">
      <AnnotationLayer annotations={sheetNotes.map(({ id, targetId }) => ({ id, targetId }))}>
        <div>
          <p style={{ width: 360 }}>
            Sift the <span id="sheet-flour">flour twice</span> before folding it in.
          </p>
          <p style={{ width: 360 - narrowInset }}>
            Let the dough <span id="sheet-rest">rest an hour</span>.
          </p>
        </div>
        <AnnotationMargin
          aria-label="Sheet notes"
          presentation="icons"
          getInlineOffset={(annotation) => (sheetOf(annotation.id) === 'narrow' ? -narrowInset : 0)}
          renderCard={(annotation) => `Note on ${String(annotation.id)}`}
        />
      </AnnotationLayer>
    </div>
  );
}
